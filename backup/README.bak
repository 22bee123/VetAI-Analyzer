# VetAI Analyzer

AI-powered veterinary symptom analysis tool that helps pet owners understand potential conditions based on reported symptoms.

## Deployment to Render

### Prerequisites

- [Render](https://render.com/) account
- GitHub repository with your code

### Deployment Steps

1. **Push your code to GitHub**

2. **Create a new Web Service on Render**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New" and select "Web Service"
   - Connect your GitHub repository
   - Name your service (e.g., "vetai-analyzer")
   - Select the region closest to your users
   - Set the Environment to "Node"
   - Set the Build Command: `npm install && cd frontend && npm install && npm run build && cd ..`
   - Set the Start Command: `node backend/server.js`
   - Set the instance type (Free tier is fine for testing)

3. **Configure Environment Variables**
   - Go to the "Environment" tab
   - Add the following environment variables:
     - `NODE_ENV`: `production`
     - `PORT`: `5000` (Render will override this with its own port)
     - `MONGODB_URI`: Your MongoDB connection string
     - `GEMINI_API_KEY`: Your Google Gemini API key

4. **Deploy your application**
   - Click "Create Web Service"
   - Wait for the deployment to complete

5. **Verify the deployment**
   - Your application will be available at the URL provided by Render
   - Test the application to ensure it works as expected

## Mobile Compatibility

To ensure your app works well on mobile devices, we've included the following improvements:

1. **Service Worker**: Provides better performance and partial offline capabilities
2. **Enhanced Error Handling**: Better handles network issues common on mobile devices
3. **Absolute API URLs**: Configuration uses absolute URLs to avoid issues with relative paths on mobile

### Mobile Troubleshooting

If you're experiencing issues with mobile access:

1. **Clear Browser Cache**: On your mobile device, clear the browser cache and cookies
2. **Use HTTPS**: Ensure you're accessing the site via HTTPS
3. **Check Network**: Ensure your mobile device has a stable internet connection
4. **Try Different Browser**: Test on multiple browsers (Chrome, Safari, Firefox)
5. **Check Console Logs**: If possible, connect to remote debugging and check console logs
6. **Update App**: Make sure you've deployed the latest version with mobile fixes

## Alternative Deployment Method Using render.yaml

This repository includes a `render.yaml` file that allows for easy deployment using Render's Blueprint feature.

1. Fork this repository
2. Go to the Render Dashboard and select "New" > "Blueprint"
3. Connect to your forked repository
4. Configure the environment variables
5. Deploy

## Local Development

1. Clone the repository
2. Install dependencies: `npm install` and `cd frontend && npm install`
3. Create a `.env` file in the root with the required environment variables
4. Start the development server: `npm run dev` in the root and `cd frontend && npm run dev` in another terminal

## Environment Variables

- `PORT`: Port for the server (default: 5000)
- `MONGODB_URI`: MongoDB connection string
- `GEMINI_API_KEY`: Google Gemini API key
- `NODE_ENV`: Environment mode (development/production) 