var express = require('express')
var bodyParser = require('body-parser')
var request = require('request')
var app = express()
var rest = require('rest')
app.use(bodyParser.json())
app.set('port', (process.env.PORT || 4000))
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

app.get('/webhook', function(req, res) {
  var key = 'EAAFC8WXwYTMBABgOGyUxtzyzJOw4zDq2auvf9aZACnLelZB2siYLwUYZCwooOwZA7Fd0MUsT6IivUCGKeNBv3kjF8Q7bYVYTiXPXReudJznE8PpRceGiddUQ4QZBslUF9ZCIHVgMWzsGFJcC8TkAyCylvCqV1GOue4iRyozVfAfQZDZD'
  if (req.query['hub.verify_token'] === key) {
    res.send(req.query['hub.challenge'])
  }
  res.send('Error, wrong token')
})

app.post('/webhook', function (req, res) {
  var data = req.body;

  // Make sure this is a page subscription
  if (data.object === 'page') {

    // Iterate over each entry - there may be multiple if batched
    data.entry.forEach(function(entry) {
      var pageID = entry.id;
      var timeOfEvent = entry.time;

      // Iterate over each messaging event
      entry.messaging.forEach(function(event) {
        if (event.message) {
          receivedMessage(event);
        } else {
          console.log("Webhook received unknown event: ", event);
        }
      });
    });

    // Assume all went well.
    //
    // You must send back a 200, within 20 seconds, to let us know
    // you've successfully received the callback. Otherwise, the request
    // will time out and we will keep trying to resend.
    res.sendStatus(200);
  }
});

function receivedMessage(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;

  console.log("Received message for user %d and page %d at %d with message:",
    senderID, recipientID, timeOfMessage);
  console.log(JSON.stringify(message));

  var messageId = message.mid;

  var messageText = message.text;
  var messageAttachments = message.attachments;

  if (messageText) {
    var res
    var text = ''
    if (messageText) {
      sendTextMessage(senderID, 'request')
      rest('http://api.openweathermap.org/data/2.5/weather?q=' + messageText + ',uk&appid=0635e78a93c863934f5d9af02d1db74a').then(function (response) {
        console.log('test//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////')
        console.log('response: ', response.entity)
        res = JSON.parse(response.entity.main)
        console.log('test////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////')
        console.log('temp: ', res)
        text += 'temp now' + res
        sendTextMessage(senderID, text)
      })

      // test += res.main
      // sendTextMessage(senderID, test)
    }
    // If we receive a text message, check to see if it matches a keyword
    // and send back the example. Otherwise, just echo the text we received.
    switch (messageText) {
      case 'generic':
        sendGenericMessage(senderID)
        break
    }
  } else if (messageAttachments) {
    sendTextMessage(senderID, "Message with attachment received");
  }
}
function sendGenericMessage(recipientId, messageText) {
  // To be expanded in later sections
}

function sendTextMessage(recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText
    }
  };

  callSendAPI(messageData);
}

function callSendAPI(messageData) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: 'EAAFC8WXwYTMBABgOGyUxtzyzJOw4zDq2auvf9aZACnLelZB2siYLwUYZCwooOwZA7Fd0MUsT6IivUCGKeNBv3kjF8Q7bYVYTiXPXReudJznE8PpRceGiddUQ4QZBslUF9ZCIHVgMWzsGFJcC8TkAyCylvCqV1GOue4iRyozVfAfQZDZD' },
    method: 'POST',
    json: messageData

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      console.log("Successfully sent generic message with id %s to recipient %s",
        messageId, recipientId);
    } else {
      console.error("Unable to send message.");
      console.error(response);
      console.error(error);
    }
  });
}

app.listen(app.get('port'), function () {
  console.log('run at port', app.get('port'))
})
