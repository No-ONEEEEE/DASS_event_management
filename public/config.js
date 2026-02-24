// API Configuration
// This file automatically detects the environment and uses the correct API URL

const getApiUrl = () => {
  // Check if we're in production or development
  const hostname = window.location.hostname;
  
  // Production: Use your deployed backend URL
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return 'https://event-management-system-backend-r4d4.onrender.com/api'; // Replace with your actual backend URL
  }
  
  // Development: Use localhost
  return 'http://localhost:5000/api';
};

const getSocketUrl = () => {
  const hostname = window.location.hostname;
  
  // Production
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return 'https://event-management-system-backend-r4d4.onrender.com'; // Replace with your actual backend URL
  }
  
  // Development
  return 'http://localhost:5000';
};

// Export for use in HTML files
const API_URL = getApiUrl();
const SOCKET_URL = getSocketUrl();

console.log('Environment:', window.location.hostname);
console.log('API URL:', API_URL);
console.log('Socket URL:', SOCKET_URL);
