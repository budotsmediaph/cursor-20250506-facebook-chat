onst express = require('express');
const bodyParser = require('body-parser');
const app = express();
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'your_verify_token';
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

app.use(bodyParser.json());

// Verification endpoint
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('WEBHOOK_VERIFIED');
    res.status(200).send(challenge);
  } else {
    console.error('Failed verification. Make sure the verify tokens match.');
    res.sendStatus(403);
  }
});

// Message handling endpoint
app.post('/webhook', async (req, res) => {
  try {
    const body = req.body;

    if (body.object !== 'page') {
      return res.sendStatus(404);
    }

    // Process each entry
    for (const entry of body.entry) {
      for (const event of entry.messaging) {
        if (event.message) {
          await handleMessage(event);
        } else if (event.postback) {
          await handlePostback(event);
        }
      }
    }

    res.status(200).send('EVENT_RECEIVED');
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.sendStatus(500);
  }
});

// Handle incoming messages
async function handleMessage(event) {
  const senderId = event.sender.id;
  const message = event.message;

  console.log('Received message:', message);

  // Echo the message back to the sender
  await sendMessage(senderId, {
    text: `You sent: ${message.text}`
  });
}

// Handle postback events
async function handlePostback(event) {
  const senderId = event.sender.id;
  const payload = event.postback.payload;

  console.log('Received postback:', payload);

  // Handle different postback payloads
  switch (payload) {
    case 'GET_STARTED':
      await sendMessage(senderId, {
        text: 'Welcome to our bot! How can I help you today?'
      });
      break;
    default:
      await sendMessage(senderId, {
        text: 'I received your postback!'
      });
  }
}

// Send message to Facebook
async function sendMessage(recipientId, message) {
  try {
    const response = await fetch(`https://graph.facebook.com/v19.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipient: {
          id: recipientId
        },
        message: message
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Message sent successfully:', data);
  } catch (error) {
    console.error('Error sending message:', error);
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Webhook server is listening on port ${PORT}`);
});