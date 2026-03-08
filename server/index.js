import express from 'express';
import cors from 'cors';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());
// Serve static frontend files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// Initialize Google Gen AI SDK
const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY, 
});

// Load the predefined places data from our public assets to give context to Gemini
const placesFilePath = path.join(__dirname, '../public/js/places.js');
let placesContextText = '';
try {
    const placesModuleContent = fs.readFileSync(placesFilePath, 'utf8');
    // Extract everything between the bracket array to parse it crudely for prompt context
    const arrayMatch = placesModuleContent.match(/\[([\s\S]*)\];/);
    if (arrayMatch) {
       placesContextText = `You have specific predefined high-quality assets for the following locations. If the user is near them, prioritize featuring them in your tour and weave the provided 'audioText' script into your story: \n\n[` + arrayMatch[1] + `]`;
    }
} catch(e) { console.error("Could not load places.js for context", e); }

const systemInstruction = `
You are an expert, lively, and highly knowledgeable New York City local tour guide. 
You are giving a walking tour to a user based on their current GPS coordinates.
Your goal is to tell a fascinating, continuous story about the area they are in.
Focus on hidden gems, historical context, and architectural details specific to NYC.

As you mention specific places, landmarks, or restaurants, you MUST use the 'showLocationOnMap' tool to drop a pin on the user's map.
Do not pause your story when using the tool, just interleave it naturally as you speak about the place.

${placesContextText}

Keep your tone engaging, friendly, and narrative-driven. 
Format your text using markdown (bolding, italics).
`;

const showLocationTool = {
  name: 'showLocationOnMap',
  description: 'Displays a specific place, landmark, or point of interest on the interactive map with a short description.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: { 
        type: Type.STRING, 
        description: 'The exact name of the place (e.g., "Empire State Building", "Times Square")' 
      },
      lat: { 
        type: Type.NUMBER, 
        description: 'The latitude coordinate of the place' 
      },
      lng: { 
        type: Type.NUMBER, 
        description: 'The longitude coordinate of the place' 
      },
      shortDescription: { 
        type: Type.STRING, 
        description: 'A very short 1-sentence description of why this place matters' 
      },
      category: {
        type: Type.STRING,
        description: 'Category of the place for map marker styling',
        enum: ['museum', 'landmark', 'restaurant', 'park', 'general']
      }
    },
    required: ['name', 'lat', 'lng', 'shortDescription', 'category'],
  }
};

app.post('/api/tour/stream', async (req, res) => {
  const { lat, lng, step = 0 } = req.body;

  if (!lat || !lng) {
    return res.status(400).json({ error: 'Latitude and longitude are required.' });
  }

  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders(); // flush the headers to establish SSE

  try {
    // HARDCODED DEMO TOUR
    // Bypasses the Gemini API for a fast, reliable hackathon presentation
    
    console.log("Starting Prebuilt Demo Tour Stream...");
    
    const allEvents = [
        // Step 0: Welcome & Empire State
        { type: 'text', content: 'Welcome to the heart of New York City! I am your AI tour guide, and we are going to explore some of the most iconic landmarks around you.\n\nFirst, let\'s look at a true classic: ' },
        { type: 'tool_call', name: 'showLocationOnMap', args: { name: 'Empire State Building', lat: 40.7484, lng: -73.9857, shortDescription: 'A towering symbol of NYC.', category: 'landmark' } },
        { type: 'text', content: ' The Empire State Building! For nearly 40 years, it was the tallest building in the world and remains the absolute heart of the skyline.\n\n' },

        // Step 1: NYPL
        { type: 'text', content: 'If we head just a few blocks north, we arrive at the majestic ' },
        { type: 'tool_call', name: 'showLocationOnMap', args: { name: 'New York Public Library', lat: 40.7532, lng: -73.9822, shortDescription: 'Guarded by two famous stone lions.', category: 'landmark' } },
        { type: 'text', content: ' New York Public Library. It is guarded by those two famous stone lions, Patience and Fortitude, who have been watching over 5th Avenue for over a century.\n\n' },

        // Step 2: Bryant Park
        { type: 'text', content: 'And right behind the library, you will find a wonderful oasis: ' },
        { type: 'tool_call', name: 'showLocationOnMap', args: { name: 'Bryant Park', lat: 40.7536, lng: -73.9832, shortDescription: 'A lush public park.', category: 'park' } },
        { type: 'text', content: ' Bryant Park! It is the perfect place to grab a coffee, watch the crowds, or enjoy the winter village during the holidays.\n\n' },

        // Step 3: Chrysler Building
        { type: 'text', content: 'Now look up towards the east, and you will see the absolute jewel of the skyline: ' },
        { type: 'tool_call', name: 'showLocationOnMap', args: { name: 'Chrysler Building', lat: 40.7516, lng: -73.9755, shortDescription: 'Famous Art Deco skyscraper.', category: 'landmark' } },
        { type: 'text', content: ' The Chrysler Building. Its gleaming stainless steel spire and terraced crown make it a masterpiece of Art Deco design.\n\n' },

        // Step 4: Closing
        { type: 'text', content: 'I hope you enjoyed this quick walking tour of Midtown Manhattan! There is so much more to see, but these landmarks are the perfect place to start. Enjoy your walk!' }
    ];

    let mockStreamEvents = [];
    if (step === 0) mockStreamEvents = allEvents.slice(0, 3);
    else if (step === 1) mockStreamEvents = allEvents.slice(3, 6);
    else if (step === 2) mockStreamEvents = allEvents.slice(6, 9);
    else if (step === 3) mockStreamEvents = allEvents.slice(9, 12);
    else if (step >= 4) mockStreamEvents = allEvents.slice(12);

    // Helper to simulate asynchronous streaming
    const delay = (ms) => new Promise(res => setTimeout(res, ms));

    for (const event of mockStreamEvents) {
        if (event.type === 'text') {
            // Split text by spaces and stream word by word to simulate typing
            const words = event.content.split(' ');
            for (let i = 0; i < words.length; i++) {
                 // Add the space back, except for the last word
                 const chunkText = words[i] + (i < words.length - 1 ? ' ' : '');
                 res.write(`data: ${JSON.stringify({ type: 'text', content: chunkText })}\n\n`);
                 await delay(75); // fast typing speed
            }
        } else if (event.type === 'tool_call') {
            // Give a slight pause before a tool call
            await delay(500);
            res.write(`data: ${JSON.stringify({ 
                type: 'tool_call', 
                name: event.name, 
                args: event.args 
            })}\n\n`);
            await delay(1000); // Wait a second for the UI to render the image
        }
    }

    // Indicate stream end
    res.write('data: [DONE]\n\n');
    res.end();

  } catch (error) {
    console.error('Error streaming to Gemini:', error);
    res.write(`data: ${JSON.stringify({ type: 'error', content: 'Failed to generate tour.' })}\n\n`);
    res.end();
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server listening on port ${port} on all interfaces`);
});
