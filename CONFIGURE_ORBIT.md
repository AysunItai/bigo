# Quick Configuration Guide

## Step 1: Get Your Orbit API Keys

1. Log into Orbit
2. Go to: **Project → Settings → API Keys**
3. Create or copy an API key
4. Note down:
   - API Key Name
   - API Key Value  
   - Project ID

## Step 2: Update Configuration

Open `public/orbit-chat.js` and update these values:

```javascript
const ORBIT_CONFIG = {
  baseUrl: 'http://localhost:80',        // Your Orbit URL
  apiKeyName: 'YOUR_ACTUAL_KEY_NAME',    // ← Update this
  apiKeyVal: 'YOUR_ACTUAL_KEY_VALUE',    // ← Update this
  projectId: 1                           // ← Update this
};
```

## Step 3: Create Macros in Orbit

See `orbit-macros-config.json` for all macro definitions, or follow `ORBIT_SETUP.md` for detailed instructions.

## Step 4: Test

1. Start BigO Board: `npm start`
2. Open: `http://localhost:3000`
3. Click the chat button (bottom-right)
4. Try: "How many tasks are in To Do?"

That's it! 🎉

