/**
 * Dynamic Base URL Generation for Frontend
 * 
 * This example demonstrates how to generate the server's LAN base URL
 * at runtime, making the frontend adaptable to different environments.
 */

// Generate dynamic base URL based on current window location
const baseURL = `${window.location.protocol}//${window.location.host}`;

// Helper function to create API endpoints
const api = (path) => `${baseURL}/api${path}`;

// Example usage:
console.log('Dynamic Base URL:', baseURL);
console.log('Chat API endpoint:', api('/chat'));
console.log('Health check endpoint:', api('/health'));

// Example fetch usage:
/*
fetch(api('/chat'), {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt: 'Hello' }),
});
*/

// For WebSocket connections (if needed in the future):
const getWebSocketURL = (path) => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}${path}`;
};

// Example WebSocket usage:
// const socket = new WebSocket(getWebSocketURL('/ws'));
