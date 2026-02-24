// API Configuration
// This file automatically detects the environment and uses the correct API URL

const getApiUrl = () => {
  // Check if we're in production or development
  const hostname = window.location.hostname;
  
  // Production: Use your deployed backend URL
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return 'https://dass-event-management.onrender.com/api'; // Your backend API URL
  }
  
  // Development: Use localhost
  return 'http://localhost:5000/api';
};

const getSocketUrl = () => {
  const hostname = window.location.hostname;
  
  // Production
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return 'https://dass-event-management.onrender.com'; // Your backend URL
  }
  
  // Development
  return 'http://localhost:5000';
};

// Export for use in HTML files
const API_URL = getApiUrl();
const SOCKET_URL = getSocketUrl();

const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

console.log('=== API Configuration ===');
console.log('Environment:', isProduction ? 'PRODUCTION' : 'DEVELOPMENT');
console.log('Hostname:', window.location.hostname);
console.log('API URL:', API_URL);
console.log('Socket URL:', SOCKET_URL);
console.log('========================');

// Test backend connectivity on production
if (isProduction) {
  console.log('⏳ Testing backend connectivity...');
  fetch(SOCKET_URL + '/api/health', { method: 'GET' })
    .then(response => {
      if (response.ok) {
        console.log('✅ Backend is reachable');
      } else {
        console.warn('⚠️ Backend responded with status:', response.status);
      }
    })
    .catch(error => {
      console.error('❌ Backend is not reachable. Render instance may be sleeping or down.');
      console.error('This can take 30-60 seconds to wake up on free tier.');
    });
}
