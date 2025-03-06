// API service for making requests to the backend

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Generic fetch function with error handling
async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  // Get token from localStorage if it exists
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Check if the response is ok (status in the range 200-299)
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: 'An error occurred while processing your request',
      }));
      
      throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }

    // Check if the response is empty
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return await response.text();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

// Auth service
export const authService = {
  register: async (userData: any) => {
    return fetchWithAuth('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },
  
  login: async (credentials: { email: string; password: string }) => {
    return fetchWithAuth('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },
  
  getProfile: async () => {
    return fetchWithAuth('/auth/me');
  },
  
  logout: async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return { success: true };
  },
};

// Diagnosis service
export const diagnosisService = {
  createDiagnosis: async (diagnosisData: { animalType: string; symptoms: string }) => {
    return fetchWithAuth('/diagnosis', {
      method: 'POST',
      body: JSON.stringify(diagnosisData),
    });
  },
  
  getDiagnoses: async () => {
    return fetchWithAuth('/diagnosis');
  },
  
  getDiagnosis: async (id: string) => {
    return fetchWithAuth(`/diagnosis/${id}`);
  },
  
  addFeedback: async (id: string, feedbackData: { rating: number; comment?: string }) => {
    return fetchWithAuth(`/diagnosis/${id}/feedback`, {
      method: 'PUT',
      body: JSON.stringify(feedbackData),
    });
  },
};

export default {
  auth: authService,
  diagnosis: diagnosisService,
};
