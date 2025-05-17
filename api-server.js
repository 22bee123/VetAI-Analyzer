// Simple API server for VetAI-Analyzer
import http from 'http';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Create a simple HTTP server
const server = http.createServer(async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Handle API requests
  if (req.url === '/api/analyze' && req.method === 'POST') {
    try {
      // Read the request body
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      
      // Process the request
      await new Promise((resolve) => {
        req.on('end', async () => {
          try {
            const { petType, petProblem } = JSON.parse(body);
            
            // Validate input
            if (!petType || !petProblem) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ 
                success: false, 
                message: 'Pet type and problem description are required' 
              }));
              resolve();
              return;
            }
            
            // Initialize the Gemini API with the key from environment variables
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            
            // Initialize the Gemini model with more tokens and temperature for more detailed responses
            const model = genAI.getGenerativeModel({ 
              model: "gemini-1.5-flash",
              generationConfig: {
                temperature: 0.7,
                topP: 0.9,
                topK: 40,
                maxOutputTokens: 4096,
              }
            });
            
            // Construct the prompt for the AI
            const prompt = `
              I need a comprehensive and detailed veterinary analysis for a ${petType} with the following symptoms: ${petProblem}.
              
              Please provide an extensive and thorough response with:
              1. A detailed analysis of the symptoms with physiological explanations where relevant
              2. Possible conditions (at least 4-5 if applicable) with probability levels (High, Medium, Low) and confidence percentages
              3. Comprehensive description of each condition including pathophysiology, typical progression, and distinguishing features
              4. Detailed recommendations for the pet owner organized by urgency and importance
              5. Potential diagnostic tests that would help confirm the diagnosis
              6. Long-term management considerations if applicable
              
              For the recommendations section, please:
              - Start with a clear, concise summary of the most urgent action needed
              - Provide specific, actionable steps organized by priority
              - Include both immediate care recommendations and follow-up actions
              - Use professional medical terminology while remaining accessible to pet owners
              - Format each recommendation as a separate bullet point for clarity
              - Include timeframes for when to seek veterinary care (e.g., "within 24 hours" or "immediately if symptoms worsen")
              
              For each condition, please include:
              - Common clinical signs and how they relate to the described symptoms
              - Typical progression of the condition if left untreated
              - Potential complications
              - General prognosis with proper treatment
              
              Format the response in a structured way that can be parsed easily, using markdown formatting.
              Please provide an extensive and detailed response (at least 500 words) to ensure comprehensive coverage of all aspects.
            `;
            
            console.log('Sending request to Gemini API...');
            
            // Generate content using Gemini API
            const result = await model.generateContent(prompt);
            const aiResponse = result.response.text();
            
            console.log('Received response from Gemini API');
            
            // Extract structured data from the AI response
            const possibleConditions = extractConditions(aiResponse);
            const recommendations = extractRecommendations(aiResponse);
            const diagnosticTests = extractDiagnosticTests(aiResponse);
            const longTermManagement = extractLongTermManagement(aiResponse);
            
            const analysis = {
              aiAnalysis: aiResponse,
              possibleConditions: possibleConditions,
              recommendations: recommendations,
              diagnosticTests: diagnosticTests,
              longTermManagement: longTermManagement
            };
            
            // Return the analysis to the client
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: true,
              data: analysis
            }));
            
          } catch (error) {
            console.error('Error in analyzePetSymptoms:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: false,
              message: 'Failed to analyze pet symptoms',
              error: error.message
            }));
          }
          resolve();
        });
      });
      
    } catch (error) {
      console.error('Error handling request:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        message: 'Internal server error',
        error: error.message
      }));
    }
  } 
  // Health check endpoint
  else if (req.url === '/api/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'ok', 
      timestamp: new Date().toISOString() 
    }));
  }
  // Serve static files
  else if (req.method === 'GET') {
    let filePath = path.join(__dirname, 'dist', req.url === '/' ? 'index.html' : req.url);
    
    // If the path doesn't have a file extension, serve index.html for client-side routing
    if (!path.extname(filePath) && !filePath.includes('.')) {
      filePath = path.join(__dirname, 'dist', 'index.html');
    }
    
    try {
      if (fs.existsSync(filePath)) {
        const contentType = getContentType(filePath);
        const content = fs.readFileSync(filePath);
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
      } else {
        res.writeHead(404);
        res.end('Not Found');
      }
    } catch (error) {
      console.error('Error serving file:', error);
      res.writeHead(500);
      res.end('Internal Server Error');
    }
  }
  // Handle other requests
  else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API endpoint: http://localhost:${PORT}/api/analyze`);
});

