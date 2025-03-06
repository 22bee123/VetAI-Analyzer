import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') });

async function testDiagnosisEndpoint() {
  try {
    console.log('Testing diagnosis endpoint with authentication...');
    
    // First, let's get a token by logging in
    console.log('Attempting to login to get a token...');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@example.com',  // Replace with a valid email
        password: 'password123'     // Replace with a valid password
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);
    
    if (!loginData.success) {
      console.log('Login failed, trying diagnosis endpoint without authentication...');
      
      // Try the diagnosis endpoint without authentication
      const diagnosisResponse = await fetch('http://localhost:5000/api/diagnosis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          animalType: 'dog',
          symptoms: 'vomiting, lethargy'
        })
      });
      
      // Get the full response text to see any error details
      const responseText = await diagnosisResponse.text();
      
      try {
        // Try to parse as JSON
        const diagnosisData = JSON.parse(responseText);
        console.log('Diagnosis response:', diagnosisData);
      } catch (e) {
        // If not valid JSON, show the raw response
        console.log('Raw diagnosis response:', responseText);
      }
      
      console.log('Response status:', diagnosisResponse.status);
    } else {
      // If login succeeded, use the token for the diagnosis request
      const token = loginData.token;
      
      const diagnosisResponse = await fetch('http://localhost:5000/api/diagnosis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          animalType: 'dog',
          symptoms: 'vomiting, lethargy'
        })
      });
      
      // Get the full response text to see any error details
      const responseText = await diagnosisResponse.text();
      
      try {
        // Try to parse as JSON
        const diagnosisData = JSON.parse(responseText);
        console.log('Diagnosis response:', diagnosisData);
      } catch (e) {
        // If not valid JSON, show the raw response
        console.log('Raw diagnosis response:', responseText);
      }
      
      console.log('Response status:', diagnosisResponse.status);
    }
  } catch (error) {
    console.error('Error testing diagnosis endpoint:', error);
  }
}

testDiagnosisEndpoint();
