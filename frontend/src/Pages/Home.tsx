import React, { useState } from 'react';
import InputArea from '../components/InputArea';
import { API_URL } from '../config';

interface Condition {
  condition: string;
  probability: string;
  description: string;
}

interface AnalysisResult {
  aiAnalysis: string;
  possibleConditions: Condition[];
  recommendations: string;
  diagnosticTests: string;
  longTermManagement: string;
}

const Home: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyzeSubmit = async (petType: string, petProblem: string) => {
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);
    
    try {
      // Log request details for debugging
      console.log(`Making API request to: ${API_URL}/api/analyze`);
      
      // Make API call to the backend with a timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(`${API_URL}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ petType, petProblem }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        // Enhanced error handling with more specific messages
        let errorMessage = 'Failed to analyze pet symptoms';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          errorMessage = `Server error (${response.status}): ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
      
      const responseData = await response.json();
      
      if (!responseData.success) {
        throw new Error(responseData.message || 'Analysis failed');
      }
      
      setAnalysisResult(responseData.data);
      
    } catch (err: unknown) {
      console.error('Error analyzing pet symptoms:', err);
      // More specific error handling for network issues
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          setError('Request timed out. Please check your connection and try again.');
        } else if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
          setError('Network error. Please check your connection and try again.');
        } else {
          setError(err.message);
        }
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold text-blue-800">VetAI Analyzer</h1>
        <p className="text-gray-600 mt-2">AI-powered veterinary symptom analysis</p>
      </header>
      
      <div className="grid grid-cols-1 gap-8">
        <InputArea onSubmit={handleAnalyzeSubmit} isLoading={isLoading} />
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
            <p className="font-medium">Error</p>
            <p>{error}</p>
          </div>
        )}
        
        {isLoading && (
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-12 w-12 rounded-full bg-blue-200 mb-4"></div>
              <div className="h-4 w-3/4 bg-blue-200 rounded mb-2"></div>
              <div className="h-4 w-1/2 bg-blue-200 rounded"></div>
            </div>
            <p className="mt-4 text-gray-600">Analyzing your pet's symptoms...</p>
            <p className="text-sm text-gray-500 mt-2">This may take a moment as our AI examines the details</p>
          </div>
        )}
        
        {analysisResult && !isLoading && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Analysis Results</h2>
            
            <div className="mb-6">
              <h3 className="text-xl font-medium mb-3">Possible Conditions</h3>
              <div className="space-y-4">
                {analysisResult.possibleConditions.map((condition, index) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium text-lg">{condition.condition}</h4>
                      <span className={`px-2 py-1 rounded text-sm ${
                        condition.probability.toLowerCase() === 'high' ? 'bg-red-100 text-red-800' : 
                        condition.probability.toLowerCase() === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-green-100 text-green-800'
                      }`}>
                        {condition.probability} Probability
                      </span>
                    </div>
                    <div 
                      className="prose max-w-none text-gray-600 mt-1"
                      dangerouslySetInnerHTML={{ 
                        __html: condition.description
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\*(.*?)\*/g, '<em>$1</em>')
                          .replace(/•\s(.*?)(?=(\n|$))/g, '<li>$1</li>')
                          .replace(/(\d+)\.\s(.*?)(?=(\n|$))/g, '<li><span class="font-medium">$1.</span> $2</li>')
                          .replace(/<li>/g, '<li>')
                          .replace(/\n\n/g, '</p><p class="mb-2">')
                          .replace(/\n(?!<\/p>)/g, '<br />')
                          .split('</li>').join('</li>\n')
                          .split('<li').filter(item => item.includes('>')).map(item => {
                            if (!item.startsWith(' class')) return '<li' + item;
                            return item;
                          }).join('')
                          .replace(/(<li.*?>.*?<\/li>\n)+/g, match => `<ul class="list-disc pl-5">${match}</ul>`)
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-xl font-medium mb-3">Recommendations</h3>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div 
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ 
                    __html: analysisResult.recommendations
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\*(.*?)\*/g, '<em>$1</em>')
                      .replace(/•\s(.*?)(?=(\n|$))/g, '<li>$1</li>')
                      .replace(/(\d+)\.\s(.*?)(?=(\n|$))/g, '<li><span class="font-medium">$1.</span> $2</li>')
                      .replace(/<li>/g, '<li>')
                      .replace(/\n\n/g, '</p><p class="mb-">')
                      .replace(/\n(?!<\/p>)/g, '<br />')
                      .split('</li>').join('</li>\n')
                      .split('<li').filter(item => item.includes('>')).map(item => {
                        if (!item.startsWith(' class')) return '<li' + item;
                        return item;
                      }).join('')
                      .replace(/(<li.*?>.*?<\/li>\n)+/g, match => `<ul class="list-disc pl-5">${match}</ul>`)
                  }}
                />
              </div>
            </div>
            
            {analysisResult.diagnosticTests && (
              <div className="mt-6">
                <h3 className="text-xl font-medium mb-3">Recommended Diagnostic Tests</h3>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div 
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ 
                      __html: analysisResult.diagnosticTests
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\*(.*?)\*/g, '<em>$1</em>')
                        .replace(/•\s(.*?)(?=(\n|$))/g, '<li>$1</li>')
                        .replace(/(\d+)\.\s(.*?)(?=(\n|$))/g, '<li><span class="font-medium">$1.</span> $2</li>')
                        .replace(/<li>/g, '<li>')
                        .replace(/\n\n/g, '</p><p class="mb-">')
                        .replace(/\n(?!<\/p>)/g, '<br />')
                        .split('</li>').join('</li>\n')
                        .split('<li').filter(item => item.includes('>')).map(item => {
                          if (!item.startsWith(' class')) return '<li' + item;
                          return item;
                        }).join('')
                        .replace(/(<li.*?>.*?<\/li>\n)+/g, match => `<ul class="list-disc pl-5">${match}</ul>`)
                    }}
                  />
                </div>
              </div>
            )}
            
            {analysisResult.longTermManagement && (
              <div className="mt-6">
                <h3 className="text-xl font-medium mb-3">Long-Term Management</h3>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div 
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ 
                      __html: analysisResult.longTermManagement
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\*(.*?)\*/g, '<em>$1</em>')
                        .replace(/•\s(.*?)(?=(\n|$))/g, '<li>$1</li>')
                        .replace(/(\d+)\.\s(.*?)(?=(\n|$))/g, '<li><span class="font-medium">$1.</span> $2</li>')
                        .replace(/<li>/g, '<li>')
                        .replace(/\n\n/g, '</p><p class="mb-">')
                        .replace(/\n(?!<\/p>)/g, '<br />')
                        .split('</li>').join('</li>\n')
                        .split('<li').filter(item => item.includes('>')).map(item => {
                          if (!item.startsWith(' class')) return '<li' + item;
                          return item;
                        }).join('')
                        .replace(/(<li.*?>.*?<\/li>\n)+/g, match => `<ul class="list-disc pl-5">${match}</ul>`)
                    }}
                  />
                </div>
              </div>
            )}
            
            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500 italic">
                Note: This analysis is provided by an AI and should not replace professional veterinary advice. 
                Always consult with a veterinarian for proper diagnosis and treatment.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
