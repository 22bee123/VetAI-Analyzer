// Specify Vercel runtime configuration
export const config = {
  runtime: 'nodejs18.x',
};

import { GoogleGenerativeAI } from "@google/generative-ai";

// Simple Vercel serverless function handler
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { petType, petProblem } = req.body;
    
    // Validate input
    if (!petType || !petProblem) {
      return res.status(400).json({ 
        success: false, 
        message: 'Pet type and problem description are required' 
      });
    }
    
    // Log API key status for debugging (don't log the actual key)
    console.log('API Key status:', process.env.GEMINI_API_KEY ? 'Present' : 'Missing');
    
    // Initialize the Gemini API with the key from environment variables
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Initialize the Gemini model with simpler configuration
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      }
    });
    
    // Simplified prompt
    const prompt = `
      Analyze these symptoms for a ${petType}: ${petProblem}.
      
      Provide:
      1. Possible conditions (3-4) with probability levels (High, Medium, Low)
      2. Brief recommendations
      3. Suggested diagnostic tests
      
      Format as JSON if possible.
    `;
    
    // Generate content using Gemini API
    const result = await model.generateContent(prompt);
    const aiResponse = result.response.text();
    
    // Return a simplified response
    return res.status(200).json({
      success: true,
      data: {
        aiAnalysis: aiResponse,
        simplified: true
      }
    });
    
  } catch (error) {
    // Log detailed error information
    console.error('Error in simple-analyze:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Analysis failed',
      error: error.message,
      errorType: error.name || 'Unknown error type'
    });
  }
}
