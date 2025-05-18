import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

// Define types for messages and responses
type MessageRole = 'user' | 'ai';

interface Message {
  id: string;
  content: string;
  role: MessageRole;
  timestamp: Date;
  isQuestion?: boolean;
}

// Initialize Gemini AI with API key from environment variables
const initializeAI = (): GenerativeModel | null => {
  try {
    // For Vite projects, we need to use import.meta.env
    // The API key is set in the .env file as GEMINI_API_KEY
    // Vite automatically prefixes environment variables with VITE_
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error('Gemini API key not found in environment variables');
      return null;
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    return genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  } catch (error) {
    console.error('Error initializing Gemini AI:', error);
    return null;
  }
};

const ChatApp: React.FC = () => {
  // State management
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [model, setModel] = useState<GenerativeModel | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize AI model on component mount
  useEffect(() => {
    const aiModel = initializeAI();
    setModel(aiModel);
  }, []);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Generate a unique ID for messages
  const generateId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };

  // Add a new message to the chat
  const addMessage = (content: string, role: MessageRole): void => {
    const newMessage: Message = {
      id: generateId(),
      content,
      role,
      timestamp: new Date(),
    };
    setMessages((prevMessages) => [...prevMessages, newMessage]);
  };

  // Construct a veterinary-specific prompt
  const constructVetPrompt = (userMessage: string): string => {
    return `You are a professional veterinarian with extensive experience in diagnosing and treating pet health issues. 
    A pet owner has described the following symptoms or concerns about their pet:

    "${userMessage}"

    Please provide a concise and professional veterinary analysis with the following structure:

    1. POSSIBLE CONDITIONS: List 2-3 most likely conditions based on the symptoms described.
    
    2. ANALYSIS: Brief explanation of why these conditions match the symptoms (2-3 sentences).
    
    3. RECOMMENDED DIAGNOSTICS: List 2-3 key diagnostic tests.
    
    4. CARE RECOMMENDATIONS: Brief practical advice for immediate care (2-3 points).
    
    5. WHEN TO SEEK IMMEDIATE CARE: Mention any emergency indicators.

    Keep your response brief and to the point. Do not use asterisks (*) or other markdown formatting. Use plain text only. Your response should be formal and professional but concise. Limit the entire response to approximately 250 words.`;
  };

  // Get AI response
  const getAIResponse = async (userMessage: string): Promise<void> => {
    if (!model) {
      setError('AI model not initialized. Please check your API key.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create a veterinary-specific prompt
      const vetPrompt = constructVetPrompt(userMessage);
      
      // Generate the response with the vet prompt
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: vetPrompt }] }],
        generationConfig: {
          temperature: 0.4,  // Lower temperature for more predictable, professional responses
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 1024,  // Allow for longer, more detailed responses
        }
      });
      const response = await result.response;
      const text = response.text();
      
      if (text) {
        // Format the response for better readability
        const formattedResponse = text
          .replace(/\*\*(.*?)\*\*/g, '$1')  // Remove markdown bold
          .replace(/\*(.*?)\*/g, '$1')      // Remove markdown italic
          .replace(/\n\n+/g, '\n')         // Reduce excessive line breaks
          .replace(/\s+\n/g, '\n')         // Remove spaces before line breaks
          .replace(/\n\s+/g, '\n')         // Remove spaces after line breaks
          .trim();
          
        addMessage(formattedResponse, 'ai');
      } else {
        setError('Received empty response from AI');
      }
    } catch (err) {
      console.error('Error getting AI response:', err);
      setError('Failed to get response from AI. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    if (!inputText.trim()) return;
    
    // Add user message to chat
    addMessage(inputText, 'user');
    
    // Clear input field
    const userMessage = inputText;
    setInputText('');
    
    // Get AI response
    await getAIResponse(userMessage);
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Chat header */}
      <div className="bg-white p-4 border-b border-neutral-200 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="flex flex-col items-center justify-center h-8 w-8 rounded-full bg-neutral-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
          <button className="ml-2 bg-neutral-900 text-white px-3 py-1 rounded-full text-xs font-medium">Get Pro</button>
        </div>
      </div>

      {/* Chat content area */}
      <div className="flex-1 flex flex-col p-4 pb-24 overflow-y-auto bg-white">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <h1 className="text-2xl font-bold mb-4 text-neutral-800">What can I help with?</h1>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto w-full px-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex w-full mb-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[80%] rounded-2xl p-3 ${message.role === 'user' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-neutral-200 text-neutral-800'}`}
                >
                  <p className="whitespace-pre-line">{message.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex w-full mb-4 justify-start">
                <div className="max-w-[80%] rounded-2xl p-3 bg-neutral-200 text-neutral-800">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce"></div>
                    <div className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
        
        {/* Error message */}
        {error && (
          <div className="p-3 mb-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        
        {/* Message input box */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200">
          <div className="max-w-3xl mx-auto px-4">
            <form onSubmit={handleSubmit} className="py-3">
              <div className="flex items-center bg-neutral-100 rounded-full px-4 py-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Ask anything"
                  className="w-full bg-transparent outline-none text-neutral-700 placeholder-neutral-500"
                  disabled={isLoading}
                />
                <div className="flex items-center ml-2">
                  <button type="button" className="p-1 text-neutral-500 flex items-center text-xs">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <span className="mx-1 text-neutral-300">|</span>
                  <button type="button" className="p-1 text-neutral-500 flex items-center text-xs">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                  <span className="mx-1 text-neutral-300">|</span>
                  <button type="button" className="p-1 text-neutral-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
                    </svg>
                  </button>
                </div>
                <button 
                  type="submit" 
                  className="ml-2 bg-neutral-900 text-white p-2 rounded-full disabled:bg-neutral-400"
                  disabled={isLoading || !inputText.trim()}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </form>
            <div className="text-center text-xs text-neutral-500 pb-2">
              <p>AI can make mistakes. Please double-check responses.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer info - hidden when there are messages */}
      {messages.length === 0 && (
        <div className="p-4 text-center text-xs text-neutral-500 mb-16">
          <p>You've hit the Free plan limit for Crawl-4o. Subscribe to Pro plan to increase limits.</p>
          <p>Responses will use another model until your limit resets after 9:35 PM.</p>
          <p className="mt-2">AI can make mistakes. Please double-check responses.</p>
        </div>
      )}
    </div>
  );
};

export default ChatApp;