# Orbit Integration Quick Setup Guide

This guide will help you quickly set up Orbit AI integration with BigO Board.

## Prerequisites

- BigO Board running on `http://localhost:3000`
- Orbit platform running and accessible
- Orbit project created

## Step 1: Get Orbit API Credentials

1. Log into your Orbit instance
2. Navigate to: **Your Project → Settings → API Keys**
3. Create a new API key (or use existing)
4. Note down:
   - **API Key Name** (e.g., `bigo-integration`)
   - **API Key Value** (the actual key string)
   - **Project ID** (usually 1, but check your project)

## Step 2: Configure BigO Board

### Option A: Environment Variables (Recommended for Production)

Create a `.env` file in the project root:

```bash
ORBIT_BASE_URL=http://localhost:80
ORBIT_API_KEY_NAME=your-key-name
ORBIT_API_KEY_VAL=your-key-value
ORBIT_PROJECT_ID=1
```

Then install `dotenv`:
```bash
npm install dotenv
```

And add to the top of `server.js`:
```javascript
require('dotenv').config();
```

### Option B: Direct Configuration (Quick Testing)

Edit `public/orbit-chat.js` and update the `ORBIT_CONFIG` object:

```javascript
const ORBIT_CONFIG = {
  baseUrl: 'http://localhost:80',        // Your Orbit URL
  apiKeyName: 'your-actual-key-name',    // From Orbit
  apiKeyVal: 'your-actual-key-value',    // From Orbit
  projectId: 1                           // Your Orbit project ID
};
```

## Step 3: Create Macros in Orbit

You have two options:

### Option A: Import JSON (Fastest)

1. Open `orbit-macros-config.json` in this project
2. Copy the macros array
3. In Orbit, go to **Macros** → **Import** (or create manually)
4. Create each macro with the settings from the JSON

### Option B: Create Manually

Create these macros one by one in Orbit:

#### 1. `bigo-get-cards`
- **Method:** GET
- **URL:** `http://localhost:3000/api/cards`
- **No parameters**

#### 2. `bigo-move-card`
- **Method:** PUT
- **URL:** `http://localhost:3000/api/cards/:card_id`
- **Parameters:**
  - `card_id` (URL_PARAM, required)
  - `column` (BODY, required)

#### 3. `bigo-create-card`
- **Method:** POST
- **URL:** `http://localhost:3000/api/cards`
- **Parameters:**
  - `title` (BODY, required)
  - `column` (BODY, required)
  - `description` (BODY, optional)

#### 4. `bigo-get-stats`
- **Method:** GET
- **URL:** `http://localhost:3000/api/board/stats`
- **No parameters**

See `orbit-macros-config.json` for all 10 macros.

## Step 4: Create AI Commands in Orbit

Create these commands in Orbit (or import from `orbit-macros-config.json`):

### Command: `move-task`

**Prompt:**
```
When the user asks to move a task from one column to another:

1. Get all cards using (bigo-get-cards)
2. Find the card that matches the task title
3. Use (bigo-move-card {"card_id": <id>, "column": "<target>"}) to move it
4. Confirm: "I've moved '[title]' from [source] to [target]."

Valid columns: 'todo', 'in-progress', 'done'
```

### Command: `get-column-count`

**Prompt:**
```
When the user asks about task counts:

1. Use (bigo-get-stats) to get statistics
2. Extract the count for the requested column
3. Respond: "There are X tasks in the [Column Name] column."

Column mapping:
- 'To Do' or 'todo' → 'todo'
- 'In Progress' or 'in progress' → 'in-progress'
- 'Done' or 'done' → 'done'
```

### Command: `create-task`

**Prompt:**
```
When the user wants to create a task:

1. Extract the task title from the request
2. Determine the column (default to 'todo' if not specified)
3. Use (bigo-create-card {"title": "<title>", "column": "<column>"})
4. Confirm: "I've created the task '[title]' in the [Column Name] column."
```

See `orbit-macros-config.json` for all 6 commands.

## Step 5: Test the Integration

1. **Start BigO Board:**
   ```bash
   npm start
   ```

2. **Verify API is working:**
   ```bash
   curl http://localhost:3000/api/cards
   ```
   Should return JSON array of cards.

3. **Test Orbit macros:**
   - In Orbit, test each macro individually
   - Verify they can call BigO Board API

4. **Test chat:**
   - Open BigO Board: `http://localhost:3000`
   - Click the blue chat button (bottom-right)
   - Try: "How many tasks are in To Do?"

## Troubleshooting

### Chat shows "Orbit not configured"
- Check that you've updated `ORBIT_CONFIG` in `orbit-chat.js`
- Or set environment variables

### "Error connecting to AI assistant"
- Verify Orbit is running
- Check API keys are correct
- Ensure Orbit URL is accessible from browser
- Check browser console (F12) for detailed errors

### Macros fail in Orbit
- Test BigO Board API directly: `curl http://localhost:3000/api/cards`
- Check macro URLs are correct
- Verify CORS is enabled (already in server.js)

### Cards don't update after AI actions
- The page should auto-refresh after actions
- If not, manually refresh the page
- Check that the API call succeeded in Orbit logs

## Next Steps

1. **Add more commands:**
   - List all tasks
   - Search tasks
   - Delete tasks
   - Get detailed board summary

2. **Improve AI prompts:**
   - Handle edge cases
   - Better error messages
   - More natural responses

3. **Deploy:**
   - Update URLs from `localhost` to production URLs
   - Set environment variables on server
   - Update Orbit macros with production URLs

## Support

If you encounter issues:
1. Check browser console (F12) for errors
2. Check Orbit logs for macro execution errors
3. Verify all URLs and API keys are correct
4. Ensure both BigO Board and Orbit are running

