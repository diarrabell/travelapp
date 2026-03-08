// Map Module
let map;
let markers = [];
let routeLine = null;

export function initMap(containerId) {
    // Default to a world view initially
    map = L.map(containerId).setView([20, 0], 2);
    
    // Add dark-themed CartoDB map tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);
    
    return map;
}

export function setUserLocation(lat, lng) {
    map.setView([lat, lng], 15);
    
    // Custom user marker
    const userIcon = L.divIcon({
        className: 'user-marker-icon',
        html: '<div class="pulse-dot" style="width:16px; height:16px; background:#4285F4; box-shadow:0 0 0 0 rgba(66,133,244,0.7);"></div>',
        iconSize: [16, 16],
        iconAnchor: [8, 8]
    });
    
    L.marker([lat, lng], {icon: userIcon, zIndexOffset: 1000}).addTo(map);
}

export function addStopMarker(name, lat, lng, shortDescription, category) {
    // Generate an animated div marker
    const markerIcon = L.divIcon({
        className: 'custom-marker-container',
        html: `
            <div class="custom-marker"></div>
            <div class="marker-label">${name}</div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12]
    });

    const marker = L.marker([lat, lng], {icon: markerIcon}).addTo(map);
    
    if (shortDescription) {
        marker.bindPopup(`<b>${name}</b><br>${shortDescription}`);
    }
    
    markers.push({ lat, lng, marker });
    
    // Draw connecting line if there's a previous marker
    updateRouteLine();
    
    // Pan slightly to fit the new marker
    const group = new L.featureGroup(markers.map(m => m.marker));
    map.fitBounds(group.getBounds(), { padding: [50, 50], maxZoom: 16 });
}

function updateRouteLine() {
    if (markers.length < 2) return;
    
    const latlngs = markers.map(m => [m.lat, m.lng]);
    
    if (routeLine) {
        map.removeLayer(routeLine);
    }
    
    // Draw a dashed route line connecting the tour stops
    routeLine = L.polyline(latlngs, {
        color: '#4285F4',
        weight: 3,
        dashArray: '5, 10',
        opacity: 0.8
    }).addTo(map);
}
