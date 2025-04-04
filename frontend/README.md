# VetAI Analyzer

A web application that helps pet owners analyze their pet's symptoms and find nearby veterinary clinics.

## Features

- AI-powered analysis of pet symptoms
- Find nearest veterinary clinics based on user location using free OpenStreetMap data
- View clinic details and get directions
- Modern, responsive UI built with React and Tailwind CSS

## Setup and Installation

### Prerequisites

- Node.js 18.x or higher
- npm or yarn

### Installation

1. Clone the repository
2. Navigate to the frontend directory
```bash
cd frontend
```

3. Install dependencies
```bash
npm install
```

> **Note on Dependencies:** This project uses React 18.x because react-leaflet 4.2.1 is not yet compatible with React 19. If you encounter any dependency conflicts, you can use the `--legacy-peer-deps` flag: `npm install --legacy-peer-deps`

### Running the Application

1. Start the development server
```bash
npm run dev
```

2. Open your browser and navigate to `http://localhost:5173`

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

## Backend Setup

The application requires a backend server for the pet symptom analysis feature. The backend is located in a separate repository and needs to be set up separately.

1. Clone the backend repository (if not already included)
2. Follow the instructions in the backend repository's README to set up and run the backend server

## Deployment

To build the application for production:

```bash
npm run build
```

The built files will be in the `dist` directory and can be deployed to any static hosting service.

## Technologies Used

- React 18
- TypeScript
- Tailwind CSS
- Vite
- Leaflet for maps
- React Leaflet
- OpenStreetMap data
- React Router
