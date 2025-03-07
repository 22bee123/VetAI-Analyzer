import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config();

// Initialize the Gemini API with the key from .env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Analyzes pet symptoms using the Gemini API
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const analyzePetSymptoms = async (req, res) => {
  try {
    const { petType, petProblem } = req.body;
    
    // Validate input
    if (!petType || !petProblem) {
      return res.status(400).json({ 
        success: false, 
        message: 'Pet type and problem description are required' 
      });
    }
    
    // Initialize the Gemini model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Construct the prompt for the AI
    const prompt = `
      I need a veterinary analysis for a ${petType} with the following symptoms: ${petProblem}.
      
      Please provide:
      1. A detailed analysis of the symptoms
      2. Possible conditions (at least 3 if applicable) with probability levels (High, Medium, Low)
      3. Brief description of each condition
      4. Recommendations for the pet owner
      
      Format the response in a structured way that can be parsed easily.
    `;
    
    console.log('Sending request to Gemini API...');
    
    // Generate content using Gemini API
    const result = await model.generateContent(prompt);
    const aiResponse = result.response.text();
    
    console.log('AI Response type:', typeof aiResponse);
    
    // Extract structured data from the AI response
    const analysis = {
      aiAnalysis: aiResponse,
      possibleConditions: extractConditions(aiResponse),
      recommendations: extractRecommendations(aiResponse)
    };
    
    // Return the analysis to the client
    return res.status(200).json({
      success: true,
      data: analysis
    });
    
  } catch (error) {
    console.error('Error in analyzePetSymptoms:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to analyze pet symptoms',
      error: error.message
    });
  }
};

/**
 * Extracts conditions from the AI response
 * @param {string} aiResponse - The raw AI response text
 * @returns {Array} - Array of condition objects
 */
function extractConditions(aiResponse) {
  // This is a more robust extraction logic to handle different AI response formats
  const conditions = [];
  
  // Look for sections that might contain condition information
  const lines = aiResponse.split('\n');
  let inConditionsSection = false;
  
  // First pass: Find the conditions section and extract condition names and probabilities
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if we're in the conditions section
    if (line.toLowerCase().includes('possible conditions') || 
        line.toLowerCase().includes('potential diagnoses')) {
      inConditionsSection = true;
      continue;
    }
    
    // Check if we've moved past the conditions section to descriptions or recommendations
    if (inConditionsSection && 
        (line.toLowerCase().includes('description') || 
         line.toLowerCase().includes('recommendations') || 
         line.toLowerCase().includes('advice'))) {
      inConditionsSection = false;
      break;
    }
    
    // Extract condition information if we're in the conditions section
    if (inConditionsSection && line.trim() !== '') {
      // Skip table headers and separators
      if (line.includes('|') && (line.includes('Condition') || line.includes('---'))) {
        continue;
      }
      
      // Try to extract from table format first (markdown table)
      const tableMatch = line.match(/\|\s*\*?\*?([^|]+)\*?\*?\s*\|\s*(\w+)\s*\|/);
      if (tableMatch) {
        const condition = tableMatch[1].replace(/\*/g, '').trim();
        const probability = tableMatch[2].trim();
        
        conditions.push({
          condition,
          probability,
          description: '' // Will be filled in second pass
        });
        continue;
      }
      
      // Try standard format: "Condition name - High/Medium/Low probability"
      const standardMatch = line.match(/([^-:]+)[-:]\s*(\w+)\s*probability/i);
      if (standardMatch) {
        conditions.push({
          condition: standardMatch[1].trim(),
          probability: standardMatch[2].trim(),
          description: '' // Will be filled in second pass
        });
      }
    }
  }
  
  // Second pass: Extract descriptions for each condition
  let inDescriptionsSection = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if we're in the descriptions section
    if (line.toLowerCase().includes('description of each condition') || 
        (line.toLowerCase().includes('description') && !inDescriptionsSection)) {
      inDescriptionsSection = true;
      continue;
    }
    
    // Check if we've moved past the descriptions section
    if (inDescriptionsSection && 
        (line.toLowerCase().includes('recommendations') || 
         line.toLowerCase().includes('advice'))) {
      inDescriptionsSection = false;
      break;
    }
    
    // Extract descriptions if we're in the descriptions section
    if (inDescriptionsSection && line.trim() !== '') {
      // Look for lines that start with a condition name (often with asterisks or bullet points)
      for (let j = 0; j < conditions.length; j++) {
        const conditionName = conditions[j].condition;
        
        // Match condition name at the start of a line (possibly with markdown formatting)
        if (line.replace(/^[*•-]\s*\*?\*?/, '').toLowerCase().startsWith(conditionName.toLowerCase()) ||
            line.includes(`**${conditionName}**`) || 
            line.includes(`*${conditionName}*`)) {
          
          // Extract the description (could be on this line after a colon, or on subsequent lines)
          let description = '';
          
          // If description is on the same line after a colon
          const colonIndex = line.indexOf(':');
          if (colonIndex !== -1) {
            description = line.substring(colonIndex + 1).trim();
          }
          
          // Look ahead for additional description lines
          let k = i + 1;
          while (k < lines.length && 
                 lines[k].trim() !== '' && 
                 !lines[k].match(/^[*•-]\s*\*?\*?[A-Z]/) && // Not the start of a new condition
                 !lines[k].toLowerCase().includes('recommendations')) {
            description += ' ' + lines[k].trim();
            k++;
          }
          
          // Update the condition with the description
          conditions[j].description = description.trim();
          break;
        }
      }
    }
  }
  
  // If we couldn't find descriptions in a dedicated section, try to extract them from the conditions section
  if (conditions.length > 0 && conditions.every(c => c.description === '')) {
    for (let i = 0; i < conditions.length; i++) {
      conditions[i].description = extractDescriptionForCondition(conditions[i].condition, lines);
    }
  }
  
  return conditions;
}

