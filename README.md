# LeaveRequestBot

以 Line Bot 和 Google Sheets 的一個輕量型請假機器人

This is a lightweight leave request bot using Line Bot and Google Sheets

## Features

- 透過特定格式進行員工請假 (可彈性客製化)
- 使用 Google Sheets, 做為免費且輕量的資料庫
- 使用 Google App Script, Line Bot 文件充足且可快速使用

## Usage

透過簡單的文字訊息即可建立請假，並新增資料至 Google Sheets

- Line Message

```
    姓名：員工
    日期：09/26
    假別：事假
```

- Google Sheets 資料 (會依據月份建立 Sheet)

| 員工  | 日期    | 假別  |
|:----|-------|-----|
| 員工  | 09/26 | 事假  |

## Develop

1. 將 app.js 的內容，複製到你的 Google App Script 上
2. 在 CHANNEL_ACCESS_TOKEN 裡填入你的 LINE API Token ：

```sh
const CHANNEL_ACCESS_TOKEN = '{{ Your Token }}';
```

更改 Google Sheets 資訊：

```sh
const sheet_url = '{{ Your sheet url }}'
```

3. 將 App Script 存取權限改為「所有人」後部署 (網路應用程式)：
4. 將產生的網址(網頁應用程式)複製至你的 Line Bot 的 Webhook：


## Customization

reply_message 必須為 JSON 格式，範例如下：
```
   reply_message = [{
       "type":"text", 
       "text":" {{ 文字內容 }} "
   }]
```

可參考 Line 官方文件

https://developers.line.biz/en/docs/messaging-api/sending-messages/#methods-of-sending-message

## License

MIT License.