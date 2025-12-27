/**
 * BigO Board Server
 * Kanban board application with Quadrillian chat integration + gotoOrbit macro approval
 */

require('dotenv').config();
const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const fetch = require('node-fetch'); // for calling gotoOrbit APIs

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy (required for hosting platforms with reverse proxies)
app.set('trust proxy', 1);

// Set EJS as view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Enable CORS
app.use(cors({
  origin: true,
  credentials: true
}));

// ============================================================================
// Quadrillian Configuration
// ============================================================================

const QuadrillianConfig = {
  workspace_id: Number(process.env.QUAD_WORKSPACE_ID) || 4398,
  workspace_secret: process.env.QUAD_WORKSPACE_SECRET,
  project_id: Number(process.env.QUAD_PROJECT_ID) || 22,
  ai_user_id: Number(process.env.QUAD_AI_USER_ID) || 2,
  user_id: Number(process.env.QUAD_USER_ID) || 865,
  user_email: process.env.QUAD_USER_EMAIL || 'aysunhpl@gmail.com',
  user_name: process.env.QUAD_USER_NAME || 'Teams test',
  base_url: process.env.QUAD_BASE_URL || 'https://eng.quadrillian.com'
};

if (!QuadrillianConfig.workspace_secret) {
  console.warn('⚠️  QUAD_WORKSPACE_SECRET missing in .env - Chat features will be disabled');
}

// ============================================================================
// gotoOrbit Configuration
// ============================================================================

const GOTOORBIT_API_BASE_URL = process.env.GOTOORBIT_API_BASE_URL || 'https://eng.gotoorbit.com';
const GOTOORBIT_PROJECT_ID = process.env.GOTOORBIT_PROJECT_ID || null;
const GOTOORBIT_API_KEY_NAME = process.env.GOTOORBIT_API_KEY_NAME;
const GOTOORBIT_API_KEY_VAL = process.env.GOTOORBIT_API_KEY_VAL;

if (!GOTOORBIT_API_KEY_NAME || !GOTOORBIT_API_KEY_VAL) {
  console.warn('⚠️  GOTOORBIT_API_KEY_NAME or GOTOORBIT_API_KEY_VAL missing in .env - gotoOrbit integration will not work');
}

const gotoOrbitHeaders = {
  'Content-Type': 'application/json',
  'api_key_name': GOTOORBIT_API_KEY_NAME || '',
  'api_key_val': GOTOORBIT_API_KEY_VAL || ''
};

// Helper: env_json passed to gotoOrbit macros
function buildGotoOrbitEnvJson(req) {
  return {
    // Add whatever you want macros to see here:
    bigo_env: process.env.NODE_ENV || 'development',
    bigo_base_url: process.env.BIGO_BASE_URL || '',
    // Example: include current user id so macros can attribute changes
    current_user_id: QuadrillianConfig.user_id
    // You can add real API keys / DB URLs later if needed:
    // api_key: process.env.YOUR_API_KEY,
    // database_url: process.env.DATABASE_URL,
  };
}

// Stub helpers for "message system" mentioned in docs.
// For now they just log to console. You can wire to a DB later if you want.
async function updateMessage(messageId, payload) {
  console.log('📝 [gotoOrbit] updateMessage stub called:', { messageId, payload });
}

async function replaceMessageContent(messageId, newContent) {
  console.log('📝 [gotoOrbit] replaceMessageContent stub called:', {
    messageId,
    newContentSnippet: typeof newContent === 'string' ? newContent.slice(0, 120) + '...' : newContent
  });
}

async function logMacroRejection(data) {
  console.log('🚫 [gotoOrbit] macro rejected:', data);
}

// ============================================================================
// In-memory cards
// ============================================================================

// In-memory data store for kanban cards
let cards = [
  { id: 1, title: 'Sample Task 1', description: 'This is a sample task', column: 'todo' },
  { id: 2, title: 'Sample Task 2', description: 'Another sample task', column: 'in-progress' },
  { id: 3, title: 'Sample Task 3', description: 'Completed task', column: 'done' }
];

let nextId = 4;

// ============================================================================
// View Routes
// ============================================================================

app.use((req, res, next) => {
  if (req.url.startsWith('/api/cards')) {
    console.log('[BigO] Incoming:', req.method, req.url, 'body =', req.body);
  }
  next();
});


app.get('/', (req, res) => {
  res.render('index', { cards });
});


// ============================================================================
// Quadrillian Chat API Routes
// ============================================================================

// Get chat configuration (public endpoint)
app.get('/api/chat/config', (req, res) => {
  const baseUrl = QuadrillianConfig.base_url || 'https://eng.quadrillian.com';
  res.json({
    workspace_id: QuadrillianConfig.workspace_id,
    project_id: QuadrillianConfig.project_id,
    ai_user_id: QuadrillianConfig.ai_user_id,
    base_url: baseUrl
  });
});

