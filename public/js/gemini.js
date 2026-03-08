import { addStopMarker } from './map.js';
import { appendMessage, updateSystemStatus } from './ui.js';
import { featuredPlaces } from './places.js';

let currentTextBuffer = "";

export async function startGeminiTour(lat, lng, step = 0) {
    updateSystemStatus('streaming', 'Gemini is generating tour...');
    
    if (step === 0) {
        appendMessage('gemini', '', true); // Start streaming message indicator
        currentTextBuffer = "";
    }
    
    try {
        // We use fetch directly with a ReadableStream to parse SSE explicitly 
        // to handle the interleaved text + function call drops beautifully
        const response = await fetch('/api/tour/stream', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat, lng, step })
        });
        
        if (!response.ok) throw new Error('Network response was not ok');
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n\n');
            buffer = lines.pop(); // keep the last incomplete chunk in buffer
            
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const dataStr = line.substring(6);
                    if (dataStr === '[DONE]') {
                        updateSystemStatus('ready', 'Tour complete');
                        return;
                    }
                    
                    try {
                        const data = JSON.parse(dataStr);
                        handleStreamEvent(data);
                    } catch (e) {
                        console.error('Error parsing stream data:', e);
                    }
                }
            }
        }
        
    } catch (error) {
        console.error('Streaming error:', error);
        updateSystemStatus('error', 'Failed to connect to guide.');
        appendMessage('system', 'Connection to tour guide lost.');
    }
}


function handleStreamEvent(data) {
    if (data.type === 'text') {
        const text = data.content;
        currentTextBuffer += text;
        
        // Convert to basic HTML for rendering ONLY for display, don't store the HTML back in the buffer!
        let htmlText = currentTextBuffer
            .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
            .replace(/\*(.*?)\*/g, '<i>$1</i>')
            .replace(/\n/g, '<br>');
            
        appendMessage('gemini', htmlText, true);
        
    } else if (data.type === 'tool_call') {
        // Interleaved Map Tool Call!
        if (data.name === 'showLocationOnMap') {
            const args = data.args;
            console.log("Interleaved Tool Call received:", args);
            
            // Drop the pin on the map
            addStopMarker(args.name, args.lat, args.lng, args.shortDescription, args.category);
            
            // Check if this is one of our featured places
            const featuredPlace = featuredPlaces.find(p => p.name.toLowerCase() === args.name.toLowerCase());

            if (featuredPlace) {
                // Inject the rich hero image and text directly into the chat stream!
                const inlineHtml = `<div class="featured-card-inline">
                    <img src="${featuredPlace.image}" alt="${featuredPlace.name}" class="featured-img-inline">
                    <div class="featured-info-inline">
                        <h3>📍 ${featuredPlace.name}</h3>
                        <p><i>${featuredPlace.blurb}</i></p>
                    </div>
                </div>`;
                currentTextBuffer += inlineHtml;
            } else {
                // Standard visual indicator for un-featured places
                const inlineHtml = `<div style="background:rgba(66, 133, 244, 0.1); border-left:3px solid #4285F4; padding:8px 12px; margin:8px 0; border-radius:4px; font-size:0.85em;">📍 <b>${args.name}</b> marked on map.</div>`;
                currentTextBuffer += inlineHtml;
            }
        }
    }
}
