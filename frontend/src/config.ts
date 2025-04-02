// API URL based on environment
const isDevelopment = import.meta.env.DEV;

export const API_URL = isDevelopment 
  ? 'http://localhost:5000'
  : ''; // Empty string makes it use relative URLs in production

export default {
  API_URL
}; 