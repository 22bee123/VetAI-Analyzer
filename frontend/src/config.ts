// API URL based on environment
const isDevelopment = import.meta.env.DEV;

// Get the current hostname/URL
function getBaseUrl() {
  // For development, use localhost
  if (isDevelopment) {
    return 'http://localhost:5000';
  }

  // For production deployed environments
  if (window.location.hostname === 'localhost') {
    return 'http://localhost:5000'; // Local production build
  }

  // For Render and other cloud providers
  // Using window.location.origin ensures it works on all devices
  return window.location.origin;
}

export const API_URL = getBaseUrl();

export default {
  API_URL
}; 