// Generate JWT for Quadrillian chat (public endpoint - no auth required)
app.post('/api/chat/auth', (req, res) => {
  try {
    if (!QuadrillianConfig.workspace_secret) {
      return res.status(503).json({ error: 'Chat service not configured' });
    }

    const nowSeconds = Math.floor(Date.now() / 1000);

    const payload = {
      workspace_id: QuadrillianConfig.workspace_id,
      external_user_id: String(QuadrillianConfig.user_id),
      email: QuadrillianConfig.user_email,
      name: QuadrillianConfig.user_name,
      iat: nowSeconds,
      exp: nowSeconds + 60 * 60 * 24, // 24 hours
    };

    const token = jwt.sign(payload, QuadrillianConfig.workspace_secret, {
      algorithm: 'HS256',
    });

    const topic_external_key = `/project/${QuadrillianConfig.project_id}`;

    res.json({
      jwt: token,
      topic_external_key: topic_external_key
    });
  } catch (err) {
    console.error('Auth error:', err);
    res.status(500).json({ error: 'Authentication failed' });
  }
});



// ============================================================================
// Kanban Board API Routes
// ============================================================================

app.get('/api/cards', (req, res) => {
  res.json(cards);
});

app.get('/api/cards/:id', (req, res) => {
  const card = cards.find((c) => c.id === parseInt(req.params.id, 10));
  if (!card) {
    return res.status(404).json({ error: 'Card not found' });
  }
  res.json(card);
});

app.get('/api/cards/column/:column', (req, res) => {
  const { column } = req.params;
  const validColumns = ['todo', 'in-progress', 'done'];

  if (!validColumns.includes(column)) {
    return res.status(400).json({
      error: 'Invalid column',
      validColumns
    });
  }

  const columnCards = cards.filter((c) => c.column === column);
  res.json(columnCards);
});

app.get('/api/cards/search/:query', (req, res) => {
  const query = req.params.query.toLowerCase();
  const matchingCards = cards.filter(
    (card) =>
      card.title.toLowerCase().includes(query) ||
      card.description.toLowerCase().includes(query)
  );
  res.json(matchingCards);
});

app.post('/api/cards', (req, res) => {
  const { title, description, column } = req.body;

  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res
      .status(400)
      .json({ error: 'Title is required and must be a non-empty string' });
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

app.put('/api/cards/:id', (req, res) => {
  const cardId = parseInt(req.params.id, 10);
  const cardIndex = cards.findIndex((c) => c.id === cardId);

  if (cardIndex === -1) {
    return res.status(404).json({ error: 'Card not found' });
  }

  const { title, description, column } = req.body;

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

app.delete('/api/cards/:id', (req, res) => {
  const cardId = parseInt(req.params.id, 10);
  const cardIndex = cards.findIndex((c) => c.id === cardId);

  if (cardIndex === -1) {
    return res.status(404).json({ error: 'Card not found' });
  }

  const deletedCard = cards[cardIndex];
  cards.splice(cardIndex, 1);
  res.json({ success: true, deleted: deletedCard });
});

app.get('/api/board/stats', (req, res) => {
  const stats = {
    todo: cards.filter((c) => c.column === 'todo').length,
    'in-progress': cards.filter((c) => c.column === 'in-progress').length,
    done: cards.filter((c) => c.column === 'done').length,
    total: cards.length
  };
  res.json(stats);
});

app.get('/api/board/columns', (req, res) => {
  const columns = {
    todo: cards.filter((c) => c.column === 'todo'),
    'in-progress': cards.filter((c) => c.column === 'in-progress'),
    done: cards.filter((c) => c.column === 'done')
  };
  res.json(columns);
});

// ============================================================================
// Health Check
// ============================================================================

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================================================
// Global Error Handler
// ============================================================================

app.use((err, req, res, next) => {
  console.error('Error:', err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'Internal server error' });
});

// ============================================================================
// Start Server
// ============================================================================

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 BigO Board running on http://localhost:${PORT}`);
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
  console.log(`   GET    /api/chat/config`);
  console.log(`   POST   /api/chat/auth`);
  console.log(`   GET    /gotoorbit/approve`);
  console.log(`   POST   /gotoorbit/api/approve-ai`);
  console.log(`   POST   /gotoorbit/api/reject-ai`);
  console.log(`   GET    /gotoorbit/mcp-approve`);
  console.log(`   POST   /gotoorbit/api/approve-mcp-tool`);
  console.log(`   POST   /gotoorbit/api/reject-mcp-tool`);
  console.log(QuadrillianConfig);
});

module.exports = app;
