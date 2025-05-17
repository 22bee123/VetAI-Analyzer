# VetAI Analyzer

A web application that helps pet owners analyze their pet's symptoms and find nearby veterinary clinics.

## Features

- Input pet type and symptoms
- AI-powered analysis of pet health issues
- Detailed breakdown of possible conditions with probability levels
- Actionable recommendations for pet owners
- Suggested diagnostic tests
- Long-term management considerations
- AI-powered analysis of pet symptoms
- Find nearest veterinary clinics based on user location using free OpenStreetMap data
- View clinic details and get directions
- Modern, responsive UI built with React and Tailwind CSS

## Setup and Installation

### Prerequisites

- Node.js 18.x or higher
- npm or yarn
- Google Gemini API key (for AI analysis features)

### Installation

1. Clone the repository

2. Install dependencies
```bash
npm install --legacy-peer-deps
```

> **Note on Dependencies:** This project uses React 18.x because react-leaflet 4.2.1 is not yet compatible with React 19. The `--legacy-peer-deps` flag helps avoid dependency conflicts.

### Setting up the Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey) and sign in with your Google account
2. Create a new API key or use an existing one
3. Copy the API key
4. Create a `.env` file in the root directory of the project
5. Add your Gemini API key to the `.env` file:
```
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

### Running the Application

To run both the frontend and API server together:

```bash
npm run dev:full
```

Or you can run them separately:

1. Start the frontend development server:
```bash
npm run dev
```

2. Start the API server in a separate terminal:
```bash
npm run dev:server
```

3. Open your browser and navigate to `http://localhost:5173`

## Maps and Geolocation

This application uses:
- **Leaflet** - A free, open-source JavaScript library for interactive maps
- **OpenStreetMap** - Free map data that powers the visual map
- **Overpass API** - Free API to query OpenStreetMap data for veterinary clinics near the user

The map functionality:
- Requires user location permission to work (please allow location access when prompted)
- Searches for veterinary clinics within a 5km radius of the user
- If no veterinary clinics are found, it will show pet shops and animal boarding facilities as alternatives
- Provides directions through OpenStreetMap's routing service

## Backend Integration

The backend functionality has been integrated directly into the frontend for easier deployment to Vercel. The application uses serverless functions to handle the pet symptom analysis feature.

### Local Development with Backend

1. Create a `.env` file in the frontend directory based on the `.env.example` template
2. Add your Gemini API key to the `.env` file
3. Run the development server with the integrated backend:

```bash
npm run dev:server
```

This will start both the frontend and the serverless API functions locally.

## Deployment

### Building for Production

To build the application for production:

```bash
npm run build
```

The built files will be in the `dist` directory and can be deployed to any static hosting service.

### Deploying to Vercel

This application is optimized for deployment on Vercel:

1. Create an account on [Vercel](https://vercel.com) if you don't have one
2. Install the Vercel CLI:
   ```bash
   npm install -g vercel
   ```
3. Login to Vercel:
   ```bash
   vercel login
   ```
4. Deploy the application:
   ```bash
   vercel
   ```

#### Environment Variables

Make sure to set up the following environment variable in your Vercel project settings:

- `GEMINI_API_KEY`: Your Google Gemini API key

You can set this up through the Vercel dashboard under Project Settings > Environment Variables, or using the Vercel CLI:

```bash
vercel env add GEMINI_API_KEY
```

## Technologies Used

- React 18
- TypeScript
- Tailwind CSS
- Vite
- Leaflet for maps
- React Leaflet
- OpenStreetMap data
- React Router