/**
 * Helper function to extract description for a specific condition
 * @param {string} conditionName - The name of the condition
 * @param {Array} lines - Array of lines from the AI response
 * @returns {string} - The extracted description
 */
function extractDescriptionForCondition(conditionName, lines) {
  // Look for descriptions that follow the condition name
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(conditionName)) {
      // Return the next line as the description if it doesn't seem like another condition
      if (i + 1 < lines.length && 
          !lines[i + 1].includes('probability') && 
          lines[i + 1].trim() !== '') {
        return lines[i + 1].trim();
      }
    }
  }
  
  return 'No detailed description available';
}

/**
 * Extracts recommendations from the AI response
 * @param {string} aiResponse - The raw AI response text
 * @returns {string} - The extracted recommendations
 */
function extractRecommendations(aiResponse) {
  // More robust extraction of recommendations
  const lines = aiResponse.split('\n');
  let inRecommendationsSection = false;
  let recommendations = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check if we're in the recommendations section
    if (line.toLowerCase().includes('recommendations') || 
        line.toLowerCase().includes('advice for pet owner') ||
        line.toLowerCase().includes('advice to pet owner')) {
      inRecommendationsSection = true;
      continue;
    }
    
    // Check if we've moved past the recommendations section (to a new major section)
    if (inRecommendationsSection && line !== '' && 
        line.match(/^#+\s+[A-Z]/) && // Markdown heading
        !line.toLowerCase().includes('recommendation')) {
      inRecommendationsSection = false;
      break;
    }
    
    // Collect recommendation lines
    if (inRecommendationsSection && line !== '') {
      recommendations.push(line);
    }
  }
  
  // If we found recommendations, join them
  if (recommendations.length > 0) {
    return recommendations.join('\n');
  }
  
  // Fallback: try to find recommendations using regex
  const recommendationsMatch = aiResponse.match(/recommendations[:\s]+([\s\S]+?)(?=\n\n|\n[A-Z#]|$)/i);
  
  if (recommendationsMatch && recommendationsMatch[1]) {
    return recommendationsMatch[1].trim();
  }
  
  return 'No specific recommendations provided';
}