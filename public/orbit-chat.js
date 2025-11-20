/**
 * Orbit Chat Integration for BigO Board
 * Handles sending messages to Orbit and polling for responses
 */

// Configuration
// Note: We use relative URLs to avoid CORS issues since we're on the same origin
const ORBIT_CONFIG = {
    topicId: 22,  // Default topic ID (you can make this dynamic per user/session)
    userId: 1    // Default user ID (you can get this from your auth system)
  };
  
  // DOM Elements
  const chatToggle = document.getElementById('chat-toggle');
  const chatWidget = document.getElementById('chat-widget');
  const closeChat = document.getElementById('close-chat');
  const chatInput = document.getElementById('chat-input');
  const sendChat = document.getElementById('send-chat');
  const chatMessages = document.getElementById('chat-messages');
  
  // Chat State
  let isLoading = false;
  let currentPollInterval = null;
  let lastMessageTimestamp = 0;
  
  // ============================================================================
  // Event Listeners
  // ============================================================================
  
  chatToggle.addEventListener('click', () => {
    chatWidget.classList.toggle('hidden');
    if (!chatWidget.classList.contains('hidden')) {
      chatInput.focus();
    }
  });
  
  closeChat.addEventListener('click', () => {
    chatWidget.classList.add('hidden');
    // Stop polling when chat is closed
    stopPolling();
  });
  
  sendChat.addEventListener('click', handleSendMessage);
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  });
  
  // ============================================================================
  // Chat Functions
  // ============================================================================
  
  function addMessage(text, isUser = false, isError = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `mb-4 flex ${isUser ? 'justify-end' : 'justify-start'}`;
    
    const messageClass = isError 
      ? 'bg-red-100 text-red-800 border border-red-300'
      : isUser 
        ? 'bg-blue-600 text-white' 
        : 'bg-white text-gray-800 border border-gray-200';
    
    messageDiv.innerHTML = `
      <div class="max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${messageClass} shadow-sm">
        <div class="text-sm whitespace-pre-wrap">${escapeHtml(text)}</div>
      </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
  
  function addLoadingIndicator() {
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loading-indicator';
    loadingDiv.className = 'mb-4 flex justify-start';
    loadingDiv.innerHTML = `
      <div class="bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm">
        <div class="flex items-center gap-2">
          <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span class="text-sm text-gray-600">AI is thinking...</span>
        </div>
      </div>
    `;
    chatMessages.appendChild(loadingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
  
  function removeLoadingIndicator() {
    const loading = document.getElementById('loading-indicator');
    if (loading) {
      loading.remove();
    }
  }
  
  async function handleSendMessage() {
    const message = chatInput.value.trim();
    if (!message || isLoading) return;
    
    // Add user message
    addMessage(message, true);
    chatInput.value = '';
    isLoading = true;
    
    // Show loading indicator
    addLoadingIndicator();
    
    try {
      // Send message to your server, which forwards to Orbit
      // Use relative URL since we're on the same origin (no CORS needed)
      const response = await fetch('/api/orbit/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: message,
          topic_id: ORBIT_CONFIG.topicId,
          user_id: ORBIT_CONFIG.userId
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Remove loading indicator
      removeLoadingIndicator();
      
      // Update topic ID if server returned a different one
      if (data.topic_id) {
        ORBIT_CONFIG.topicId = data.topic_id;
      }
      
      // Start polling for AI response
      startPolling();
      
      // If the AI performed an action (like moving a card), refresh the page after delay
      if (message.toLowerCase().includes('move') || 
          message.toLowerCase().includes('create') || 
          message.toLowerCase().includes('delete') ||
          message.toLowerCase().includes('update')) {
        setTimeout(() => {
          location.reload();
        }, 5000); // Give time for response to come back
      }
      
    } catch (error) {
      console.error('Chat error:', error);
      removeLoadingIndicator();
      addMessage('Error connecting to AI assistant. Please check your server configuration.', false, true);
    } finally {
      isLoading = false;
    }
  }
  
  /**
   * Start polling for AI responses
   */
  function startPolling() {
    // Stop any existing polling
    stopPolling();
    
    let attempts = 0;
    const maxAttempts = 30; // Poll for up to 60 seconds (30 * 2s)
    
    currentPollInterval = setInterval(async () => {
      attempts++;
      
      try {
        // Use relative URL (same origin, no CORS)
        const response = await fetch(`/api/orbit/response/${ORBIT_CONFIG.topicId}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Check if we have a new response
        if (data.hasResponse && data.response) {
          // Only show if this is a new response (timestamp check)
          if (data.timestamp && data.timestamp > lastMessageTimestamp) {
            removeLoadingIndicator();
            addMessage(data.response, false); // false = AI message
            lastMessageTimestamp = data.timestamp;
            stopPolling(); // Stop polling once we got the response
            return;
          } else if (!lastMessageTimestamp) {
            // First response, show it
            removeLoadingIndicator();
            addMessage(data.response, false);
            lastMessageTimestamp = data.timestamp || Date.now();
            stopPolling();
            return;
          }
        }
        
        // If we've polled too many times without getting a response
        if (attempts >= maxAttempts) {
          stopPolling();
          removeLoadingIndicator();
          addMessage('No response received. The AI might be processing or there was an error.', false, true);
        }
        
      } catch (error) {
        console.error('Polling error:', error);
        // Don't stop polling on error, might be temporary
        if (attempts >= maxAttempts) {
          stopPolling();
          removeLoadingIndicator();
          addMessage('Error checking for response. Please try again.', false, true);
        }
      }
    }, 2000); // Poll every 2 seconds
  }
  
  /**
   * Stop polling for responses
   */
  function stopPolling() {
    if (currentPollInterval) {
      clearInterval(currentPollInterval);
      currentPollInterval = null;
    }
  }
  
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  // ============================================================================
  // Initialize
  // ============================================================================
  
  // Clear any old responses when page loads (optional)
  // You might want to keep this commented out if you want to preserve chat history
  // fetch(`${ORBIT_CONFIG.baseUrl}/api/orbit/response/${ORBIT_CONFIG.topicId}`, { method: 'DELETE' });
  
  console.log('Orbit chat initialized');
  
  