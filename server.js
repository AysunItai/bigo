/**
 * BigO Board Server with Orbit Integration
 * Enhanced with all API endpoints for Orbit/macrolang integration
 */

const express = require('express');
const path = require('path');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3001;

// Set EJS as view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Enable CORS for Orbit integration
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, api_key_name, api_key_val');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// In-memory data store
let cards = [
  { id: 1, title: 'Sample Task 1', description: 'This is a sample task', column: 'todo' },
  { id: 2, title: 'Sample Task 2', description: 'Another sample task', column: 'in-progress' },
  { id: 3, title: 'Sample Task 3', description: 'Completed task', column: 'done' }
];

let nextId = 4;

// In-memory storage for chat responses (keyed by topic_id)
if (!global.chatResponses) {
  global.chatResponses = new Map();
}

// ============================================================================
// View Routes
// ============================================================================

app.get('/', (req, res) => {
  res.render('index', { cards });
});

// ============================================================================
// API Routes for Orbit Integration
// ============================================================================

/**
 * GET /api/cards
 * Get all cards
 */
app.get('/api/cards', (req, res) => {
  res.json(cards);
});

/**
 * GET /api/cards/:id
 * Get a specific card by ID
 */
app.get('/api/cards/:id', (req, res) => {
  const card = cards.find(c => c.id === parseInt(req.params.id));
  if (!card) {
    return res.status(404).json({ error: 'Card not found' });
  }
  res.json(card);
});

/**
 * GET /api/cards/column/:column
 * Get all cards in a specific column
 * Column values: 'todo', 'in-progress', 'done'
 */
app.get('/api/cards/column/:column', (req, res) => {
  const { column } = req.params;
  const validColumns = ['todo', 'in-progress', 'done'];
  
  if (!validColumns.includes(column)) {
    return res.status(400).json({ 
      error: 'Invalid column', 
      validColumns 
    });
  }
  
  const columnCards = cards.filter(c => c.column === column);
  res.json(columnCards);
});

/**
 * GET /api/cards/search/:query
 * Search cards by title or description
 */
app.get('/api/cards/search/:query', (req, res) => {
  const query = req.params.query.toLowerCase();
  const matchingCards = cards.filter(card => 
    card.title.toLowerCase().includes(query) ||
    card.description.toLowerCase().includes(query)
  );
  res.json(matchingCards);
});

/**
 * POST /api/cards
 * Create a new card
 * Body: { title: string, description?: string, column: 'todo'|'in-progress'|'done' }
 */
app.post('/api/cards', (req, res) => {
  const { title, description, column } = req.body;
  
  // Validation
  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ error: 'Title is required and must be a non-empty string' });
  }
  
  if (!column) {
    return res.status(400).json({ error: 'Column is required' });
  }
  
  const validColumns = ['todo', 'in-progress', 'done'];
  if (!validColumns.includes(column)) {
    return res.status(400).json({ 
      error: 'Invalid column', 
      validColumns 
    });
  }
  
  const newCard = {
    id: nextId++,
    title: title.trim(),
    description: description ? description.trim() : '',
    column: column
  };
  
  cards.push(newCard);
  res.status(201).json(newCard);
});

/**
 * PUT /api/cards/:id
 * Update a card (can update title, description, or column)
 * Body: { title?: string, description?: string, column?: string }
 */
app.put('/api/cards/:id', (req, res) => {
  const cardId = parseInt(req.params.id);
  const cardIndex = cards.findIndex(c => c.id === cardId);
  
  if (cardIndex === -1) {
    return res.status(404).json({ error: 'Card not found' });
  }
  
  const { title, description, column } = req.body;
  
  // Update fields if provided
  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ error: 'Title must be a non-empty string' });
    }
    cards[cardIndex].title = title.trim();
  }
  
  if (description !== undefined) {
    cards[cardIndex].description = description ? description.trim() : '';
  }
  
  if (column !== undefined) {
    const validColumns = ['todo', 'in-progress', 'done'];
    if (!validColumns.includes(column)) {
      return res.status(400).json({ 
        error: 'Invalid column', 
        validColumns 
      });
    }
    cards[cardIndex].column = column;
  }
  
  res.json(cards[cardIndex]);
});

/**
 * DELETE /api/cards/:id
 * Delete a card
 */
app.delete('/api/cards/:id', (req, res) => {
  const cardId = parseInt(req.params.id);
  const cardIndex = cards.findIndex(c => c.id === cardId);
  
  if (cardIndex === -1) {
    return res.status(404).json({ error: 'Card not found' });
  }
  
  const deletedCard = cards[cardIndex];
  cards.splice(cardIndex, 1);
  res.json({ success: true, deleted: deletedCard });
});

