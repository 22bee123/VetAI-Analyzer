import dotenv from 'dotenv';
import { exec } from 'child_process';
import { promisify } from 'util';

// Load environment variables
dotenv.config();

const execPromise = promisify(exec);

async function testGeminiAPI() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  console.log('Testing Gemini API with key:', apiKey);
  
  const curlCommand = `curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}" \\
  -H "Content-Type: application/json" \\
  -X POST \\
  -d '{
    "contents": [{
      "parts":[{"text": "Explain how AI works"}]
      }]
     }'`;
  
  try {
    const { stdout, stderr } = await execPromise(curlCommand);
    
    if (stderr) {
      console.error('Error:', stderr);
    }
    
    console.log('Response:', stdout);
    return true;
  } catch (error) {
    console.error('Failed to execute curl command:', error.message);
    return false;
  }
}

testGeminiAPI();
