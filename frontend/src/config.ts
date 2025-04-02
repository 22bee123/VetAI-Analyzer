// API URL based on environment
const isDevelopment = import.meta.env.DEV;

// In production, use the current origin (empty string makes it use relative URLs)
// For mobile compatibility, we'll use the full origin URL
export const API_URL = isDevelopment 
  ? 'http://localhost:5000'
  : window.location.origin; // This will use the full URL of wherever the app is hosted

export default {
  API_URL
}; 