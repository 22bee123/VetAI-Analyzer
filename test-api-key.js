import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

console.log('API Key being used:', process.env.GEMINI_API_KEY);

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testApiKey() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    const prompt = "Hello, can you hear me?";
    
    console.log('Sending test request to Gemini API...');
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    console.log('API Key is valid! Response:', response);
    return true;
  } catch (error) {
    console.error('API Key test failed with error:', error.message);
    if (error.message.includes('API_KEY_INVALID')) {
      console.error('\nYour API key appears to be invalid. Please check that:');
      console.error('1. You have enabled the Gemini API in your Google Cloud Console');
      console.error('2. Your API key has access to the Gemini API');
      console.error('3. Your API key is correctly formatted and not expired');
    }
    return false;
  }
}

testApiKey();