/**
 * GET /api/board/stats
 * Get board statistics
 */
app.get('/api/board/stats', (req, res) => {
  const stats = {
    todo: cards.filter(c => c.column === 'todo').length,
    'in-progress': cards.filter(c => c.column === 'in-progress').length,
    done: cards.filter(c => c.column === 'done').length,
    total: cards.length
  };
  res.json(stats);
});

/**
 * GET /api/board/columns
 * Get all columns with their cards
 */
app.get('/api/board/columns', (req, res) => {
  const columns = {
    todo: cards.filter(c => c.column === 'todo'),
    'in-progress': cards.filter(c => c.column === 'in-progress'),
    done: cards.filter(c => c.column === 'done')
  };
  res.json(columns);
});

// ============================================================================
// Orbit Chat Integration
// ============================================================================

// gotoOrbit configuration (update with your webhook details)
const ORBIT_CONFIG = {
  baseUrl: 'http://localhost:3000',
  webhookId: 235,  // Your webhook ID from Orbit
  webhookHash: '62f45b02931cfefe53ab48f8f0d89712e1903992c5754fa9418542bc1fcfeb11',  // Your webhook hash
  projectId: 22,  // Your project ID (optional, for reference)
  defaultTopicId: 1,  // Default topic ID (you can make this dynamic per user/session)
  defaultUserId: 1    // Default user ID (you can get this from your auth system)
};

/**
 * POST /api/orbit/chat
 * Send message to Orbit via incoming webhook
 */
app.post('/api/orbit/chat', async (req, res) => {
  const { message, topic_id, user_id } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }
  
  try {
    // Build webhook URL
    const webhookUrl = `${ORBIT_CONFIG.baseUrl}/hook/${ORBIT_CONFIG.webhookId}/${ORBIT_CONFIG.webhookHash}`;
    
    // Generate unique message ID
    const messageId = Date.now();
    
    // Use provided IDs or defaults
    const topicId = topic_id || ORBIT_CONFIG.defaultTopicId;
    const userId = user_id || ORBIT_CONFIG.defaultUserId;
    
    // Send message to Orbit via webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action_type_code: 'NEW_MESSAGE',
        table_name: 'message',
        after: {
          user_id: userId,
          message_id: messageId,
          topic_id: topicId,
          message_text: message
        }
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Orbit webhook error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: 'Failed to send message to Orbit',
        status: response.status,
        details: errorText.substring(0, 500)
      });
    }
    
    // Webhook returns "Webhook received" - message is queued for processing
    const responseText = await response.text();
    
    // Return success - note that AI response will come via outgoing webhook
    res.json({ 
      status: 'sent',
      message: 'Message sent to Orbit. Response will come via outgoing webhook.',
      message_id: messageId,
      topic_id: topicId
    });
    
  } catch (error) {
    console.error('Orbit webhook proxy error:', error);
    res.status(500).json({ 
      error: 'Failed to connect to Orbit webhook', 
      details: error.message 
    });
  }
});

/**
 * POST /api/orbit/response
 * Receive AI responses from Orbit via outgoing webhook
 * This endpoint should be configured in Orbit's outgoing webhook settings
 */
