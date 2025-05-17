// API URL based on environment
const isDevelopment = import.meta.env.DEV;

// Get the current hostname/URL
function getBaseUrl() {
  // For development, use the API server directly
  if (isDevelopment) {
    return 'http://localhost:3000';
  }

  // For production deployed environments
  // Empty string means use relative URLs which works with Vercel serverless functions
  return '';
}

export const API_URL = getBaseUrl();

export default {
  API_URL
}; 