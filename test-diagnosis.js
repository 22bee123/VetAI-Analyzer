import fetch from 'node-fetch';

async function testDiagnosisEndpoint() {
  try {
    console.log('Testing diagnosis endpoint...');
    
    const response = await fetch('http://localhost:5000/api/diagnosis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_AUTH_TOKEN' // Replace with actual token if needed
      },
      body: JSON.stringify({
        animalType: 'dog',
        symptoms: 'vomiting, lethargy'
      })
    });
    
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error testing diagnosis endpoint:', error);
  }
}

testDiagnosisEndpoint();
