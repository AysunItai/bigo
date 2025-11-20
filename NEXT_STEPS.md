# Next Steps: Orbit Integration

You've configured the API keys! Here's what to do next:

## ⚠️ Important: Fix baseUrl

Your `baseUrl` is currently set to `http://localhost:3000` (BigO Board), but it should be your **Orbit instance URL**.

**Update `public/orbit-chat.js` line 10:**
```javascript
baseUrl: 'http://localhost:80',  // Change this to your Orbit URL (usually port 80)
```

**Common Orbit URLs:**
- `http://localhost:80` (default)
- `http://localhost:8080`
- `https://your-orbit-domain.com`

## Step 1: Create Macros in Orbit

You need to create 10 macros in your Orbit project. Here's the quickest way:

### Option A: Create Manually (Recommended for first time)

1. **Log into Orbit** → Go to your Project (ID: 22)
2. **Navigate to Macros** section
3. **Create each macro** one by one:

#### Macro 1: `bigo-get-cards`
- **Name:** `bigo-get-cards`
- **Method:** GET
- **URL:** `http://localhost:3001/api/cards`
- **No parameters**

#### Macro 2: `bigo-move-card`
- **Name:** `bigo-move-card`
- **Method:** PUT
- **URL:** `http://localhost:3001/api/cards/:card_id`
- **Parameters:**
  - `card_id` (URL_PARAM, required)
  - `column` (BODY, required) - Values: `todo`, `in-progress`, `done`

#### Macro 3: `bigo-create-card`
- **Name:** `bigo-create-card`
- **Method:** POST
- **URL:** `http://localhost:3001/api/cards`
- **Parameters:**
  - `title` (BODY, required)
  - `column` (BODY, required)
  - `description` (BODY, optional)

#### Macro 4: `bigo-get-stats`
- **Name:** `bigo-get-stats`
- **Method:** GET
- **URL:** `http://localhost:3001/api/board/stats`
- **No parameters**

#### Macro 5: `bigo-get-column-cards`
- **Name:** `bigo-get-column-cards`
- **Method:** GET
- **URL:** `http://localhost:3001/api/cards/column/:column`
- **Parameters:**
  - `column` (URL_PARAM, required) - Values: `todo`, `in-progress`, `done`

#### Macro 6: `bigo-search-cards`
- **Name:** `bigo-search-cards`
- **Method:** GET
- **URL:** `http://localhost:3000/api/cards/search/:query`
- **Parameters:**
  - `query` (URL_PARAM, required)

#### Macro 7: `bigo-get-card`
- **Name:** `bigo-get-card`
- **Method:** GET
- **URL:** `http://localhost:3001/api/cards/:card_id`
- **Parameters:**
  - `card_id` (URL_PARAM, required)

#### Macro 8: `bigo-update-card`
- **Name:** `bigo-update-card`
- **Method:** PUT
- **URL:** `http://localhost:3001/api/cards/:card_id`
- **Parameters:**
  - `card_id` (URL_PARAM, required)
  - `title` (BODY, optional)
  - `description` (BODY, optional)

#### Macro 9: `bigo-delete-card`
- **Name:** `bigo-delete-card`
- **Method:** DELETE
- **URL:** `http://localhost:3001/api/cards/:card_id`
- **Parameters:**
  - `card_id` (URL_PARAM, required)

#### Macro 10: `bigo-get-columns`
- **Name:** `bigo-get-columns`
- **Method:** GET
- **URL:** `http://localhost:3000/api/board/columns`
- **No parameters**

### Option B: Use JSON Config

See `orbit-macros-config.json` for complete macro definitions with all details.

---

## Step 2: Create AI Commands in Orbit

Create these commands in your Orbit project:

### Command 1: `move-task`

**Name:** `move-task`

**Prompt:**
```
When the user asks to move a task from one column to another:

1. First, get all cards using (bigo-get-cards)
2. Find the card that matches the task title mentioned by the user
3. Determine the source and target columns from the user's request
4. Use (bigo-move-card {"card_id": <id>, "column": "<target-column>"}) to move it
5. Confirm the action to the user

Example user requests:
- "Move 'Fix bug' from To Do to In Progress"
- "Move task 1 to Done"
- "Put 'Review code' in the In Progress column"

Valid column names: 'todo', 'in-progress', 'done'

Always confirm what you did: "I've moved '[task title]' from [source] to [target]."
```

