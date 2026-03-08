# Deploying to Google Cloud Platform

This app is designed to run on **GCP Cloud Run**, which provides serverless container hosting and automatically scales from zero.

## Prerequisites
1. Install the [Google Cloud CLI](https://cloud.google.com/sdk/docs/install)
2. Obtain a [Gemini API Key](https://aistudio.google.com/app/apikey) from Google AI Studio.

## Deployment Steps

1. **Authenticate with GCP**:
   ```bash
   gcloud auth login
   gcloud config set project YOUR_HACKATHON_PROJECT_ID
   ```

2. **Navigate to the server directory**:
   The app must be deployed from the `server/` directory, which contains the Dockerfile, but it must include the `public/` files. We built it so `server/index.js` serves `../public`. So run the submit from the root project folder!

3. **Deploy to Cloud Run via Source**:
   From the `/Users/dbell/travelapp` root directory:
   ```bash
   gcloud run deploy geminitour \
     --source . \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars="GEMINI_API_KEY=your_actual_api_key_here"
   ```

   *Note on the `--source .` flag:* Cloud Run will automatically find the `server/Dockerfile` (if you specify it via `--source server` while copying public, or you can supply a `.gcloudignore`). Since we kept it simple, you can move the Dockerfile to the root to deploy the entire `travelapp/` folder.

   Wait, let's fix the Dockerfile location for easiest deployment...
