import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Initialize Gemini API with the same configuration as the diagnosis controller
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Debug function to check the extractConditions and extractRecommendations functions
async function debugDiagnosisController() {
  try {
    const animalType = 'dog';
    const symptoms = 'vomiting, lethargy';
    
    // Use the same model and configuration as in the diagnosis controller
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
    
    console.log('Testing diagnosis controller with gemini-1.5-flash model...');
    console.log('Sending request to Gemini API...');
    
    const result = await model.generateContent(prompt);
    const aiResponse = result.response.text();
    
    console.log('\nAI Response received successfully:');
    console.log(aiResponse.substring(0, 300) + '...');
    
    // Now let's test the parsing functions
    console.log('\nTesting extractConditions function...');
    
    // Simple implementation of extractConditions to debug
    function extractConditions(aiResponse) {
      console.log('Extracting conditions from AI response...');
      const conditions = [];
      
      // Look for sections that might contain condition information
      const lines = aiResponse.split('\n');
      let inConditionsSection = false;
      
      for (const line of lines) {
        // Check if we're in the conditions section
        if (line.toLowerCase().includes('possible conditions') || 
            line.toLowerCase().includes('potential diagnoses')) {
          inConditionsSection = true;
          console.log('Found conditions section:', line);
          continue;
        }
        
        // Check if we've moved past the conditions section
        if (inConditionsSection && 
            (line.toLowerCase().includes('recommendations') || 
             line.toLowerCase().includes('advice'))) {
          inConditionsSection = false;
          console.log('End of conditions section');
          break;
        }
        
        // Extract condition information if we're in the conditions section
        if (inConditionsSection && line.trim() !== '') {
          console.log('Processing line in conditions section:', line);
          
          // Look for patterns like "Condition name - High/Medium/Low probability"
          const match = line.match(/([^-:]+)[-:]\s*(\w+)\s*probability/i);
          
          if (match) {
            console.log('Found condition match:', match[1].trim(), match[2].trim());
            conditions.push({
              condition: match[1].trim(),
              probability: match[2].trim(),
              description: 'Description placeholder' // Simplified for debugging
            });
          }
        }
      }
      
      console.log('Extracted conditions:', conditions);
      return conditions;
    }
    
    // Simple implementation of extractRecommendations to debug
    function extractRecommendations(aiResponse) {
      console.log('Extracting recommendations from AI response...');
      const lines = aiResponse.split('\n');
      let inRecommendationsSection = false;
      let recommendations = '';
      
      for (const line of lines) {
        if (line.toLowerCase().includes('recommendations') || 
            line.toLowerCase().includes('advice for pet owner')) {
          inRecommendationsSection = true;
          console.log('Found recommendations section:', line);
          continue;
        }
        
        if (inRecommendationsSection) {
          recommendations += line + '\n';
        }
      }
      
      console.log('Extracted recommendations:', recommendations.substring(0, 100) + '...');
      return recommendations.trim();
    }
    
    // Test the extraction functions
    const conditions = extractConditions(aiResponse);
    const recommendations = extractRecommendations(aiResponse);
    
    console.log('\nExtraction test complete.');
    console.log('Conditions found:', conditions.length);
    console.log('Recommendations length:', recommendations.length);
    
    return true;
  } catch (error) {
    console.error('Error in debug function:', error.message);
    console.error('Full error:', error);
    return false;
  }
}

debugDiagnosisController();
