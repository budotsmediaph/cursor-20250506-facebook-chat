const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const DeepSeekLLM = require('./llm');

const app = express();
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'your_verify_token';
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

// Initialize DeepSeek LLM
const llm = new DeepSeekLLM(DEEPSEEK_API_KEY);

// Chat history storage (in-memory for now, consider using a database in production)
const chatHistory = new Map();

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const parsedBody = JSON.parse(body);
        console.log('📥 Request body:', JSON.stringify(parsedBody, null, 2));
        req.body = parsedBody;
      } catch (error) {
        console.error('❌ Error parsing request body:', error);
        req.body = {};
      }
      next();
    });
  } else {
    next();
  }
});

app.use(bodyParser.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Webhook server is running',
    timestamp: new Date().toISOString(),
    verify_token: VERIFY_TOKEN
  });
});

// Webhook verification endpoint
app.get('/webhook', (req, res) => {
  console.log('🔍 Webhook verification request:', {
    mode: req.query['hub.mode'],
    token: req.query['hub.verify_token'],
    challenge: req.query['hub.challenge']
  });

  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('✅ Webhook verified successfully');
      res.status(200).send(challenge);
    } else {
      console.log('❌ Webhook verification failed:', {
        expectedToken: VERIFY_TOKEN,
        receivedToken: token,
        mode: mode
      });
      res.sendStatus(403);
    }
  } else {
    console.log('❌ Invalid verification request:', {
      mode: mode,
      token: token
    });
    res.sendStatus(400);
  }
});

