import { useState, useEffect } from 'react'
import { diagnosisService } from './services/api'
import { useAuth } from './context/AuthContext'

interface Condition {
  condition: string;
  probability: string;
  description: string;
}

interface DiagnosisResult {
  _id: string;
  aiAnalysis: string;
  possibleConditions: Condition[];
  recommendations: string;
  createdAt: string;
}

function App() {
  const { isAuthenticated, user, logout } = useAuth()
  const [animalType, setAnimalType] = useState('')
  const [symptoms, setSymptoms] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<DiagnosisResult | null>(null)
  const [feedback, setFeedback] = useState({
    rating: 0,
    comment: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!animalType || !symptoms) {
      setError('Please fill in all fields')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      if (!isAuthenticated) {
        // If not authenticated, use the sample data
        setTimeout(() => {
          setResult({
            _id: 'sample-id',
            aiAnalysis: 'This is a sample analysis. Please log in to get real results from our AI.',
            possibleConditions: [
              { condition: 'Sample Condition 1', probability: 'High', description: 'Description of condition 1' },
              { condition: 'Sample Condition 2', probability: 'Medium', description: 'Description of condition 2' },
              { condition: 'Sample Condition 3', probability: 'Low', description: 'Description of condition 3' }
            ],
            recommendations: 'These are sample recommendations. Please log in to get personalized recommendations.',
            createdAt: new Date().toISOString()
          })
          setLoading(false)
        }, 1500)
        return
      }
      
      // Make actual API call if authenticated
      const response = await diagnosisService.createDiagnosis({
        animalType,
        symptoms
      })
      
      if (response.success && response.data) {
        setResult(response.data)
      } else {
        setError('Failed to analyze symptoms. Please try again.')
      }
    } catch (err) {
      console.error('Error submitting diagnosis:', err)
      setError('An error occurred while analyzing symptoms. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleFeedbackSubmit = async () => {
    if (!result || !isAuthenticated) return
    
    try {
      setLoading(true)
      const response = await diagnosisService.addFeedback(result._id, {
        rating: feedback.rating,
        comment: feedback.comment
      })
      
      if (response.success) {
        alert('Thank you for your feedback!')
        setFeedback({ rating: 0, comment: '' })
      }
    } catch (err) {
      console.error('Error submitting feedback:', err)
      setError('Failed to submit feedback. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleRatingClick = (rating: number) => {
    setFeedback(prev => ({ ...prev, rating }))
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">VetAI Analyzer</h1>
            <p className="text-blue-100">AI-powered veterinary symptom analysis</p>
          </div>
          <div className="flex items-center">
            {isAuthenticated && user ? (
              <div className="flex items-center">
                <span className="mr-4">Welcome, {user.name}</span>
                <button 
                  onClick={handleLogout}
                  className="bg-blue-700 hover:bg-blue-800 text-white py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button 
                onClick={() => window.location.reload()}
                className="bg-blue-700 hover:bg-blue-800 text-white py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </header>
      
      <main className="container mx-auto p-4 md:p-6">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p>{error}</p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Input Form */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Analyze Pet Symptoms</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="animalType" className="block text-gray-700 font-medium mb-2">
                  Animal Type
                </label>
                <select
                  id="animalType"
                  value={animalType}
                  onChange={(e) => setAnimalType(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select animal type</option>
                  <option value="Dog">Dog</option>
                  <option value="Cat">Cat</option>
                  <option value="Bird">Bird</option>
                  <option value="Rabbit">Rabbit</option>
                  <option value="Hamster">Hamster</option>
                  <option value="Guinea Pig">Guinea Pig</option>
                  <option value="Horse">Horse</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label htmlFor="symptoms" className="block text-gray-700 font-medium mb-2">
                  Symptoms
                </label>
                <textarea
                  id="symptoms"
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[150px]"
                  placeholder="Describe the symptoms in detail..."
                  required
                ></textarea>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300"
              >
                {loading ? 'Analyzing...' : 'Analyze Symptoms'}
              </button>
              
              {!isAuthenticated && (
                <p className="mt-2 text-sm text-gray-500">
                  Note: You are not logged in. Log in to save your diagnosis history and get more accurate results.
                </p>
              )}
            </form>
          </div>
          
          {/* Results Display */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Analysis Results</h2>
            
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : result ? (
              <div>
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-2">AI Analysis</h3>
                  <p className="text-gray-600">{result.aiAnalysis}</p>
                </div>
                
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Possible Conditions</h3>
                  <div className="space-y-3">
                    {result.possibleConditions.map((condition, index) => (
                      <div key={index} className="border-l-4 border-blue-500 pl-3 py-2">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium">{condition.condition}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            condition.probability === 'High' ? 'bg-red-100 text-red-800' :
                            condition.probability === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {condition.probability}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{condition.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Recommendations</h3>
                  <p className="text-gray-600">{result.recommendations}</p>
                </div>
                
                {isAuthenticated && (
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <h3 className="text-lg font-medium text-gray-800 mb-2">Feedback</h3>
                    <div className="flex space-x-2 mb-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button 
                          key={star}
                          onClick={() => handleRatingClick(star)}
                          className={`text-2xl ${feedback.rating >= star ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                    <textarea
                      placeholder="Share your feedback about this analysis..."
                      value={feedback.comment}
                      onChange={(e) => setFeedback(prev => ({ ...prev, comment: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    ></textarea>
                    <button 
                      onClick={handleFeedbackSubmit}
                      disabled={feedback.rating === 0 || loading}
                      className="mt-2 bg-blue-600 text-white py-1 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300"
                    >
                      Submit Feedback
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col justify-center items-center h-64 text-gray-500">
                <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <p>Enter your pet's symptoms to get an AI-powered analysis</p>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <footer className="bg-gray-800 text-white p-4 mt-8">
        <div className="container mx-auto text-center">
          <p> {new Date().getFullYear()} VetAI Analyzer. All rights reserved.</p>
          <p className="text-gray-400 text-sm mt-1">
            This tool is for informational purposes only and should not replace professional veterinary care.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
