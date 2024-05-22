const map = L.map('map').setView([-36.8485, 174.7633], 14);  // Centered on Auckland CBD

const aucklandLayer = L.tileLayer('https://basemaps.linz.govt.nz/v1/tiles/auckland-central-2023-0.06m/WebMercatorQuad/{z}/{x}/{y}.webp?api=c01hxzamyva2g6m208n3sqhsv23', {
    maxZoom: 22,
    attribution: '&copy; <a href="https://www.linz.govt.nz/">LINZ</a>'
}).addTo(map);

const bayOfPlentyLayer = L.tileLayer('https://basemaps.linz.govt.nz/v1/tiles/bay-of-plenty-2023-0.1m/WebMercatorQuad/{z}/{x}/{y}.webp?api=c01hxzamyva2g6m208n3sqhsv23', {
    maxZoom: 22,
    attribution: '&copy; <a href="https://www.linz.govt.nz/">LINZ</a>'
});

const taurangaCityLayer = L.tileLayer('https://basemaps.linz.govt.nz/v1/tiles/tauranga-city-urban-2022-0.1m/WebMercatorQuad/{z}/{x}/{y}.webp?api=c01hxzamyva2g6m208n3sqhsv23', {
    maxZoom: 22,
    attribution: '&copy; <a href="https://www.linz.govt.nz/">LINZ</a>'
});

const waikatoLayer = L.tileLayer('https://basemaps.linz.govt.nz/v1/tiles/waikato-2021-2022-0.05m/WebMercatorQuad/{z}/{x}/{y}.webp?api=c01hxzamyva2g6m208n3sqhsv23', {
    maxZoom: 22,
    attribution: '&copy; <a href="https://www.linz.govt.nz/">LINZ</a>'
});

const waikatoUrbanLayer = L.tileLayer('https://basemaps.linz.govt.nz/v1/tiles/waikato-urban-2021-0.1m/WebMercatorQuad/{z}/{x}/{y}.webp?api=c01hxzamyva2g6m208n3sqhsv23', {
    maxZoom: 22,
    attribution: '&copy; <a href="https://www.linz.govt.nz/">LINZ</a>'
});

const wellingtonCityLayer = L.tileLayer('https://basemaps.linz.govt.nz/v1/tiles/wellington-city-urban-2021-0.075m/WebMercatorQuad/{z}/{x}/{y}.webp?api=c01hxzamyva2g6m208n3sqhsv23', {
    maxZoom: 22,
    attribution: '&copy; <a href="https://www.linz.govt.nz/">LINZ</a>'
});

const aerialLayer = L.tileLayer('https://basemaps.linz.govt.nz/v1/tiles/aerial/WebMercatorQuad/{z}/{x}/{y}.webp?api=c01hxzamyva2g6m208n3sqhsv23', {
    maxZoom: 22,
    attribution: '&copy; <a href="https://www.linz.govt.nz/">LINZ</a>'
});

const baseMaps = {
    "Auckland Central 2023": aucklandLayer,
    "Bay of Plenty 2023": bayOfPlentyLayer,
    "Tauranga City Urban 2022": taurangaCityLayer,
    "Waikato 2021-2022": waikatoLayer,
    "Waikato Urban 2021": waikatoUrbanLayer,
    "Wellington City Urban 2021": wellingtonCityLayer,
    "Aerial": aerialLayer
};

L.control.layers(baseMaps).addTo(map);

const drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

const drawControl = new L.Control.Draw({
    edit: {
        featureGroup: drawnItems
    },
    draw: {
        polygon: true,
        polyline: false,
        rectangle: false,
        circle: false,
        marker: false
    }
});
map.addControl(drawControl);

map.on(L.Draw.Event.CREATED, function(event) {
    const layer = event.layer;
    drawnItems.addLayer(layer);
    calculateArea(layer);
});

function calculateArea(layer) {
    const latLngs = layer.getLatLngs()[0];
    const area = L.GeometryUtil.geodesicArea(latLngs);
    document.getElementById('area-detection').innerHTML = `Area: ${area.toFixed(2)} m²`;
    logMessage(`Polygon created with area: ${area.toFixed(2)} m²`, 'success');
}

const searchBar = document.getElementById('search-bar');

searchBar.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        const query = searchBar.value;
        geocodeQuery(query);
    }
});

function geocodeQuery(query) {
    logMessage(`Geocoding query: ${query}`, 'success');
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`)
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                const lat = data[0].lat;
                const lon = data[0].lon;
                map.setView([lat, lon], 18);
                fetchBuildingData([lat, lon]);
            } else {
                logMessage('Location not found. Please try a different query.', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            logMessage('An error occurred while searching. Please try again.', 'error');
        });
}

function fetchBuildingData(center) {
    const lat = center[0];
    const lon = center[1];
    const overpassUrl = `https://overpass-api.de/api/interpreter?data=[out:json];way[building](around:50,${lat},${lon});out body;`;

    logMessage(`Fetching building data for coordinates: [${lat}, ${lon}]`, 'success');
    fetch(overpassUrl)
        .then(response => response.json())
        .then(data => {
            const elements = data.elements;
            if (elements.length > 0) {
                elements.forEach(element => {
                    if (element.type === "way") {
                        const coordinates = element.geometry.map(point => [point.lat, point.lon]);
                        const polygon = L.polygon(coordinates).addTo(map);
                        drawnItems.addLayer(polygon);
                        calculateArea(polygon);
                    }
                });
            } else {
                logMessage('No building data found for this location.', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            logMessage('An error occurred while fetching building data. Please try again.', 'error');
        });
}

function logMessage(message, type) {
    const messageContainer = document.getElementById('messages');
    const messageElement = document.createElement('div');
    messageElement.className = `message ${type}`;
    messageElement.textContent = message;
    messageContainer.appendChild(messageElement);
    messageContainer.scrollTop = messageContainer.scrollHeight;
}

const filterButtons = document.querySelectorAll('.filter-button');

filterButtons.forEach(button => {
    button.addEventListener('click', function() {
        const type = this.getAttribute('data-type');
        filterMessages(type);
        filterButtons.forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
    });
});

function filterMessages(type) {
    const messages = document.querySelectorAll('.message');
    messages.forEach(message => {
        if (type === 'all') {
            message.style.display = 'block';
        } else if (message.classList.contains(type)) {
            message.style.display = 'block';
        } else {
            message.style.display = 'none';
        }
    });
}
