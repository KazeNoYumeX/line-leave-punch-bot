function doPost(e) {
    // LINE Messaging API Token
    const CHANNEL_ACCESS_TOKEN = '';

    // Simple use json
    const msg = JSON.parse(e.postData.contents);

    // for debugging
    // Logger.log(msg);
    // console.log(msg);

    // Token
    const replyToken = msg.events[0].replyToken;

    const userMessage = msg.events[0].message.text;

    // Your Google sheet info
    const sheet_url = '';
    const sheet_name = 'sheet';
    const SpreadSheet = SpreadsheetApp.openByUrl(sheet_url);
    const reserve_list = SpreadSheet.getSheetByName(sheet_name);

    // Gets the last column (number of straight columns) of the worksheet.
    const current_list_row = reserve_list.getLastRow();

    // Reply Message Array
    const reply_message = [];

    // LINE account username
    const getUsername = () => {
        let reserve_name;
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
    const sendLineMessage = () =>{
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

        if (check) {
            for (let i = 0; i < 3; i++) {
                reserve_list.getRange(current_list_row + 1, i + 1).setValue(data[i].split('：')[1]);
            }
        }

        reply_message.push({
            "type": "text",
            "text": check ? reserve_name + "  請假成功 " : "請假格式錯誤"
        })

        sendLineMessage()
    }

    // 非關鍵字訊則不回應
    else {
        // for debugging
        // console.log("else here,nothing will happen.")
    }
}