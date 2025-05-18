import React, { useState } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import NearbyVetsMap from '../components/NearbyVetsMap';

interface FormData {
  petType: string;
  customPetType: string;
  petAge: string;
  petWeight: string;
  petBreed: string;
  symptoms: string;
}

interface Condition {
  name: string;
  severity: 'Mild' | 'Moderate' | 'Serious' | 'Emergency' | string;
}

interface AnalysisResult {
  conditions: Condition[];
  assessment: string;
  diagnostics: string;
  homeCare: string;
  vetCareIndicators: string;
  rawResponse?: string;
}

const FillupForm: React.FC = () => {
  // Form state
  const [formData, setFormData] = useState<FormData>({
    petType: '',
    customPetType: '',
    petAge: '',
    petWeight: '',
    petBreed: '',
    symptoms: ''
  });

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [showResult, setShowResult] = useState(false);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Construct the prompt for the AI
  const constructVetPrompt = (data: FormData): string => {
    const petType = data.petType === 'other' ? data.customPetType : data.petType;
    
    return `You are an experienced veterinarian with specialized knowledge in ${petType} health issues. You provide accurate, professional assessments based on symptoms described by pet owners.

    PET INFORMATION:
    - Species: ${petType}
    - Age: ${data.petAge || 'Not specified'}
    - Weight: ${data.petWeight || 'Not specified'}
    - Breed: ${data.petBreed || 'Not specified'}

    REPORTED SYMPTOMS AND CONCERNS:
    "${data.symptoms}"

    Please provide a professional veterinary assessment with the following sections clearly labeled:

    1. POSSIBLE CONDITIONS: List 3 most likely conditions in order of probability. For each condition, include a severity rating (Mild, Moderate, Serious, or Emergency).
    
    2. CLINICAL ASSESSMENT: Explain the connection between the reported symptoms and the possible conditions. Focus on the physiological mechanisms involved.
    
    3. RECOMMENDED DIAGNOSTICS: List the most appropriate diagnostic tests that would help confirm or rule out the conditions.
    
    4. HOME CARE RECOMMENDATIONS: Provide specific, actionable advice for managing the pet's condition at home. Include dosing information for any over-the-counter medications if appropriate.
    
    5. VETERINARY CARE INDICATORS: Clearly state which symptoms or developments would necessitate immediate professional veterinary attention.

    Format your response in plain text without markdown formatting. Be concise but thorough. Use medical terminology where appropriate but ensure explanations are accessible to pet owners. Your assessment should be professional, evidence-based, and compassionate.`;
  };

  // Parse the AI response into structured data
  const parseResponse = (text: string): AnalysisResult => {
    // Initialize with empty values
    const result: AnalysisResult = {
      conditions: [],
      assessment: '',
      diagnostics: '',
      homeCare: '',
      vetCareIndicators: '',
      rawResponse: text
    };

    // Extract sections based on headings
    const conditionsMatch = text.match(/POSSIBLE CONDITIONS:([\s\S]*?)(?=CLINICAL ASSESSMENT:|$)/i);
    const assessmentMatch = text.match(/CLINICAL ASSESSMENT:([\s\S]*?)(?=RECOMMENDED DIAGNOSTICS:|$)/i);
    const diagnosticsMatch = text.match(/RECOMMENDED DIAGNOSTICS:([\s\S]*?)(?=HOME CARE RECOMMENDATIONS:|$)/i);
    const homeCareMatch = text.match(/HOME CARE RECOMMENDATIONS:([\s\S]*?)(?=VETERINARY CARE INDICATORS:|$)/i);
    const vetCareMatch = text.match(/VETERINARY CARE INDICATORS:([\s\S]*?)(?=$)/i);

    // Parse conditions with severity
    if (conditionsMatch && conditionsMatch[1]) {
      const conditionsText = conditionsMatch[1].trim();
      // Look for patterns like "1. Condition Name (Severity)" or similar formats
      const conditionLines = conditionsText.split('\n')
        .filter(line => line.trim().length > 0);
      
      result.conditions = conditionLines.map(line => {
        // Remove numbers and bullet points at the beginning
        let cleanLine = line.replace(/^\d+\.\s*|^-\s*|^•\s*/g, '').trim();
        
        // Extract severity if in parentheses
        const severityMatch = cleanLine.match(/(.*?)\s*\((Mild|Moderate|Serious|Emergency)\)/i);
        if (severityMatch) {
          return {
            name: severityMatch[1].trim(),
            severity: severityMatch[2]
          };
        }
        
        // If severity is mentioned with a colon or dash
        const severityColonMatch = cleanLine.match(/(.*?)\s*[:-]\s*(Mild|Moderate|Serious|Emergency)/i);
        if (severityColonMatch) {
          return {
            name: severityColonMatch[1].trim(),
            severity: severityColonMatch[2]
          };
        }
        
        // Default case - no clear severity marking
        return {
          name: cleanLine,
          severity: 'Not specified'
        };
      });
    }

    // Assign other extracted content if matches found
    if (assessmentMatch && assessmentMatch[1]) result.assessment = assessmentMatch[1].trim();
    if (diagnosticsMatch && diagnosticsMatch[1]) result.diagnostics = diagnosticsMatch[1].trim();
    if (homeCareMatch && homeCareMatch[1]) result.homeCare = homeCareMatch[1].trim();
    if (vetCareMatch && vetCareMatch[1]) result.vetCareIndicators = vetCareMatch[1].trim();

    return result;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.petType) {
      setError('Please select a pet type');
      return;
    }
    
    if (formData.petType === 'other' && !formData.customPetType) {
      setError('Please specify your pet type');
      return;
    }
    
    if (!formData.symptoms) {
      setError('Please describe your pet\'s symptoms');
      return;
    }
    
    setError(null);
    setIsLoading(true);
    
    try {
      // Initialize the AI with the API key from environment variables
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('API key not found');
      }
      
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      
      // Create the prompt and generate content
      const vetPrompt = constructVetPrompt(formData);
      
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: vetPrompt }] }],
        generationConfig: {
          temperature: 0.4,
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 1024,
        }
      });
      
      const response = await result.response;
      const text = response.text();
      
      if (text) {
        // Format the response
        const formattedResponse = text
          .replace(/\*\*(.*?)\*\*/g, '$1')  // Remove markdown bold
          .replace(/\*(.*?)\*/g, '$1')      // Remove markdown italic
          .replace(/\n\n+/g, '\n')         // Reduce excessive line breaks
          .replace(/\s+\n/g, '\n')         // Remove spaces before line breaks
          .replace(/\n\s+/g, '\n')         // Remove spaces after line breaks
          .trim();
        
        // Parse the response into structured data
        const parsedResult = parseResponse(formattedResponse);
        setResult(parsedResult);
        setShowResult(true);
      } else {
        throw new Error('Received empty response from AI');
      }
    } catch (err) {
      console.error('Error analyzing pet symptoms:', err);
      setError('Failed to analyze symptoms. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form and go back to input
  const handleBack = () => {
    setShowResult(false);
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="flex items-center justify-center mb-6">
        <div className="bg-blue-100 p-2 rounded-full mr-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-blue-700">VetAI Symptom Analyzer</h1>
      </div>
      
      {!showResult ? (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md border border-blue-100">
          <div className="mb-6">
            <div className="flex items-center mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
              </svg>
              <label className="text-blue-700 font-medium">Pet Type</label>
            </div>
            <select 
              name="petType" 
              value={formData.petType} 
              onChange={handleInputChange}
              className="w-full p-3 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50"
            >
              <option value="">Select pet type</option>
              <option value="dog">Dog</option>
              <option value="cat">Cat</option>
              <option value="bird">Bird</option>
              <option value="rabbit">Rabbit</option>
              <option value="hamster">Hamster</option>
              <option value="fish">Fish</option>
              <option value="reptile">Reptile</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          {formData.petType === 'other' && (
            <div className="mb-6">
              <div className="flex items-center mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                <label className="text-blue-700 font-medium">Specify Pet Type</label>
              </div>
              <input 
                type="text" 
                name="customPetType" 
                value={formData.customPetType} 
                onChange={handleInputChange}
                placeholder="Enter your pet type"
                className="w-full p-3 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50"
              />
            </div>
          )}
          
          <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-100">
            <div className="flex items-center mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-blue-700 font-medium">Pet Details</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-neutral-700 font-medium mb-2 text-sm">Age</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input 
                    type="text" 
                    name="petAge" 
                    value={formData.petAge} 
                    onChange={handleInputChange}
                    placeholder="e.g., 3 years"
                    className="w-full pl-10 p-3 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-neutral-700 font-medium mb-2 text-sm">Weight</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                    </svg>
                  </div>
                  <input 
                    type="text" 
                    name="petWeight" 
                    value={formData.petWeight} 
                    onChange={handleInputChange}
                    placeholder="e.g., 15 lbs"
                    className="w-full pl-10 p-3 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-neutral-700 font-medium mb-2 text-sm">Breed</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <input 
                    type="text" 
                    name="petBreed" 
                    value={formData.petBreed} 
                    onChange={handleInputChange}
                    placeholder="e.g., Golden Retriever"
                    className="w-full pl-10 p-3 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <div className="flex items-center mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <label className="text-blue-700 font-medium">Describe Your Pet's Symptoms</label>
            </div>
            <div className="bg-yellow-50 p-3 mb-3 rounded-md border border-yellow-200 flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-yellow-700">The more details you provide, the more accurate our analysis will be. Include when symptoms started, changes in behavior, appetite, and any other relevant information.</p>
            </div>
            <textarea 
              name="symptoms" 
              value={formData.symptoms} 
              onChange={handleInputChange}
              placeholder="Please describe in detail what symptoms your pet is showing. Include when they started, any changes in behavior, eating habits, etc."
              rows={6}
              className="w-full p-3 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50"
            ></textarea>
          </div>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}
          
          <div className="flex justify-end">
            {isLoading && (
              <div className="mr-4 flex items-center text-blue-600">
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Analyzing pet symptoms...</span>
              </div>
            )}
            <button 
              type="submit" 
              className="bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 transition duration-200 disabled:bg-blue-300 flex items-center font-medium"
              disabled={isLoading}
            >
              {!isLoading && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              )}
              {isLoading ? 'Analyzing...' : 'Analyze Symptoms'}
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-6 text-blue-700 border-b pb-2">Veterinary Assessment</h2>
          
          {result && (
            <div className="space-y-6">
              {/* Possible Conditions Section */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-bold text-blue-800 mb-3 text-lg">Possible Conditions</h3>
                <div className="space-y-2">
                  {result.conditions.map((condition, index) => (
                    <div key={index} className="flex items-center justify-between border-b border-blue-100 pb-2">
                      <span className="text-neutral-700 font-medium">{condition.name}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        condition.severity === 'Mild' ? 'bg-green-100 text-green-800' :
                        condition.severity === 'Moderate' ? 'bg-yellow-100 text-yellow-800' :
                        condition.severity === 'Serious' ? 'bg-orange-100 text-orange-800' :
                        condition.severity === 'Emergency' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {condition.severity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Clinical Assessment Section */}
              <div>
                <h3 className="font-bold text-blue-800 mb-2">Clinical Assessment</h3>
                <p className="text-neutral-700 bg-neutral-50 p-3 rounded-md">{result.assessment}</p>
              </div>
              
              {/* Recommended Diagnostics Section */}
              <div>
                <h3 className="font-bold text-blue-800 mb-2">Recommended Diagnostics</h3>
                <div className="bg-neutral-50 p-3 rounded-md">
                  {result.diagnostics.split('\n').map((item, index) => (
                    item.trim() ? (
                      <div key={index} className="flex items-start mb-1">
                        <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs mr-2 mt-0.5">
                          {index + 1}
                        </div>
                        <p className="text-neutral-700">{item.replace(/^\d+\.\s*|^-\s*|^•\s*/g, '').trim()}</p>
                      </div>
                    ) : null
                  ))}
                </div>
              </div>
              
              {/* Home Care Recommendations Section */}
              <div>
                <h3 className="font-bold text-blue-800 mb-2">Home Care Recommendations</h3>
                <div className="bg-neutral-50 p-3 rounded-md">
                  {result.homeCare.split('\n').map((item, index) => (
                    item.trim() ? (
                      <div key={index} className="flex items-start mb-1">
                        <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-xs mr-2 mt-0.5">
                          {index + 1}
                        </div>
                        <p className="text-neutral-700">{item.replace(/^\d+\.\s*|^-\s*|^•\s*/g, '').trim()}</p>
                      </div>
                    ) : null
                  ))}
                </div>
              </div>
              
              {/* Veterinary Care Indicators Section */}
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="font-bold text-red-800 mb-2">When to Seek Veterinary Care</h3>
                <div className="text-neutral-700">
                  {result.vetCareIndicators.split('\n').map((item, index) => (
                    item.trim() ? (
                      <div key={index} className="flex items-start mb-1">
                        <div className="text-red-500 mr-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <p>{item.replace(/^\d+\.\s*|^-\s*|^•\s*/g, '').trim()}</p>
                      </div>
                    ) : null
                  ))}
                </div>
              </div>
              
              {/* Nearby Veterinary Clinics Map */}
              <NearbyVetsMap />
              
              <div className="mt-8 pt-4 border-t border-neutral-200 bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start mb-4">
                  <div className="text-blue-500 mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-sm text-neutral-700">
                    <span className="font-bold">Disclaimer:</span> This assessment is based on the information provided and is not a substitute for professional veterinary care. 
                    If your pet is experiencing serious symptoms, please consult with a veterinarian immediately.
                  </p>
                </div>
                
                <div className="flex justify-between">
                  <button 
                    onClick={handleBack}
                    className="bg-white text-blue-700 border border-blue-300 py-2 px-4 rounded-md hover:bg-blue-50 transition duration-200 flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                    Back to Form
                  </button>
                  
                  <button 
                    onClick={() => window.print()}
                    className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200 flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
                    </svg>
                    Print Assessment
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FillupForm;