### Command 2: `get-column-count`

**Name:** `get-column-count`

**Prompt:**
```
When the user asks about how many tasks are in a column:

1. Use (bigo-get-stats) to get all column statistics
2. Extract the count for the requested column
3. Respond in a friendly, natural way

Example user requests:
- "How many tasks are in Done?"
- "What's the count for To Do?"
- "How many items are in progress?"

Column name mapping:
- 'To Do' or 'todo' → 'todo'
- 'In Progress' or 'in progress' → 'in-progress'
- 'Done' or 'done' → 'done'

Format your response like: "There are X tasks in the [Column Name] column."
```

### Command 3: `create-task`

**Name:** `create-task`

**Prompt:**
```
When the user wants to create a new task:

1. Extract the task title from the user's request
2. Determine which column to create it in (default to 'todo' if not specified)
3. Use (bigo-create-card {"title": "<title>", "column": "<column>"}) to create it
4. Confirm the creation to the user

Example user requests:
- "Create a task called 'Review code' in To Do"
- "Add 'Fix bug' to In Progress"
- "New task 'Update docs' in Done"

Valid column names: 'todo', 'in-progress', 'done'

Always confirm: "I've created the task '[title]' in the [Column Name] column."
```

### Command 4: `list-tasks`

**Name:** `list-tasks`

**Prompt:**
```
When the user asks to list tasks:

1. If they specify a column, use (bigo-get-column-cards {"column": "<column>"})
2. If they want all tasks, use (bigo-get-cards)
3. Format the response in a readable way, showing title, description, and column

Example user requests:
- "Show me all tasks in To Do"
- "List all tasks"
- "What's in the Done column?"

Format your response as a numbered or bulleted list with task details.
```

### Command 5: `search-tasks`

**Name:** `search-tasks`

**Prompt:**
```
When the user wants to search for tasks:

1. Extract the search query from their request
2. Use (bigo-search-cards {"query": "<search_term>"}) to find matching tasks
3. Display the results in a readable format

Example user requests:
- "Find tasks with 'bug' in the title"
- "Search for 'review'"
- "Show me tasks about 'deployment'"

Format your response showing all matching tasks with their details.
```

### Command 6: `board-summary`

**Name:** `board-summary`

**Prompt:**
```
When the user asks for a board summary or overview:

1. Use (bigo-get-stats) to get column counts
2. Optionally use (bigo-get-columns) to get more details
3. Provide a comprehensive summary

Example user requests:
- "Give me a summary of the board"
- "What's the status of all tasks?"
- "Show me board statistics"

Format your response with:
- Total number of tasks
- Count per column
- Maybe highlight any interesting patterns
```

---

## Step 3: Test Everything

1. **Start BigO Board:**
   ```bash
   npm start
   ```

2. **Verify BigO Board API is working:**
   ```bash
   curl http://localhost:3001/api/cards
   ```
   Should return JSON array of cards.

3. **Test Orbit macros:**
   - In Orbit, test each macro individually
   - Make sure they can successfully call BigO Board API

4. **Test the chat:**
   - Open BigO Board: `http://localhost:3001`
   - Click the blue chat button (bottom-right corner)
   - Try: "How many tasks are in To Do?"
   - Try: "Move 'Sample Task 1' to In Progress"
   - Try: "Create a task called 'Test Task' in To Do"

---

## Quick Checklist

- [ ] Fixed `baseUrl` in `orbit-chat.js` (should be Orbit URL, not BigO Board URL)
- [ ] Created all 10 macros in Orbit
- [ ] Created all 6 AI commands in Orbit
- [ ] Tested BigO Board API (`curl http://localhost:3001/api/cards`)
- [ ] Tested Orbit macros individually
- [ ] Tested chat interface in BigO Board

---

## Need Help?

- Check browser console (F12) for errors
- Check Orbit logs for macro execution errors
- Verify all URLs are correct
- Ensure both BigO Board and Orbit are running

Good luck! 🚀