app.post('/api/orbit/response', async (req, res) => {
  try {
    // Orbit may send the response in different formats
    // Try to extract message_text from various possible structures
    let messageText = null;
    let topicId = null;
    let userId = null;
    let messageId = null;
    
    // Handle different response formats
    if (req.body.message_text) {
      messageText = req.body.message_text;
      topicId = req.body.topic_id;
      userId = req.body.user_id;
      messageId = req.body.message_id;
    } else if (req.body.after && req.body.after.message_text) {
      // Format: { after: { message_text, topic_id, user_id, message_id } }
      messageText = req.body.after.message_text;
      topicId = req.body.after.topic_id;
      userId = req.body.after.user_id;
      messageId = req.body.after.message_id;
    } else if (req.body.response) {
      // Format: { response: "text", topic_id: 1 }
      messageText = req.body.response;
      topicId = req.body.topic_id;
    } else if (typeof req.body === 'string') {
      // Plain text response
      messageText = req.body;
    } else {
      // Log the full body to see what format Orbit is using
      console.log('Received response from Orbit (unknown format):', JSON.stringify(req.body, null, 2));
      messageText = JSON.stringify(req.body);
    }
    
    if (!messageText) {
      console.warn('No message text found in Orbit response:', req.body);
      return res.status(400).json({ error: 'No message text in response' });
    }
    
    // Use default topic_id if not provided
    const finalTopicId = topicId || ORBIT_CONFIG.defaultTopicId;
    
    console.log('Received AI response from Orbit:', {
      message_text: messageText.substring(0, 100) + '...',
      topic_id: finalTopicId,
      user_id: userId,
      message_id: messageId
    });
    
    // Store the response (keyed by topic_id)
    if (!global.chatResponses.has(finalTopicId)) {
      global.chatResponses.set(finalTopicId, []);
    }
    
    global.chatResponses.get(finalTopicId).push({
      message_text: messageText,
      message_id: messageId || Date.now(),
      user_id: userId,
      timestamp: Date.now()
    });
    
    // If you're using WebSocket, broadcast to connected clients here
    // Example: io.to(`topic-${finalTopicId}`).emit('ai_response', { message_text: messageText });
    
    res.status(200).json({ 
      received: true,
      topic_id: finalTopicId
    });
    
  } catch (error) {
    console.error('Error handling Orbit response:', error);
    res.status(500).json({ error: 'Failed to process response' });
  }
});

/**
 * GET /api/orbit/response/:topic_id
 * Poll endpoint to get latest AI response for a topic
 * Used by frontend to check for new responses
 */
app.get('/api/orbit/response/:topic_id', (req, res) => {
  const { topic_id } = req.params;
  const topicId = parseInt(topic_id);
  
  if (!global.chatResponses || !global.chatResponses.has(topicId)) {
    return res.json({ 
      response: null,
      hasResponse: false
    });
  }
  
  const responses = global.chatResponses.get(topicId);
  if (responses.length === 0) {
    return res.json({ 
      response: null,
      hasResponse: false
    });
  }
  
  // Return the latest response
  const latestResponse = responses[responses.length - 1];
  
  res.json({ 
    response: latestResponse.message_text,
    message_id: latestResponse.message_id,
    timestamp: latestResponse.timestamp,
    hasResponse: true
  });
});

/**
 * GET /api/orbit/response/:topic_id/all
 * Get all responses for a topic
 */
app.get('/api/orbit/response/:topic_id/all', (req, res) => {
  const { topic_id } = req.params;
  const topicId = parseInt(topic_id);
  
  if (!global.chatResponses || !global.chatResponses.has(topicId)) {
    return res.json({ responses: [] });
  }
  
  res.json({ 
    responses: global.chatResponses.get(topicId)
  });
});

/**
 * DELETE /api/orbit/response/:topic_id
 * Clear all responses for a topic (useful for testing or resetting)
 */
app.delete('/api/orbit/response/:topic_id', (req, res) => {
  const { topic_id } = req.params;
  const topicId = parseInt(topic_id);
  
  if (global.chatResponses && global.chatResponses.has(topicId)) {
    global.chatResponses.delete(topicId);
  }
  
  res.json({ 
    success: true,
    message: `Cleared responses for topic ${topicId}`
  });
});

// ============================================================================
// Health Check
// ============================================================================

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================================================
// Start Server
// ============================================================================

app.listen(PORT, () => {
  console.log(`🚀 BigO Board API running on http://localhost:${PORT}`);
  console.log(`📊 API endpoints available:`);
  console.log(`   GET    /api/cards`);
  console.log(`   GET    /api/cards/:id`);
  console.log(`   GET    /api/cards/column/:column`);
  console.log(`   GET    /api/cards/search/:query`);
  console.log(`   POST   /api/cards`);
  console.log(`   PUT    /api/cards/:id`);
  console.log(`   DELETE /api/cards/:id`);
  console.log(`   GET    /api/board/stats`);
  console.log(`   GET    /api/board/columns`);
  console.log(`   POST   /api/orbit/chat (Send message to Orbit)`);
  console.log(`   POST   /api/orbit/response (Receive AI response from Orbit)`);
  console.log(`   GET    /api/orbit/response/:topic_id (Poll for response)`);
  console.log(`   GET    /api/orbit/response/:topic_id/all (Get all responses)`);
  console.log(`   DELETE /api/orbit/response/:topic_id (Clear responses)`);
  console.log(`\n✅ Ready for Orbit integration!`);
  console.log(`\n📝 Configure outgoing webhook in Orbit to: http://localhost:${PORT}/api/orbit/response`);
  console.log(`   (For production, use your actual server URL)`);
});

module.exports = app;

