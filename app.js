function doPost(e) {
    // LINE Messaging API Token
    const CHANNEL_ACCESS_TOKEN = '';

    // Simple use json
    const msg = JSON.parse(e.postData.contents);

    // Token
    const replyToken = msg.events[0].replyToken;
    const userId = msg.events[0].source.userId;
    const userMessage = msg.events[0].message.text;
    const eventType = msg.events[0].source.type;

    // Your Google sheet info
    const sheet_url = '';
    const spreadSheet = SpreadsheetApp.openByUrl(sheet_url);

    const targetSheet = (name, spreadSheet) => {
        let sheet = spreadSheet.getSheetByName(name);

        if (!sheet) {
            const newSheet = spreadSheet.insertSheet();
            newSheet.setName(name);

            sheet = spreadSheet.getSheetByName(name);

            const row = sheet.getLastRow();
            const title = ['姓名', '日期', '假別']
            for (let i = 0; i < 3; i++) {
                sheet.getRange(row + 1, i + 1).setValue(title[i]);
            }
        }

        return sheet
    }

    // LINE account username
    const getUsername = () => {
        let reserve_name, nameurl;

        if (eventType === "user") {
            nameurl = "https://api.line.me/v2/bot/profile/" + userId;
        } else if (eventType === "group") {
            const groupId = msg.events[0].source.groupId;
            nameurl = "https://api.line.me/v2/bot/group/" + groupId + "/member/" + userId;
        }

        try {
            //  呼叫 LINE User Info API，以 user ID 取得該帳號的使用者名稱
            const res = UrlFetchApp.fetch(nameurl, {
                "method": "GET",
                "headers": {
                    "Authorization": "Bearer " + CHANNEL_ACCESS_TOKEN,
                    "Content-Type": "application/json"
                },
            });
            const json = JSON.parse(res);
            reserve_name = json.displayName;
        } catch {
            reserve_name = "not avaliable";
        }
        return String(reserve_name)
    }

    // 回傳訊息給line 並傳送給使用者
    const sendLineMessage = (reply_message) => {
        const url = 'https://api.line.me/v2/bot/message/reply';

        UrlFetchApp.fetch(url, {
            'headers': {
                'Content-Type': 'application/json; charset=UTF-8',
                'Authorization': 'Bearer ' + CHANNEL_ACCESS_TOKEN,
            },
            'method': 'post',
            'payload': JSON.stringify({
                'replyToken': replyToken,
                'messages': reply_message,
            }),
        });
    }

    if (typeof replyToken === 'undefined') {
        return;
    }

    if (userMessage.indexOf("姓名") !== -1 && userMessage.indexOf("日期") !== -1 | userMessage.indexOf("假別") !== -1) {

        const reserve_name = getUsername();
        const data = userMessage.split(/\r?\n/);
        const check = (data[0].split('：')[1] && data[1].split('：')[1] && data[2].split('：')[1])

        const padLeft = (str) => {
            str = str.toString()
            return str.length >= 2 ? str : "0" + str
        }

        const date = data[1].split('：')[1].split('/')
        const month = date ? padLeft(date[0]) : null

        if (check && month) {
            const sheet = targetSheet(`${month}月請假表`, spreadSheet)
            const row = sheet.getLastRow();

            for (let i = 0; i < 3; i++) {
                sheet.getRange(row + 1, i + 1).setValue(data[i].split('：')[1]);
            }
        }

        sendLineMessage([{
            "type": "text",
            "text": check ? reserve_name + "  請假成功 " : "請假格式錯誤"
        }])
    }
}