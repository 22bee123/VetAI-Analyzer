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
    
    // Log the API URL for debugging
    console.log('API URL being used:', API_URL);
    
    // Retry logic
    let retries = 0;
    const maxRetries = 2;
    
    const attemptApiCall = async (): Promise<any> => {
      try {
        // Log request details for debugging
        console.log(`Making API request to: ${API_URL}/api/analyze (Attempt ${retries + 1}/${maxRetries + 1})`);
        
        // Make API call to the backend with a timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        const response = await fetch(`${API_URL}/api/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ petType, petProblem }),
          signal: controller.signal,
          // Disable cache to prevent stale responses
          cache: 'no-store'
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
        
        return responseData.data;
      } catch (err) {
        if (retries < maxRetries) {
          retries++;
          console.log(`Retrying API call (${retries}/${maxRetries})...`);
          // Exponential backoff: 1s, 2s, etc.
          await new Promise(resolve => setTimeout(resolve, retries * 1000));
          return attemptApiCall();
        }
        throw err;
      }
    };
    
    try {
      const data = await attemptApiCall();
      setAnalysisResult(data);
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

  const getProbabilityColor = (probability: string) => {
    const prob = probability.toLowerCase();
    if (prob === 'high') return 'bg-red-100 text-red-800 border-red-200';
    if (prob === 'medium') return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  const formatMarkdown = (content: string) => {
    return {
      __html: content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/•\s(.*?)(?=(\n|$))/g, '<li>$1</li>')
        .replace(/(\d+)\.\s(.*?)(?=(\n|$))/g, '<li><span class="font-medium">$1.</span> $2</li>')
        .replace(/\n\n/g, '</p><p class="mb-2">')
        .replace(/\n(?!<\/p>)/g, '<br />')
        .split('</li>').join('</li>\n')
        .split('<li').filter(item => item.includes('>')).map(item => {
          if (!item.startsWith(' class')) return '<li' + item;
          return item;
        }).join('')
        .replace(/(<li.*?>.*?<\/li>\n)+/g, match => `<ul class="list-disc pl-5 my-2">${match}</ul>`)
    };
  };

  // New function to format recommendations more attractively
  const formatRecommendations = (content: string) => {
    // Split the content by bullet points or numbered items
    const lines = content.split(/\n/).filter(line => line.trim() !== '');
    
    // Check if it's a list of recommendations
    const hasListItems = lines.some(line => line.trim().startsWith('•') || /^\d+\./.test(line.trim()));
    
    if (hasListItems) {
      // Format as a list of recommendations
      return {
        __html: content
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>')
          .replace(/•\s(.*?)(?=(\n|$))/g, '<div class="flex items-start my-3"><div class="rounded-full bg-blue-500 w-2 h-2 mt-2 mr-3 flex-shrink-0"></div><div>$1</div></div>')
          .replace(/(\d+)\.\s(.*?)(?=(\n|$))/g, '<div class="flex items-start my-3"><div class="flex-shrink-0 bg-blue-100 text-blue-800 font-semibold rounded-full w-6 h-6 flex items-center justify-center mr-3">$1</div><div>$2</div></div>')
          .replace(/\n\n/g, '</p><p class="mb-2">')
          .replace(/\n(?!<\/p>)/g, '<br />')
      };
    } else {
      // Format as paragraphs with highlighted key points
      return {
        __html: content
          .replace(/\*\*(.*?)\*\*/g, '<span class="font-semibold text-blue-800">$1</span>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>')
          .replace(/\n\n/g, '</p><p class="mb-4">')
          .replace(/\n(?!<\/p>)/g, '<br />')
      };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-800">VetAI Analyzer</h1>
          <p className="text-gray-600 mt-2 text-lg">AI-powered veterinary symptom analysis</p>
        </header>
        
        <div className="grid grid-cols-1 gap-6">
          <InputArea onSubmit={handleAnalyzeSubmit} isLoading={isLoading} />
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg shadow-sm">
              <p className="font-medium">Error</p>
              <p>{error}</p>
            </div>
          )}
          
          {isLoading && (
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="flex justify-center mb-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
              </div>
              <p className="text-gray-700 font-medium">Analyzing your pet's symptoms...</p>
              <p className="text-sm text-gray-500 mt-2">This may take a moment</p>
            </div>
          )}
          
          {analysisResult && !isLoading && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-blue-600 text-white px-6 py-4">
                <h2 className="text-2xl font-semibold">Analysis Results</h2>
              </div>
              
              <div className="p-6 space-y-8">
                {/* Possible Conditions Section */}
                <section>
                  <h3 className="text-xl font-medium mb-4 text-blue-800 border-b pb-2">Possible Conditions</h3>
                  <div className="space-y-4">
                    {analysisResult.possibleConditions.map((condition, index) => (
                      <div key={index} className="border rounded-lg overflow-hidden shadow-sm">
                        <div className="flex items-center justify-between p-4 bg-gray-50">
                          <h4 className="font-semibold text-lg">{condition.condition}</h4>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getProbabilityColor(condition.probability)}`}>
                            {condition.probability}
                          </span>
                        </div>
                        <div className="p-4">
                          <div className="prose max-w-none text-gray-700" dangerouslySetInnerHTML={formatMarkdown(condition.description)} />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
                
                {/* Recommendations Section */}
                <section>
                  <h3 className="text-xl font-medium mb-4 text-blue-800 border-b pb-2">Recommendations</h3>
                  <div className="bg-blue-50 p-5 rounded-lg border border-blue-100 shadow-sm">
                    <div className="prose max-w-none text-gray-700" dangerouslySetInnerHTML={formatRecommendations(analysisResult.recommendations)} />
                  </div>
                </section>
                
                {/* Diagnostic Tests Section */}
                {analysisResult.diagnosticTests && (
                  <section>
                    <h3 className="text-xl font-medium mb-4 text-blue-800 border-b pb-2">Recommended Diagnostic Tests</h3>
                    <div className="bg-purple-50 p-5 rounded-lg border border-purple-100 shadow-sm">
                      <div className="prose max-w-none text-gray-700" dangerouslySetInnerHTML={formatRecommendations(analysisResult.diagnosticTests)} />
                    </div>
                  </section>
                )}
                
                {/* Long-Term Management Section */}
                {analysisResult.longTermManagement && (
                  <section>
                    <h3 className="text-xl font-medium mb-4 text-blue-800 border-b pb-2">Long-Term Management</h3>
                    <div className="bg-green-50 p-5 rounded-lg border border-green-100 shadow-sm">
                      <div className="prose max-w-none text-gray-700" dangerouslySetInnerHTML={formatRecommendations(analysisResult.longTermManagement)} />
                    </div>
                  </section>
                )}
                
                {/* Disclaimer */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-gray-500 bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm">
                      This analysis is provided by AI and should not replace professional veterinary advice. 
                      Always consult with a veterinarian for proper diagnosis and treatment.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
