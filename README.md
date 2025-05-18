# VetAI Analyzer

A professional pet symptom analyzer that uses AI to provide veterinary assessments and recommendations for pet health issues. The application also includes a map feature to find nearby veterinary clinics.

## Features

- Professional veterinary analysis of pet symptoms
- Structured results with severity indicators
- Nearby veterinary clinic finder using OpenStreetMap
- Responsive design for mobile and desktop
- Print functionality for saving analysis results

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Google Gemini API key

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/vetai-analyzer.git
cd vetai-analyzer
```

2. Install dependencies
```bash
npm install
```

3. Create a `.env` file in the root directory with your API key
```
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

4. Start the development server
```bash
npm run dev
```

## Deploying to Vercel

This project is configured for easy deployment to Vercel. Follow these steps to deploy:

### Method 1: Using Vercel CLI

1. Install Vercel CLI globally
```bash
npm install -g vercel
```

2. Login to Vercel
```bash
vercel login
```

3. Deploy the project
```bash
vercel --prod
```

### Method 2: Using Vercel Dashboard

1. Push your code to a GitHub repository

2. Go to [Vercel Dashboard](https://vercel.com/dashboard)

3. Click "New Project" and import your repository

4. Configure the project:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`

5. Add your environment variables:
   - `VITE_GEMINI_API_KEY`: Your Google Gemini API key

6. Click "Deploy"

### Important Notes for Deployment

- The map component uses client-side rendering to avoid issues with server-side rendering
- Ensure your Gemini API key is properly set in the Vercel environment variables
- The Overpass API used for finding veterinary clinics has rate limits, so be mindful of high traffic
