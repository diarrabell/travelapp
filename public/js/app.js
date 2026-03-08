import { initMap, setUserLocation } from './map.js';
import { updateSystemStatus } from './ui.js';
import { startGeminiTour } from './gemini.js';
import { featuredPlaces } from './places.js';

let userLat = null;
let userLng = null;

document.addEventListener('DOMContentLoaded', () => {
    // Initialize map
    initMap('map-container');
    
    const startBtn = document.getElementById('start-tour-btn');
    
    // Request location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                userLat = position.coords.latitude;
                userLng = position.coords.longitude;
                
                setUserLocation(userLat, userLng);
                updateSystemStatus('ready', 'Location locked. Ready for tour.');
                
                startBtn.disabled = false;
            },
            (error) => {
                console.error("Error getting location:", error);
                // Fallback to New York City (Demo mode: Times Square area)
                userLat = 40.7580;
                userLng = -73.9855;
                setUserLocation(userLat, userLng);
                updateSystemStatus('ready', 'Demo Mode (NYC) Ready.');
                startBtn.disabled = false;
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    } else {
        updateSystemStatus('error', 'Geolocation not supported.');
    }
    
    // Render Featured Places Carousel
    const carousel = document.getElementById('featured-carousel');
    featuredPlaces.forEach(place => {
        const card = document.createElement('div');
        card.className = 'featured-card';
        card.innerHTML = `
            <img src="${place.image}" alt="${place.name}" class="featured-img">
            <div class="featured-info">
                <h3>${place.name}</h3>
                <p>${place.blurb}</p>
            </div>
        `;
        
        // When tapped, teleport map to this POI
        card.addEventListener('click', () => {
            userLat = place.lat;
            userLng = place.lng;
            setUserLocation(userLat, userLng);
            updateSystemStatus('ready', `Location set to ${place.name}.`);
        });
        
        carousel.appendChild(card);
    });

    let currentPresentationStep = 0;
    const nextBtn = document.getElementById('presentation-next-btn');
    
    // Wire up Start button
    startBtn.addEventListener('click', async () => {
        if (!userLat || !userLng) return;
        
        startBtn.style.display = 'none'; // hide button
        document.getElementById('welcome-message').style.display = 'none'; // hide initial msg
        document.getElementById('featured-carousel').style.display = 'none'; // hide carousel
        
        // Show presentation next button
        nextBtn.style.display = 'block';
        nextBtn.disabled = true;
        
        // Start the interleaved streaming tour!
        await startGeminiTour(userLat, userLng, currentPresentationStep);
        
        if (currentPresentationStep < 4) {
            nextBtn.disabled = false;
        }
    });
    
    // Wire up Next button for presentation
    nextBtn.addEventListener('click', async () => {
        currentPresentationStep++;
        nextBtn.disabled = true;
        
        await startGeminiTour(userLat, userLng, currentPresentationStep);
        
        // Hide button when we reach the last step
        if (currentPresentationStep >= 4) {
            nextBtn.style.display = 'none';
        } else {
            nextBtn.disabled = false;
        }
    });
});
