import React, { useState } from 'react';
import { API_URL } from '../config';

interface SimpleAnalysisProps {
  petType: string;
  petProblem: string;
  onBack: () => void;
}

const SimpleAnalysis: React.FC<SimpleAnalysisProps> = ({ petType, petProblem, onBack }) => {
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch results from the simplified API endpoint
  React.useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        console.log('Making API request to simplified endpoint:', `${API_URL}/api/simple-analyze`);
        
        const response = await fetch(`${API_URL}/api/simple-analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ petType, petProblem }),
        });

        if (!response.ok) {
          throw new Error(`Server error (${response.status}): ${response.statusText}`);
        }

        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.message || 'Analysis failed');
        }

        setResult(data.data.aiAnalysis);
        setError(null);
      } catch (err) {
        console.error('Error in simple analysis:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [petType, petProblem]);

  if (loading) {
    return (
      <div className="p-4 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Analyzing with Simplified API...</h2>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4 text-red-600">Error</h2>
        <p className="mb-4">{error}</p>
        <div className="flex justify-between">
          <button 
            onClick={onBack}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Simplified Analysis Results</h2>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">AI Analysis</h3>
        <div className="bg-gray-50 p-4 rounded whitespace-pre-wrap">
          {result}
        </div>
      </div>
      
      <div className="flex justify-between">
        <button 
          onClick={onBack}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
        >
          Back
        </button>
      </div>
    </div>
  );
};

export default SimpleAnalysis;