// Message handling endpoint
app.post('/webhook', async (req, res) => {
  try {
    console.log('📨 Received webhook request:', JSON.stringify(req.body, null, 2));

    if (!req.body || typeof req.body !== 'object') {
      console.error('❌ Invalid request body');
      return res.status(400).json({ error: 'Invalid request body' });
    }

    if (req.body.object !== 'page') {
      console.error('❌ Invalid object type:', req.body.object);
      return res.status(404).json({ error: 'Invalid object type' });
    }

    if (!Array.isArray(req.body.entry)) {
      console.error('❌ Invalid entry format');
      return res.status(400).json({ error: 'Invalid entry format' });
    }

    for (const entry of req.body.entry) {
      if (!Array.isArray(entry.messaging)) {
        console.error('❌ Invalid messaging format');
        continue;
      }

      for (const event of entry.messaging) {
        if (event.postback) {
          await handlePostback(event);
        } else if (event.message) {
          await handleMessage(event);
        }
      }
    }

    res.status(200).json({ status: 'EVENT_RECEIVED' });
  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Quick replies templates
const mainMenuQuickReplies = [
  {
    content_type: 'text',
    title: 'Tour Packages',
    payload: 'TOUR_PACKAGES'
  },
  {
    content_type: 'text',
    title: 'Book a Tour',
    payload: 'BOOK_TOUR'
  },
  {
    content_type: 'text',
    title: 'Contact Us',
    payload: 'CONTACT_US'
  }
];

// Handle incoming messages
async function handleMessage(event) {
  const senderId = event.sender.id;
  const message = event.message;
  const timestamp = event.timestamp;

  // Initialize chat history for new users
  if (!chatHistory.has(senderId)) {
    chatHistory.set(senderId, []);
  }

  // Add message to chat history
  const chatEntry = {
    type: 'user',
    timestamp: new Date(timestamp * 1000).toISOString(),
    content: message.text || 'attachment',
    messageType: message.text ? 'text' : 'attachment'
  };
  chatHistory.get(senderId).push(chatEntry);

  // Log detailed message information
  console.log('📨 New Message:', {
    timestamp: chatEntry.timestamp,
    senderId: senderId,
    messageType: chatEntry.messageType,
    content: chatEntry.content,
    quickReply: message.quick_reply?.payload || null,
    attachments: message.attachments || null,
    chatHistoryLength: chatHistory.get(senderId).length
  });

  if (message.text) {
    try {
      // Get LLM response
      const llmResponse = await llm.getResponse(message.text, chatHistory.get(senderId));
      
      // Send response back to user
      await sendMessage(senderId, {
        text: llmResponse,
        quick_replies: mainMenuQuickReplies
      });
    } catch (error) {
      console.error('Error getting LLM response:', error);
      // Fallback to default response
      await sendMessage(senderId, {
        text: "I apologize, but I'm having trouble processing your request right now. Please select an option from the menu:",
        quick_replies: mainMenuQuickReplies
      });
    }
  } else if (message.attachments) {
    // Handle attachments (images, videos, etc.)
    await sendMessage(senderId, {
      text: "I received your attachment! Please select an option from the menu:",
      quick_replies: mainMenuQuickReplies
    });
  }
}

// Handle postback events
async function handlePostback(event) {
  const senderId = event.sender.id;
  const payload = event.postback.payload;
  const timestamp = event.timestamp;

  // Add postback to chat history
  if (!chatHistory.has(senderId)) {
    chatHistory.set(senderId, []);
  }
  chatHistory.get(senderId).push({
    type: 'postback',
    timestamp: new Date(timestamp * 1000).toISOString(),
    content: payload
  });

  // Log detailed postback information
  console.log('🔄 Postback Event:', {
    timestamp: new Date(timestamp * 1000).toISOString(),
    senderId: senderId,
    payload: payload,
    chatHistoryLength: chatHistory.get(senderId).length
  });

  switch (payload) {
    case 'GET_STARTED':
      await sendWelcomeMessage(senderId);
      break;
    case 'MAIN_MENU':
      await handleMainMenu(senderId);
      break;
    case 'TOUR_PACKAGES':
      await handleTourPackages(senderId);
      break;
    case 'BOOK_TOUR':
      await handleBookTour(senderId);
      break;
    case 'CONTACT_US':
      await handleContactUs(senderId);
      break;
    default:
      await sendMessage(senderId, {
        text: "Mabuhay! Welcome to Philippine Paradise Tours. How can I help you plan your dream vacation?",
        quick_replies: mainMenuQuickReplies
      });
  }
}

// Welcome message
async function sendWelcomeMessage(senderId) {
  await sendMessage(senderId, {
    text: "Mabuhay! Welcome to Philippine Paradise Tours! 🌴\n\nWe specialize in creating unforgettable travel experiences across the beautiful islands of the Philippines. How can I help you plan your dream vacation?",
    quick_replies: mainMenuQuickReplies
  });
}

// Main menu handler
async function handleMainMenu(senderId) {
  await sendMessage(senderId, {
    text: "Please select an option to start planning your Philippine adventure:",
    quick_replies: mainMenuQuickReplies
  });
}

// Tour packages handler
async function handleTourPackages(senderId) {
  await sendMessage(senderId, {
    text: "Here are our popular tour packages:\n\n1. Palawan Paradise (7 days)\n2. Boracay Beach Escape (5 days)\n3. Cebu Adventure (6 days)\n\nWould you like to know more about any of these packages?",
    quick_replies: [
      {
        content_type: 'text',
        title: 'Back to Menu',
        payload: 'MAIN_MENU'
      }
    ]
  });
}

// Book tour handler
async function handleBookTour(senderId) {
  await sendMessage(senderId, {
    text: "To book a tour, please provide:\n1. Your preferred travel dates\n2. Number of travelers\n3. Any special requirements\n\nOr you can call us directly at +63 2 1234 5678",
    quick_replies: [
      {
        content_type: 'text',
        title: 'Back to Menu',
        payload: 'MAIN_MENU'
      }
    ]
  });
}

// Contact us handler
async function handleContactUs(senderId) {
  await sendMessage(senderId, {
    text: "Contact Philippine Paradise Tours:\n\n📞 Phone: +63 2 1234 5678\n📧 Email: info@philippineparadise.com\n📍 Office: 123 Makati Avenue, Makati City\n\nOperating Hours:\nMonday to Friday: 9AM - 6PM\nSaturday: 9AM - 3PM\n\nWould you like to return to the main menu?",
    quick_replies: [
      {
        content_type: 'text',
        title: 'Back to Menu',
        payload: 'MAIN_MENU'
      }
    ]
  });
}

// Send message to Facebook
async function sendMessage(recipientId, message) {
  // Add bot response to chat history
  if (!chatHistory.has(recipientId)) {
    chatHistory.set(recipientId, []);
  }
  chatHistory.get(recipientId).push({
    type: 'bot',
    timestamp: new Date().toISOString(),
    content: message.text || 'attachment',
    messageType: message.text ? 'text' : 'attachment'
  });

  // Log outgoing message
  console.log('📤 Sending Message:', {
    timestamp: new Date().toISOString(),
    recipientId: recipientId,
    messageType: message.text ? 'text' : 'attachment',
    content: message.text || 'attachment',
    quickReplies: message.quick_replies || null,
    chatHistoryLength: chatHistory.get(recipientId).length
  });

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
      const errorText = await response.text();
      console.error('❌ Facebook API error:', {
        timestamp: new Date().toISOString(),
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Message sent successfully:', {
      timestamp: new Date().toISOString(),
      messageId: data.message_id
    });
  } catch (error) {
    console.error('❌ Error sending message:', {
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
}

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server started on port ${PORT}`);
  console.log(`🌐 Webhook URL: https://${process.env.PROJECT_DOMAIN}.glitch.me/webhook`);
  console.log(`🔑 Verify Token: ${VERIFY_TOKEN}`);
});