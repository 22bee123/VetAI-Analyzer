import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables - using the same path resolution as the server
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Initialize Gemini API with the same configuration as the diagnosis controller
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testDiagnosisLogic() {
  try {
    const animalType = 'dog';
    const symptoms = 'vomiting, lethargy';
    
    // Use the exact same model and configuration as in the diagnosis controller
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Use the exact same prompt as in the diagnosis controller
    const prompt = `
      I need a veterinary analysis for a ${animalType} with the following symptoms: ${symptoms}.
      
      Please provide:
      1. A detailed analysis of the symptoms
      2. Possible conditions (at least 3 if applicable) with probability levels (High, Medium, Low)
      3. Brief description of each condition
      4. Recommendations for the pet owner
      
      Format the response in a structured way that can be parsed easily.
    `;
    
    console.log('Testing diagnosis controller logic with gemini-1.5-flash model...');
    console.log('Sending request to Gemini API...');
    
    const result = await model.generateContent(prompt);
    const aiResponse = result.response.text();
    
    console.log('\nSuccess! The diagnosis controller should now work correctly.');
    console.log('\nResponse preview:');
    console.log(aiResponse.substring(0, 300) + '...');
    
    return true;
  } catch (error) {
    console.error('Error testing diagnosis controller logic:', error.message);
    console.error('Full error:', error);
    return false;
  }
}

testDiagnosisLogic();