// Helper function to get content type based on file extension
function getContentType(filePath) {
  const extname = path.extname(filePath);
  switch (extname) {
    case '.html':
      return 'text/html';
    case '.js':
      return 'text/javascript';
    case '.css':
      return 'text/css';
    case '.json':
      return 'application/json';
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.gif':
      return 'image/gif';
    case '.svg':
      return 'image/svg+xml';
    default:
      return 'text/plain';
  }
}

// Helper functions from the original backend
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
        line.toLowerCase().includes('potential diagnoses') ||
        line.toLowerCase().includes('possible diagnoses')) {
      inConditionsSection = true;
      continue;
    }
    
    // Check if we've moved past the conditions section to descriptions or recommendations
    if (inConditionsSection && 
        (line.toLowerCase().includes('description of each condition') || 
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
        continue;
      }
      
      // Try bullet point format: "• Condition name (High/Medium/Low)"
      const bulletMatch = line.match(/^[*•-]\s+(.+?)\s*\((\w+)\)/);
      if (bulletMatch) {
        conditions.push({
          condition: bulletMatch[1].trim(),
          probability: bulletMatch[2].trim(),
          description: '' // Will be filled in second pass
        });
        continue;
      }
      
      // Try numbered format: "1. Condition name (High/Medium/Low)"
      const numberedMatch = line.match(/^\d+\.\s+(.+?)\s*\((\w+)\)/);
      if (numberedMatch) {
        conditions.push({
          condition: numberedMatch[1].trim(),
          probability: numberedMatch[2].trim(),
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
  
  // If we still don't have any conditions, try a more aggressive approach
  if (conditions.length === 0) {
    // Look for any lines that might contain condition information
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Look for lines with probability indicators
      if (line.toLowerCase().includes('high') || 
          line.toLowerCase().includes('medium') || 
          line.toLowerCase().includes('low')) {
        
        // Try to extract condition and probability
        let condition = '';
        let probability = '';
        
        if (line.toLowerCase().includes('high')) {
          probability = 'High';
          condition = line.split('high')[0].trim();
        } else if (line.toLowerCase().includes('medium')) {
          probability = 'Medium';
          condition = line.split('medium')[0].trim();
        } else if (line.toLowerCase().includes('low')) {
          probability = 'Low';
          condition = line.split('low')[0].trim();
        }
        
        // Clean up the condition name
        condition = condition.replace(/^[*•-]\s+/, '')  // Remove bullet points
                           .replace(/^\d+\.\s+/, '')    // Remove numbering
                           .replace(/\s*[-:]\s*$/, '')  // Remove trailing dash or colon
                           .trim();
        
        if (condition && probability) {
          conditions.push({
            condition,
            probability,
            description: 'No detailed description available'
          });
        }
      }
    }
  }
  
  // Ensure we return at least one condition with a fallback
  if (conditions.length === 0) {
    console.log('Warning: Could not extract conditions from AI response. Using fallback.');
    return [
      {
        condition: 'Unspecified Condition',
        probability: 'Medium',
        description: 'The AI response did not contain clearly formatted conditions. Please consult with a veterinarian for a proper diagnosis.'
      }
    ];
  }
  
  return conditions;
}

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
      // Add the header if it's a proper heading
      if (line.match(/^#+\s+/)) {
        recommendations.push(line.replace(/^#+\s+/, '**') + '**');
      }
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
      // Format bullet points consistently
      if (line.match(/^[*•-]\s+/)) {
        recommendations.push(line.replace(/^[*•-]\s+/, '• '));
      } else if (line.match(/^\d+\.\s+/)) {
        // Keep numbered lists as is
        recommendations.push(line);
      } else if (line.match(/^[A-Z]/)) {
        // If it starts with a capital letter and isn't a bullet point, it might be a new paragraph
        recommendations.push('\n' + line);
      } else {
        recommendations.push(line);
      }
    }
  }
  
  // If we found recommendations, join them and format them
  if (recommendations.length > 0) {
    let formattedRecommendations = recommendations.join('\n');
    
    // Add a professional note at the end if not already present
    if (!formattedRecommendations.toLowerCase().includes('consult') && 
        !formattedRecommendations.toLowerCase().includes('veterinarian')) {
      formattedRecommendations += '\n\n**Important Note:** This analysis is provided as guidance only. Please consult with a licensed veterinarian for proper diagnosis and treatment.';
    }
    
    return formattedRecommendations;
  }
  
  // Fallback: try to find recommendations using regex
  const recommendationsMatch = aiResponse.match(/recommendations[:\s]+([\s\S]+?)(?=\n\n|\n[A-Z#]|$)/i);
  
  if (recommendationsMatch && recommendationsMatch[1]) {
    return recommendationsMatch[1].trim();
  }
  
  return 'No specific recommendations provided. Please consult with a veterinarian for proper guidance based on your pet\'s symptoms.';
}

function extractDiagnosticTests(aiResponse) {
  const lines = aiResponse.split('\n');
  let inDiagnosticTestsSection = false;
  let diagnosticTests = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check if we're in the diagnostic tests section
    if (line.toLowerCase().includes('diagnostic tests') || 
        line.toLowerCase().includes('potential tests') ||
        line.toLowerCase().includes('recommended tests')) {
      inDiagnosticTestsSection = true;
      // Add the header if it's a proper heading
      if (line.match(/^#+\s+/)) {
        diagnosticTests.push(line.replace(/^#+\s+/, '**') + '**');
      }
      continue;
    }
    
    // Check if we've moved past the diagnostic tests section
    if (inDiagnosticTestsSection && line !== '' && 
        line.match(/^#+\s+[A-Z]/) && // Markdown heading
        !line.toLowerCase().includes('test') &&
        !line.toLowerCase().includes('diagnos')) {
      inDiagnosticTestsSection = false;
      break;
    }
    
    // Collect diagnostic test lines
    if (inDiagnosticTestsSection && line !== '') {
      // Format bullet points consistently
      if (line.match(/^[*•-]\s+/)) {
        diagnosticTests.push(line.replace(/^[*•-]\s+/, '• '));
      } else if (line.match(/^\d+\.\s+/)) {
        // Keep numbered lists as is
        diagnosticTests.push(line);
      } else if (line.match(/^[A-Z]/)) {
        // If it starts with a capital letter and isn't a bullet point, it might be a new paragraph
        diagnosticTests.push('\n' + line);
      } else {
        diagnosticTests.push(line);
      }
    }
  }
  
  // If we found diagnostic tests, join them and format them
  if (diagnosticTests.length > 0) {
    return diagnosticTests.join('\n');
  }
  
  // Fallback: try to find diagnostic tests using regex
  const testsMatch = aiResponse.match(/diagnostic tests[:\s]+([\s\S]+?)(?=\n\n|\n[A-Z#]|$)/i);
  
  if (testsMatch && testsMatch[1]) {
    return testsMatch[1].trim();
  }
  
  return 'No specific diagnostic tests provided. A veterinarian would determine appropriate tests based on physical examination.';
}

function extractLongTermManagement(aiResponse) {
  const lines = aiResponse.split('\n');
  let inLongTermSection = false;
  let longTermInfo = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check if we're in the long-term management section
    if (line.toLowerCase().includes('long-term management') || 
        line.toLowerCase().includes('long term management') ||
        line.toLowerCase().includes('ongoing care') ||
        line.toLowerCase().includes('management considerations')) {
      inLongTermSection = true;
      // Add the header if it's a proper heading
      if (line.match(/^#+\s+/)) {
        longTermInfo.push(line.replace(/^#+\s+/, '**') + '**');
      }
      continue;
    }
    
    // Check if we've moved past the long-term section
    if (inLongTermSection && line !== '' && 
        line.match(/^#+\s+[A-Z]/) && // Markdown heading
        !line.toLowerCase().includes('management') &&
        !line.toLowerCase().includes('care') &&
        !line.toLowerCase().includes('long-term')) {
      inLongTermSection = false;
      break;
    }
    
    // Collect long-term management lines
    if (inLongTermSection && line !== '') {
      // Format bullet points consistently
      if (line.match(/^[*•-]\s+/)) {
        longTermInfo.push(line.replace(/^[*•-]\s+/, '• '));
      } else if (line.match(/^\d+\.\s+/)) {
        // Keep numbered lists as is
        longTermInfo.push(line);
      } else if (line.match(/^[A-Z]/)) {
        // If it starts with a capital letter and isn't a bullet point, it might be a new paragraph
        longTermInfo.push('\n' + line);
      } else {
        longTermInfo.push(line);
      }
    }
  }
  
  // If we found long-term management info, join them and format them
  if (longTermInfo.length > 0) {
    return longTermInfo.join('\n');
  }
  
  // Fallback: try to find long-term management using regex
  const managementMatch = aiResponse.match(/long.term management[:\s]+([\s\S]+?)(?=\n\n|\n[A-Z#]|$)/i);
  
  if (managementMatch && managementMatch[1]) {
    return managementMatch[1].trim();
  }
  
  return 'No specific long-term management information provided. A veterinarian would develop an appropriate long-term care plan based on diagnosis.';
}
