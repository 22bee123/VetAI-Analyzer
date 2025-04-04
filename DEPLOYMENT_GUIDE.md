# VetAI Analyzer Deployment Guide

This guide helps address common deployment issues with the VetAI Analyzer application, specifically:

1. Backend not staying running
2. Application not working when shared with friends

## Deploying to Render (Properly)

### Prerequisites

- [Render](https://render.com/) account
- GitHub repository with your code
- All code changes made in this guide

### Step 1: Configure a Free/Paying Plan

On Render's Free tier, services will spin down after 15 minutes of inactivity. To avoid this:

- Use a paid plan if possible
- OR, set up a "cron job" health check to ping your app every 10 minutes using a service like UptimeRobot or Cron-job.org

### Step 2: Set Up Render Correctly

1. Go to your Render Dashboard
2. Click on your service or create a new one
3. Make sure these settings are configured:

**For a Web Service:**
- **Environment**: Node
- **Build Command**: `npm install && cd frontend && npm install && npm run build && cd ..`
- **Start Command**: `NODE_ENV=production node backend/server.js`
- **Auto-Deploy**: Enable
- **Free Instance Type**: 
   - Confirm "Suspend after 15 minutes" is accounted for in your plan
   - For paid plans, make sure to check "prevent suspension"

### Step 3: Set Environment Variables

In Render's Environment settings, add:
- `NODE_ENV`: `production` 
- `PORT`: `10000` (Render will override this)
- `MONGODB_URI`: Your MongoDB connection string
- `GEMINI_API_KEY`: Your Google Gemini API key

### Step 4: Health Checks

Set a health check URL in Render to:
- Path: `/api/health`
- Set frequency to 5 minutes (on paid plans)

### Step 5: Persistence Solutions

To keep your backend running without Cursor AI or for 24/7 availability:

**Option 1: Self-Ping**
1. Sign up for [UptimeRobot](https://uptimerobot.com/)
2. Add a new monitor pointing to `https://your-app-url.render.com/api/health`
3. Set check interval to 5 minutes

**Option 2: Paid Render Plan**
- Upgrade to Render's Standard plan ($7/month)
- Enable "prevent suspension" option

### Step 6: Troubleshooting for Friends

If friends can't access your app:

1. **Check API Calls**: Have friends open browser dev tools (F12) and check the console for errors
2. **Check Network Tab**: Look for 4xx or 5xx errors in API calls
3. **Verify URL**: Make sure they're using the full Render URL (https://your-app.onrender.com)
4. **Clear Cache**: Have them clear browser cache and cookies
5. **Check Logs**: In Render dashboard, check logs for errors when friends access the site

### Step 7: Fixing CORS Issues

If you still have CORS issues:
1. In Render, go to Environment
2. Add a new variable: `ALLOWED_ORIGINS` with value `*` (or specific domains)
3. Redeploy your application

## Testing Your Deployed App

After deploying:

1. Visit your Render URL
2. Try submitting pet analysis
3. If it works on your desktop but not mobile:
   - Test on cellular data (not just WiFi)
   - Check for errors in the developer console
   - Test on different browsers

## Ongoing Maintenance

To keep your app running reliably:

1. Set up [Render's Resource Monitoring](https://render.com/docs/monitoring)
2. Configure alerts for high CPU/memory usage
3. Regularly check your app is running with a health check tool
4. Monitor your MongoDB connection for potential issues

For 24/7 availability, upgrade to a paid plan or implement a comprehensive health check system. 