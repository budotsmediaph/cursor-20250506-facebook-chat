const fetch = require('node-fetch');

class DeepSeekLLM {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.apiUrl = 'https://api.deepseek.com/v1/chat/completions';
    this.model = 'deepseek-chat';
  }

  async getResponse(message, chatHistory) {
    try {
      const messages = this.formatChatHistory(chatHistory, message);
      
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: messages,
          temperature: 0.7,
          max_tokens: 1000,
          stream: false
        })
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('DeepSeek API error:', error);
        throw new Error(`DeepSeek API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Error getting LLM response:', error);
      return "I apologize, but I'm having trouble processing your request right now. Please try again later.";
    }
  }

  formatChatHistory(history, currentMessage) {
    const messages = [];
    
    // Add system message
    messages.push({
      role: 'system',
      content: `You are a helpful travel assistant for Philippine Paradise Tours. 
      You can communicate in multiple languages including English, Tagalog, and other Philippine languages.
      Always be friendly and professional. Provide accurate information about Philippine tourism.
      If you don't know something, be honest and offer to connect the user with a human agent.`
    });

    // Add chat history
    history.forEach(msg => {
      messages.push({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      });
    });

    // Add current message if provided
    if (currentMessage) {
      messages.push({
        role: 'user',
        content: currentMessage
      });
    }

    return messages;
  }

  // Helper method to detect language
  async detectLanguage(text) {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'Detect the language of the following text and respond with only the ISO 639-1 language code (e.g., en, tl, es).'
            },
            {
              role: 'user',
              content: text
            }
          ],
          temperature: 0.1,
          max_tokens: 10
        })
      });

      if (!response.ok) {
        throw new Error(`Language detection failed: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content.trim();
    } catch (error) {
      console.error('Error detecting language:', error);
      return 'en'; // Default to English
    }
  }
}

module.exports = DeepSeekLLM;