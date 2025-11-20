# BigO Board

A Kanban-style board application with drag-and-drop functionality, built with Node.js, Express, and EJS. Now integrated with Orbit AI for natural language board management!

## Features

- 3-column board layout (To Do, In Progress, Done)
- Drag and drop cards between columns
- Add, edit, and delete cards
- **AI-powered chat interface** (Orbit integration)
- In-memory data storage
- Responsive design with Tailwind CSS

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

3. Open your browser and navigate to:
```
http://localhost:3000
```

## Tech Stack

- **Node.js** - Runtime environment
- **Express** - Web framework
- **EJS** - Template engine
- **Vanilla JavaScript** - Drag and drop functionality
- **Tailwind CSS** - Styling (via CDN)
- **Orbit AI** - Natural language board management

## API Endpoints

### View Routes
- `GET /` - Render the board

### Card Operations
- `GET /api/cards` - Get all cards
- `GET /api/cards/:id` - Get a specific card by ID
- `GET /api/cards/column/:column` - Get cards in a specific column
- `GET /api/cards/search/:query` - Search cards by title/description
- `POST /api/cards` - Create a new card
- `PUT /api/cards/:id` - Update a card
- `DELETE /api/cards/:id` - Delete a card

### Board Operations
- `GET /api/board/stats` - Get board statistics (counts per column)
- `GET /api/board/columns` - Get all columns with their cards

### Health Check
- `GET /health` - Health check endpoint

## Orbit AI Integration

BigO Board is integrated with Orbit AI, allowing you to manage your board through natural language chat!

### Setup Orbit Integration

1. **Get your Orbit credentials:**
   - Log into your Orbit instance
   - Go to your Project → API Keys
   - Create a new API key and note:
     - `api_key_name`
     - `api_key_val`
     - `project_id`

2. **Configure Orbit in BigO Board:**

   **Option A: Environment Variables (Recommended)**
   ```bash
   export ORBIT_BASE_URL="http://localhost:80"
   export ORBIT_API_KEY_NAME="your-key-name"
   export ORBIT_API_KEY_VAL="your-key-value"
   export ORBIT_PROJECT_ID=1
   ```

   **Option B: Edit `public/orbit-chat.js`**
   ```javascript
   const ORBIT_CONFIG = {
     baseUrl: 'http://localhost:80',
     apiKeyName: 'your-key-name',
     apiKeyVal: 'your-key-value',
     projectId: 1
   };
   ```

3. **Create Macros in Orbit:**

   Import the macros from `orbit-macros-config.json` into your Orbit project, or create them manually:

   - `bigo-get-cards` - Get all cards
   - `bigo-get-card` - Get a specific card
   - `bigo-get-column-cards` - Get cards in a column
   - `bigo-search-cards` - Search cards
   - `bigo-create-card` - Create a new card
   - `bigo-move-card` - Move a card between columns
   - `bigo-update-card` - Update a card
   - `bigo-delete-card` - Delete a card
   - `bigo-get-stats` - Get board statistics
   - `bigo-get-columns` - Get all columns

4. **Create AI Commands in Orbit:**

   Import the commands from `orbit-macros-config.json`, or create them manually:
   - `move-task` - Move tasks between columns
   - `get-column-count` - Get task counts
   - `create-task` - Create new tasks
   - `list-tasks` - List tasks
   - `search-tasks` - Search for tasks
   - `board-summary` - Get board overview

### Using the Chat Interface

1. Click the blue chat button (bottom-right corner)
2. Try these commands:
   - "Move 'Fix bug' from To Do to In Progress"
   - "How many tasks are in Done?"
   - "Create a task called 'Review code' in To Do"
   - "Show me all tasks in In Progress"
   - "Search for tasks with 'bug'"
   - "Give me a summary of the board"

### Example Conversations

**User:** "Move 'Fix bug' to In Progress"  
**AI:** "I've moved 'Fix bug' from To Do to In Progress"  
*[Page refreshes, card is now in In Progress]*

**User:** "How many tasks are in Done?"  
**AI:** "There are 3 tasks in the Done column."

**User:** "Create a task called 'Review code' in To Do"  
**AI:** "I've created the task 'Review code' in the To Do column."  
*[Page refreshes, new card appears]*

## Troubleshooting

### Chat not working?
- Check browser console (F12) for errors
- Verify Orbit API keys are correct in `orbit-chat.js`
- Ensure Orbit is running and accessible
- Check that CORS is enabled (already included in server.js)

### Macros not executing?
- Test BigO Board API directly: `curl http://localhost:3000/api/cards`
- Check Orbit macro configuration
- Verify URLs are correct (localhost vs deployed)

### CORS errors?
- CORS is already enabled in server.js
- Ensure Orbit can reach your BigO Board URL

## Files Structure

```
bigO/
├── server.js                 # Express server with Orbit API endpoints
├── package.json              # Dependencies
├── views/
│   └── index.ejs            # Main board view with chat widget
├── public/
│   ├── app.js               # Drag & drop functionality
│   ├── orbit-chat.js       # Orbit chat integration
│   └── styles.css          # Custom styles
├── orbit-macros-config.json  # Orbit macros & commands config
└── orbit-config.example.js  # Example Orbit configuration
```

## Next Steps

1. Replace in-memory storage with a database
2. Add user authentication
3. Add more sophisticated AI commands
4. Deploy to production
5. Add webhooks for real-time updates

## License

ISC

