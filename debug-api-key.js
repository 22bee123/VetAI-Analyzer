import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables - using the same path resolution as the server
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Log environment info
console.log('Environment info:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('API Key length:', process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0);
console.log('API Key first 5 chars:', process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 5) : 'none');

// Try different models
const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

async function testModel(modelName) {
  try {
    console.log(`\nTesting model: ${modelName}`);
    const model = genAI.getGenerativeModel({ model: modelName });
    const prompt = "Hello, can you hear me?";
    
    console.log('Sending test request...');
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    console.log('Success! Response:', response.substring(0, 100) + '...');
    return true;
  } catch (error) {
    console.error(`Error with model ${modelName}:`, error.message);
    return false;
  }
}

async function main() {
  // Test with different models
  await testModel("gemini-1.0-pro");
  await testModel("gemini-1.5-flash");
  await testModel("gemini-1.5-pro");
  
  // If all tests fail, try with a hardcoded API key for testing
  console.log("\nIf all tests failed, let's try with a new API key...");
  console.log("Visit https://ai.google.dev/tutorials/setup to get a new API key");
  console.log("Then update your .env file with the new key");
}

main();
