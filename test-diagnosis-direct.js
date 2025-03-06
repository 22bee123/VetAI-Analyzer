import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testDiagnosisPrompt() {
  try {
    const animalType = 'dog';
    const symptoms = 'vomiting, lethargy';
    
    // Use the same model and prompt as in the diagnosis controller
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    const prompt = `
      I need a veterinary analysis for a ${animalType} with the following symptoms: ${symptoms}.
      
      Please provide:
      1. A detailed analysis of the symptoms
      2. Possible conditions (at least 3 if applicable) with probability levels (High, Medium, Low)
      3. Brief description of each condition
      4. Recommendations for the pet owner
      
      Format the response in a structured way that can be parsed easily.
    `;
    
    console.log('Sending test request to Gemini API with diagnosis prompt...');
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    console.log('Diagnosis test successful! Response preview:');
    console.log(response.substring(0, 500) + '...');
  } catch (error) {
    console.error('Diagnosis test failed with error:', error.message);
    console.error('Full error:', error);
  }
}

testDiagnosisPrompt();
