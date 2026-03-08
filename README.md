# Gemini Tour Guide // Google Hackathon Project
## March 2026
## by Diarra Bell <3

Launch the live demo here! https://geminitour-452748484124.us-central1.run.app

Here is how the Gemini Tour Guide app works, explained super simply!

Imagine you have a **magical interactive map and walkie-talkie**. 

### 1. The Map & Walkie Talkie (The Frontend)
When you open the app on your phone, it immediately figures out exactly where you are standing using GPS (or pretends you are in New York City if you say no). It shows you your location on a map and gives you a chat box (the walkie-talkie).

You can swipe through pictures of famous places nearby (like the Empire State Building). If you tap one, your magical map instantly teleports you there so you can pretend you are standing right in front of it!

### 2. The Telephone Operator (The Node.js Backend)
When you press "Start Walking Tour", your app sends a quick radio message with your exact GPS coordinates to an operator sitting in the cloud (Google Cloud Run). 

The operator's only job is to dial the phone to the smartest tour guide in the world: **Gemini**.

### 3. The Super Smart Tour Guide (Gemini AI)
The operator tells Gemini: *"Hey, my friend is standing right here in New York City. Tell them a great story about what's around them, and if you mention one of these famous places we have pictures of, tell me immediately!"*

Gemini starts talking. But instead of waiting to finish the whole story, it sends the words back to you **one sentence at a time** (this is called "Streaming"). 

**The Magic Trick (Interleaved Output):**
While Gemini is talking about a place—let's say it's telling a cool story about the Chrysler building—it suddenly presses a special button that sends a secret invisible signal to your map. 
Your map catches that signal in mid-air and **BAM!** It automatically drops a pin on the map and pops up a gorgeous picture of the Chrysler building for you to look at, while the story keeps playing in the chat box without ever hitting pause. 

### Summary of the Architecture:
- **Your Phone (Frontend)**: Shows the map, draws the pins, and displays the story as it arrives. 
- **The Cloud Server (Backend)**: Sits in the middle, safely holding your API keys and passing messages between your phone and the AI.
- **Gemini (AI Engine)**: Writes the story on the fly and acts as the "director," telling your phone exactly when and where to drop pins on the map using "Function Calling".

---

## Technical Overview

The **Gemini Tour Guide** is a location-aware, reactive web application designed for the Google Hackathon. It leverages Google Cloud Platform (Cloud Run) and the Gemini API to generate real-time, interactive walking tours based natively upon the user's geographic coordinates.

### What We Built

Instead of static place cards, we've implemented an **Interleaved AI Tour Guide**.
1. **Context-Aware Touring**: When a user opens the app, it captures their precise geolocation (falling back to New York City if denied) and requests a walking tour from `gemini-2.5-pro`.
2. **Featured Destinations Carousel**: Before starting the tour, users can scroll horizontally through beautiful, custom-generated cards for 7 iconic NYC landmarks (Times Square, Empire State, Flatiron, Grand Central, NYPL, Bryant Park, Chrysler Building). Tapping one instantly teleports the user's map there to begin a tailored tour.
3. **Server-Sent Events (SSE)**: The backend (built on Node.js/Express) uses streaming to push the AI's generated response directly to the frontend.
4. **Rich Media Injection**: The true magic happens here. The AI is instructed to use a `showLocationOnMap` tool *while* it is streaming the story. If Gemini mentions one of the 7 featured locations, the UI dynamically intercepts it and injects a large hero image, blurb, and marker directly into the chat stream!
5. **Reactive UI**: The custom-built Vanilla JS frontend renders the streaming text in a premium glassmorphism UI while animating Leaflet map points in concert.

### Architecture Details

* **Frontend**: Vanilla HTML / CSS / JS. Zero build steps, highly performant, utilizing a premium dark-mode design system. Maps powered by Leaflet.js and OpenStreetMap tiles.
* **Backend**: Node.js and Express server.
* **AI Core**: `@google/genai` Node.js SDK (Gemini API with Tool Declarations).
* **Infrastructure**: Packaged via Docker, ready to be deployed to **Google Cloud Run**.

---

## Running the App

### 1. Locally (Development)
You need Node.js installed on your machine.
```bash
# 1. Ensure you have the Gemini API Key
export GEMINI_API_KEY="your_api_key_here"

# 2. Install dependencies for the server
cd server
npm install

# 3. Start the Node.js backend
npm start
```
The server will run on `http://localhost:8080`. Open this URL in your browser to test the app. 
- *Note:* Geolocation will require you to allow browser permissions. If you block them, the app gracefully falls back to a demo location in New York City (Times Square).

### 2. Deploying to GCP Cloud Run (Production)

This project contains a root `Dockerfile` designed for Cloud Run zero-config deployments. 

Ensure you have the `gcloud` CLI installed and authenticated. From the root directory:

```bash
gcloud run deploy geminitour \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="GEMINI_API_KEY=your_actual_api_key_here"
```

Cloud Run will seamlessly build the container using Cloud Build and provision a public URL for your demo.

## Future Enhancements
- **Voice Interleaving:** Using the Gemini Live API WebSockets to stream actual TTS audio alongside the map markers.
- **Photos Integration:** Having the function call ping the Google Places API to fetch real imagery for the marker descriptions.