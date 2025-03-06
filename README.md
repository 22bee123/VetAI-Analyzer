# VetAI Analyzer

VetAI Analyzer is a web application that uses AI to analyze veterinary symptoms and provide possible diagnoses for pets. Built with the MERN stack (MongoDB, Express.js, React, Node.js) and TypeScript, it leverages the Google Gemini API for AI-driven analysis.

## Features

- **AI-Powered Symptom Analysis**: Input animal type and symptoms to get AI-generated analysis
- **User Authentication**: Register and login functionality with JWT authentication
- **Role-Based Access Control**: Different access levels for admin, veterinarian, and regular users
- **Feedback System**: Users can provide ratings and comments on analysis results
- **Responsive Design**: Mobile-friendly interface built with React and Tailwind CSS

## Tech Stack

### Backend
- **Node.js** with **Express.js** framework
- **MongoDB** for database storage
- **Google Gemini API** for AI analysis
- **JWT** for authentication
- **ES Modules** for modern JavaScript syntax

### Frontend
- **React** with **TypeScript**
- **Tailwind CSS** for styling
- **Vite** as the build tool

## Project Structure

```
VetAI-Analyzer/
├── backend/
│   ├── controllers/       # Request handlers
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   ├── middleware/        # Custom middleware
│   └── server.js          # Entry point
├── frontend/
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── context/       # React context providers
│   │   ├── pages/         # Page components
│   │   ├── services/      # API service functions
│   │   ├── App.tsx        # Main application component
│   │   └── main.tsx       # Entry point
│   ├── index.html         # HTML template
│   └── vite.config.ts     # Vite configuration
└── README.md              # Project documentation
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB database
- Google Gemini API key

### Environment Variables

#### Backend (.env)
```
PORT=5000
MONGODB_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET=your_jwt_secret
NODE_ENV=development
```

#### Frontend (.env)
```
VITE_API_URL=http://localhost:5000/api
```

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/VetAI-Analyzer.git
   cd VetAI-Analyzer
   ```

2. Install backend dependencies
   ```
   npm install
   ```

3. Install frontend dependencies
   ```
   cd frontend
   npm install
   ```

4. Start the backend server
   ```
   cd ../backend
   node server.js
   ```

5. Start the frontend development server
   ```
   cd ../frontend
   npm run dev
   ```

6. Open your browser and navigate to `http://localhost:5173`

## Connecting the Frontend to the Backend

The frontend connects to the backend through the API service in `frontend/src/services/api.ts`. This service handles:

1. **Authentication**: Login, registration, and user profile retrieval
2. **Diagnosis**: Creating new diagnoses and fetching existing ones
3. **Feedback**: Submitting user feedback on analysis results

The API service uses the `fetch` API to make HTTP requests to the backend endpoints, with proper error handling and authentication token management.

### Authentication Flow

1. User logs in or registers through the Auth component
2. Backend validates credentials and returns a JWT token
3. Frontend stores the token in localStorage
4. Subsequent API requests include the token in the Authorization header

### Diagnosis Flow

1. User inputs animal type and symptoms in the App component
2. Frontend sends a POST request to the `/api/diagnosis` endpoint
3. Backend processes the request, calls the Gemini API, and returns the analysis
4. Frontend displays the results to the user

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Google Gemini API for providing the AI capabilities
- MongoDB Atlas for database hosting
- The MERN stack community for excellent documentation and resources
