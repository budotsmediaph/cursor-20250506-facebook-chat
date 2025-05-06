const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'your_verify_token';
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Enhanced logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.use(bodyParser.json());

// Conversation states storage
const userStates = new Map();

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

const tourPackagesQuickReplies = [
  {
    content_type: 'text',
    title: 'Palawan Tours',
    payload: 'PALAWAN_TOURS'
  },
  {
    content_type: 'text',
    title: 'Boracay Packages',
    payload: 'BORACAY_PACKAGES'
  },
  {
    content_type: 'text',
    title: 'Cebu Adventures',
    payload: 'CEBU_ADVENTURES'
  },
  {
    content_type: 'text',
    title: 'Back to Menu',
    payload: 'MAIN_MENU'
  }
];

// Message handling endpoint
app.post('/webhook', async (req, res) => {
  try {
    const body = req.body;

    if (body.object !== 'page') {
      return res.sendStatus(404);
    }

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
  const userState = userStates.get(senderId) || 'MAIN_MENU';

  console.log('Handling message:', { senderId, message, userState });

  switch (userState) {
    case 'MAIN_MENU':
      await handleMainMenu(senderId, message);
      break;
    case 'TOUR_PACKAGES':
      await handleTourPackages(senderId, message);
      break;
    case 'BOOK_TOUR':
      await handleBookTour(senderId, message);
      break;
    default:
      await sendMessage(senderId, {
        text: "Mabuhay! Welcome to Philippine Paradise Tours. How can I help you plan your dream vacation?",
        quick_replies: mainMenuQuickReplies
      });
      userStates.set(senderId, 'MAIN_MENU');
  }
}

// Handle postback events
async function handlePostback(event) {
  const senderId = event.sender.id;
  const payload = event.postback.payload;

  console.log('Handling postback:', { senderId, payload });

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
    case 'PALAWAN_TOURS':
      await handlePalawanTours(senderId);
      break;
    case 'BORACAY_PACKAGES':
      await handleBoracayPackages(senderId);
      break;
    case 'CEBU_ADVENTURES':
      await handleCebuAdventures(senderId);
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
  userStates.set(senderId, 'MAIN_MENU');
}

// Main menu handler
async function handleMainMenu(senderId, message = null) {
  if (message && message.text) {
    const text = message.text.toLowerCase();
    if (text.includes('tour') || text.includes('package')) {
      await handleTourPackages(senderId);
      return;
    } else if (text.includes('book') || text.includes('reserve')) {
      await handleBookTour(senderId);
      return;
    } else if (text.includes('contact') || text.includes('help')) {
      await handleContactUs(senderId);
      return;
    }
  }

  await sendMessage(senderId, {
    text: "Please select an option to start planning your Philippine adventure:",
    quick_replies: mainMenuQuickReplies
  });
  userStates.set(senderId, 'MAIN_MENU');
}

// Tour packages handler
async function handleTourPackages(senderId, message = null) {
  await sendMessage(senderId, {
    text: "Discover our amazing tour packages! Where would you like to explore?",
    quick_replies: tourPackagesQuickReplies
  });
  userStates.set(senderId, 'TOUR_PACKAGES');
}

// Palawan tours handler
async function handlePalawanTours(senderId) {
  const palawanTours = [
    {
      title: "El Nido Island Hopping",
      subtitle: "Explore the stunning lagoons and beaches of El Nido",
      image_url: "https://example.com/elnido.jpg",
      buttons: [
        {
          type: "web_url",
          url: "https://example.com/elnido-tour",
          title: "View Details"
        },
        {
          type: "postback",
          title: "Book Now",
          payload: "BOOK_ELNIDO"
        }
      ]
    },
    {
      title: "Underground River Tour",
      subtitle: "Discover the UNESCO World Heritage underground river",
      image_url: "https://example.com/underground-river.jpg",
      buttons: [
        {
          type: "web_url",
          url: "https://example.com/underground-river-tour",
          title: "View Details"
        },
        {
          type: "postback",
          title: "Book Now",
          payload: "BOOK_UNDERGROUND_RIVER"
        }
      ]
    }
  ];

  await sendMessage(senderId, {
    attachment: {
      type: "template",
      payload: {
        template_type: "generic",
        elements: palawanTours
      }
    }
  });
}

// Boracay packages handler
async function handleBoracayPackages(senderId) {
  await sendMessage(senderId, {
    text: "Boracay Island Packages:\n\n1. White Beach Getaway (3D2N)\n- Beachfront accommodation\n- Island hopping\n- Sunset sailing\n\n2. Adventure Package (4D3N)\n- All activities from Getaway package\n- Parasailing\n- Scuba diving\n\nWould you like to book any of these packages?",
    quick_replies: [
      {
        content_type: 'text',
        title: 'Book White Beach',
        payload: 'BOOK_WHITE_BEACH'
      },
      {
        content_type: 'text',
        title: 'Book Adventure',
        payload: 'BOOK_ADVENTURE'
      },
      {
        content_type: 'text',
        title: 'Back to Menu',
        payload: 'MAIN_MENU'
      }
    ]
  });
}

// Cebu adventures handler
async function handleCebuAdventures(senderId) {
  await sendMessage(senderId, {
    text: "Cebu Adventure Packages:\n\n1. Whale Shark Encounter\n- Swimming with whale sharks\n- Tumalog Falls visit\n- Oslob tour\n\n2. Canyoneering Adventure\n- Badian canyoneering\n- Kawasan Falls\n- Lunch included\n\nWhich adventure would you like to book?",
    quick_replies: [
      {
        content_type: 'text',
        title: 'Whale Shark Tour',
        payload: 'BOOK_WHALE_SHARK'
      },
      {
        content_type: 'text',
        title: 'Canyoneering',
        payload: 'BOOK_CANYONEERING'
      },
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
    text: "To book a tour, please provide:\n1. Your preferred destination\n2. Number of travelers\n3. Preferred dates\n\nOr you can call our booking hotline: +63 2 1234 5678\n\nWould you like to see our available packages first?",
    quick_replies: [
      {
        content_type: 'text',
        title: 'View Packages',
        payload: 'TOUR_PACKAGES'
      },
      {
        content_type: 'text',
        title: 'Back to Menu',
        payload: 'MAIN_MENU'
      }
    ]
  });
  userStates.set(senderId, 'BOOK_TOUR');
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

// Start server
const listener = app.listen(process.env.PORT, () => {
  console.log('Server started successfully');
  console.log('Your app is listening on port ' + listener.address().port);
  console.log('Webhook URL: https://' + process.env.PROJECT_DOMAIN + '.glitch.me/webhook');
});