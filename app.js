// noinspection JSUnusedGlobalSymbols
function doPost(e) {
    // LINE Messaging API Token
    const CHANNEL_ACCESS_TOKEN = ''

    // Simple use json
    const msg = JSON.parse(e.postData.contents)

    // Token
    const replyToken = msg.events[0].replyToken
    const userId = msg.events[0].source.userId
    const userMessage = msg.events[0].message.text
    const eventType = msg.events[0].source.type

    // Your Google sheet info
    const sheet_url = ''
    const spreadSheet = SpreadsheetApp.openByUrl(sheet_url)

    // Choose the bot you want to use
    // const bot = new PunchBot();
    const bot = new LeaveBot()

    if (typeof replyToken === 'undefined') {
        return
    }

    // LINE account username
    const getUsername = () => {
        let reserve_name, url

        if (eventType === 'user') {
            url = `https://api.line.me/v2/bot/profile/${userId}`
        } else if (eventType === 'group') {
            const groupId = msg.events[0].source.groupId
            url = `https://api.line.me/v2/bot/group/${groupId}/member/${userId}`
        }

        try {
            //  呼叫 LINE User Info API，以 user ID 取得該帳號的使用者名稱
            const res = UrlFetchApp.fetch(url, {
                method: 'GET',
                headers: {
                    Authorization: 'Bearer ' + CHANNEL_ACCESS_TOKEN,
                    'Content-Type': 'application/json',
                },
            })
            const json = JSON.parse(res)
            reserve_name = json.displayName
        } catch {
            reserve_name = 'not available'
        }
        return String(reserve_name)
    }

    // 回傳訊息給line 並傳送給使用者
    const sendLineMessage = (reply_message) => {
        const url = 'https://api.line.me/v2/bot/message/reply'

        UrlFetchApp.fetch(url, {
            headers: {
                'Content-Type': 'application/json; charset=UTF-8',
                Authorization: 'Bearer ' + CHANNEL_ACCESS_TOKEN,
            },
            method: 'post',
            payload: JSON.stringify({
                replyToken: replyToken,
                messages: reply_message,
            }),
        })
    }

    if (bot.handle(userMessage, spreadSheet)) {
        const reserve_name = getUsername()

        sendLineMessage([
            {
                type: 'text',
                text: bot.successMessage(reserve_name),
            },
        ])
    }
}

const padLeft = (str) => {
    str = str.toString()
    return str.length >= 2 ? str : '0' + str
}

const targetSheet = (name, spreadSheet, title) => {
    let sheet = spreadSheet.getSheetByName(name)

    if (!sheet) {
        const newSheet = spreadSheet.insertSheet()
        newSheet.setName(name)

        sheet = spreadSheet.getSheetByName(name)

        const row = sheet.getLastRow()
        for (let i = 0; i < title.length; i++) {
            sheet.getRange(row + 1, i + 1).setValue(title[i])
        }
    }

    return sheet
}

class Bot {
    parseMessageData(message) {
        const data = message.split(/\r?\n/)
        const check = data.every((line) => line.includes('：'))
        return { data, check }
    }
}

// noinspection JSUnusedGlobalSymbols
class PunchBot extends Bot {
    constructor() {
        super()
        this.title = ['姓名', '日期', '上班', '下班', '純工時', '勞基法工時']
    }

    /**
     * @param name {string} 使用者名稱
     * @returns {string} 成功訊息
     */
    successMessage(name) {
        return `${name}  打卡成功`
    }

    getCurrentTime(data) {
        let time = new Date().toLocaleDateString().split('/')

        if (data[3]) {
            const date = data[3].split('：')[1].split('/')

            if (date.length >= 2){
                time[1] = date[0]
                time[2] = date[1]
            }
        }

        return time
    }

    /**
     * 處理打卡訊息
     * @param message
     * @param spreadSheet
     * @returns {boolean}
     */
    handle(message, spreadSheet) {
        if (
            message.includes('姓名') &&
            message.includes('上班') &&
            message.includes('下班')
        ) {
            const { data, check } = this.parseMessageData(message)

            const time = this.getCurrentTime(data)
            const month = padLeft(time[1])
            const year = time[0]

            if (check && month) {
                const sheet = targetSheet(
                    `${year}年${month}月打卡表`,
                    spreadSheet,
                    this.title,
                )
                const row = sheet.getLastRow()

                const diffTime = (startTime, endTime) => {
                    const start = new Date(
                        `${time[0]}/${time[1]}/${time[2]} ${startTime}`,
                    )
                    const end = new Date(`${time[0]}/${time[1]}/${time[2]} ${endTime}`)
                    return (end - start) / 1000 / 60 / 60
                }

                const workTime = diffTime(
                    data[1].split('：')[1],
                    data[2].split('：')[1],
                )
                const workWithRestTime = workTime - Math.floor(workTime / 4) * 0.5

                const inputData = [
                    data[0].split('：')[1],
                    time[1] + '/' + time[2],
                    data[1].split('：')[1],
                    data[2].split('：')[1],
                    workTime,
                    workWithRestTime,
                ]

                for (let i = 0; i < this.title.length; i++) {
                    sheet.getRange(row + 1, i + 1).setValue(inputData[i])
                }
                return true
            } else {
                return false
            }
        }
    }
}

class LeaveBot extends Bot {
    constructor() {
        super()
        this.title = ['姓名', '日期', '假別']
    }

    /**
     * @param name {string} 使用者名稱
     * @returns {string} 成功訊息
     */
    successMessage(name) {
        return `${name}  請假成功`
    }

    /**
     * 處理請假訊息
     * @param message
     * @param spreadSheet
     * @returns {boolean}
     */
    handle(message, spreadSheet) {
        if (
            message.includes('姓名') &&
            message.includes('日期') &&
            message.includes('假別')
        ) {
            const { data, check } = this.parseMessageData(message)

            const date = data[1].split('：')[1].split('/')
            const month = date ? padLeft(date[0]) : null

            if (check && month) {
                const sheet = targetSheet(`${month}月請假表`, spreadSheet, this.title)
                const row = sheet.getLastRow()

                for (let i = 0; i < this.title.length; i++) {
                    sheet.getRange(row + 1, i + 1).setValue(data[i].split('：')[1])
                }

                return true
            } else {
                return false
            }
        }
    }
}
