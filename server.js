var express = require('express')
var bodyParser = require('body-parser')
var request = require('request')
var app = express()

app.use(bodyParser.json())
app.set('port', (process.env.PORT || 4000))
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

app.get('/webhook', function (req, res) {
  var key = 'EAADU9SVyvZAQBABOk71YINxYcHTkuIRYgxkmvjWTisXMtitUYT6tmEN70f5RGsvZCnKFkZCJE8H0IeaGwUQT5agzY5ZADRJWfnoHJ7sbdaZCzjz2LaPl7B2hb7ZArxCpikCfCb4j1SOsUyLapBTBvZBNS44Efh9tRthMg8XdVzGmgZDZD'
  if (req.query['hub.mode'] === 'subscribe' &&
      req.query['hub.verify_token'] === key) {
    console.log('Validating webhook')
    // res.status(200).send(req.query['hub.challenge'])
  } else {
    console.error('Failed validation. Make sure the validation tokens match.')
    // res.sendStatus(403)
  }
})
app.post('/webhook', function (req, res) {
  var data = req.body
  // Make sure this is a page subscription
  if (data.object === 'page') {
    // Iterate over each entry - there may be multiple if batched
    data.entry.forEach(function (entry) {
      var pageID = entry.id
      var timeOfEvent = entry.time

      // Iterate over each messaging event
      entry.messaging.forEach(function (event) {
        if (event.message) {
          receivedMessage(event)
        } else if (event.postback) {
          receivedPostback(event)
        } else {
          console.log('Webhook received unknown event: ', event)
        }
      })
    })

    // Assume all went well.
    //
    // You must send back a 200, within 20 seconds, to let us know
    // you've successfully received the callback. Otherwise, the request
    // will time out and we will keep trying to resend.
    res.sendStatus(200)
  }
})
function receivedPostback (event) {
  var senderID = event.sender.id
  var recipientID = event.recipient.id
  var timeOfPostback = event.timestamp

  // The 'payload' param is a developer-defined field which is set in a postback
  // button for Structured Messages.
  var payload = event.postback.payload
  // console.log('Received postback for user %d and page %d with payload '%s' ' +
  //   'at %d', senderID, recipientID, payload, timeOfPostback)

  // When a postback is called, we'll send a message back to the sender to
  // let them know it was successful
  sendTextMessage(senderID, 'Postback called')
}
function receivedMessage (event) {
  var senderID = event.sender.id
  var recipientID = event.recipient.id
  var timeOfMessage = event.timestamp
  var message = event.message

  console.log('Received message for user %d and page %d at %d with message:',
    senderID, recipientID, timeOfMessage)
  console.log(JSON.stringify(message))

  var messageId = message.mid

  var messageText = message.text
  var messageAttachments = message.attachments
  if (messageText) {
    // If we receive a text message, check to see if it matches a keyword
    // and send back the example. Otherwise, just echo the text we received.
    switch (messageText) {
      case 'generic':
        sendGenericMessage(senderID)
        break
      case 'button': sendButton(senderID)
        break
      case 'list': sendList(senderID)
        break
      default:
        sendTextMessage(senderID, 'e')
    }
  } else if (messageAttachments) {
    sendTextMessage(senderID, 'Message with attachment received')
  }
}
// function sendGenericMessage (recipientId, messageText) {
//   // To be expanded in later sections
// }
function sendTextMessage (recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText
    }
  }

  callSendAPI(messageData)
}
function callSendAPI (messageData) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: 'EAADU9SVyvZAQBABOk71YINxYcHTkuIRYgxkmvjWTisXMtitUYT6tmEN70f5RGsvZCnKFkZCJE8H0IeaGwUQT5agzY5ZADRJWfnoHJ7sbdaZCzjz2LaPl7B2hb7ZArxCpikCfCb4j1SOsUyLapBTBvZBNS44Efh9tRthMg8XdVzGmgZDZD' },
    method: 'POST',
    json: messageData

  }, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      var recipientId = body.recipient_id
      var messageId = body.message_id

      console.log('Successfully sent generic message with id %s to recipient %s',
        messageId, recipientId)
    } else {
      console.error('Unable to send message.')
      console.error(response)
      console.error(error)
    }
  })
}
function sendButton (recipientId) {
  var messageData = {
    "recipient":{
      "id":recipientId
    },
    "message":{
      "attachment":{
        "type":"template",
        "payload":{
          "template_type":"button",
          "text":"What do you want to do next?",
          "buttons":[
            {
              "type":"web_url",
              "url":"https://petersapparel.parseapp.com",
              "title":"Show Website"
            },
            {
              "type":"postback",
              "title":"Start Chatting",
              "payload":"USER_DEFINED_PAYLOAD"
            }
          ]
        }
      }
    }
  }
  callSendAPI(messageData)
}
function sendList (recipientId) {
  var messageData = {
    "recipient":{
       "id":recipientId
     },
     "message":{
       "attachment":{
         "type":"template",
         "payload":{
           "template_type":"receipt",
           "recipient_name":"Stephane Crozatier",
           "order_number":"12345678902",
           "currency":"USD",
           "payment_method":"Visa 2345",
           "order_url":"http://petersapparel.parseapp.com/order?order_id=123456",
           "timestamp":"1428444852",
           "elements":[
             {
               "title":"Classic White T-Shirt",
               "subtitle":"100% Soft and Luxurious Cotton",
               "quantity":2,
               "price":50,
               "currency":"USD",
               "image_url":"http://petersapparel.parseapp.com/img/whiteshirt.png"
             },
             {
               "title":"Classic Gray T-Shirt",
               "subtitle":"100% Soft and Luxurious Cotton",
               "quantity":1,
               "price":25,
               "currency":"USD",
               "image_url":"http://petersapparel.parseapp.com/img/grayshirt.png"
             }
           ],
           "address":{
             "street_1":"1 Hacker Way",
             "street_2":"",
             "city":"Menlo Park",
             "postal_code":"94025",
             "state":"CA",
             "country":"US"
           },
           "summary":{
             "subtotal":75.00,
             "shipping_cost":4.95,
             "total_tax":6.19,
             "total_cost":56.14
           },
           "adjustments":[
             {
               "name":"New Customer Discount",
               "amount":20
             },
             {
               "name":"$10 Off Coupon",
               "amount":10
             }
           ]
         }
       }
     }
    }
    callSendAPI(messageData)
  }
  function sendGenericMessage (recipientId) {
    var messageData = {
      recipient: {
        id: recipientId
      },
      message: {
        attachment: {
          type: 'template',
          payload: {
            template_type: 'generic',
            elements: [{
              title: 'rift',
              subtitle: 'Next-generation virtual reality',
              item_url: 'https://www.oculus.com/en-us/rift/',
              image_url: 'http://messengerdemo.parseapp.com/img/rift.png',
              buttons: [{
                type: 'postback',
                // url: 'https://www.oculus.com/en-us/rift/',
                title: 'Open Web URL',
                payload: 'eiei'
              }, {
                type: 'postback',
                title: 'Call Postback',
                payload: 'Payload for first bubble'
              }]
            }, {
              title: 'touch',
              subtitle: 'Your Hands, Now in VR',
              item_url: 'https://www.oculus.com/en-us/touch/',
              image_url: 'http://messengerdemo.parseapp.com/img/touch.png',
              buttons: [{
                type: 'web_url',
                url: 'https://www.oculus.com/en-us/touch/',
                title: 'Open Web URL'
              }, {
                type: 'postback',
                title: 'Call Postback',
                payload: 'Payload for second bubble'
              }]
            }]
          }
        }
      }
    }
    callSendAPI(messageData)
  }
app.listen(app.get('port'), function () {
  console.log('run at port', app.get('port'))
})
