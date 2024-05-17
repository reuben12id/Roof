const map = L.map('map').setView([-36.8485, 174.7633], 14);  // Centered on Auckland CBD

L.tileLayer('https://basemaps.linz.govt.nz/v1/tiles/auckland-central-2023-0.06m/WebMercatorQuad/{z}/{x}/{y}.webp?api=c01hxzamyva2g6m208n3sqhsv23', {
    maxZoom: 22,
    attribution: '&copy; <a href="https://www.linz.govt.nz/">LINZ</a>'
}).addTo(map);

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
    analyzeRust(layer);
});

function analyzeRust(layer) {
    const latLngs = layer.getLatLngs()[0];
    const bounds = L.latLngBounds(latLngs);
    const size = map.getSize();
    const canvas = document.getElementById('outputCanvas');
    const context = canvas.getContext('2d');
    
    canvas.width = size.x;
    canvas.height = size.y;
    
    context.clearRect(0, 0, canvas.width, canvas.height);

    const tiles = [];
    const tileSize = 256;

    for (let x = 0; x < size.x; x += tileSize) {
        for (let y = 0; y < size.y; y += tileSize) {
            const point = map.containerPointToLatLng([x, y]);
            const tileCoords = map.project(point, map.getZoom()).divideBy(tileSize).floor();
            tiles.push(tileCoords);
        }
    }

    let loadedTiles = 0;
    tiles.forEach(tileCoords => {
        const url = `https://basemaps.linz.govt.nz/v1/tiles/auckland-central-2023-0.06m/WebMercatorQuad/${map.getZoom()}/${tileCoords.x}/${tileCoords.y}.webp?api=c01hxzamyva2g6m208n3sqhsv23`;
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = url;

        img.onload = function() {
            const x = tileCoords.x * tileSize - map.getPixelBounds().min.x;
            const y = tileCoords.y * tileSize - map.getPixelBounds().min.y;
            context.drawImage(img, x, y, tileSize, tileSize);

            loadedTiles++;
            if (loadedTiles === tiles.length) {
                detectRust(canvas);
            }
        };
    });
}

function detectRust(canvas) {
    const context = canvas.getContext('2d');
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    const lowerRust = [60, 20, 10];  // Adjusted lower bound for rust color based on provided images
    const upperRust = [200, 120, 80];  // Adjusted upper bound for rust color based on provided images

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        if (r >= lowerRust[0] && r <= upperRust[0] && 
            g >= lowerRust[1] && g <= upperRust[1] && 
            b >= lowerRust[2] && b <= upperRust[2]) {
            data[i] = 255;  // Highlight rust areas in red
            data[i + 1] = 0;
            data[i + 2] = 0;
        } else {
            data[i + 3] = 200;  // Increase opacity for non-rust areas
        }
    }

    context.putImageData(imageData, 0, 0);
    document.getElementById('rust-detection').innerHTML = `Rust Detection: Completed`;
}

const searchBar = document.getElementById('search-bar');

searchBar.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        const query = searchBar.value;
        geocodeQuery(query);
    }
});

function geocodeQuery(query) {
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`)
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                const lat = data[0].lat;
                const lon = data[0].lon;
                map.setView([lat, lon], 18);
                fetchBuildingData([lat, lon]);
            } else {
                alert('Location not found. Please try a different query.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while searching. Please try again.');
        });
}

function fetchBuildingData(center) {
    const lat = center[0];
    const lon = center[1];
    const overpassUrl = `https://overpass-api.de/api/interpreter?data=[out:json];way[building](around:50,${lat},${lon});out body;`;

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
                        analyzeRust(polygon);
                    }
                });
            } else {
                alert('No building data found for this location.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while fetching building data. Please try again.');
        });
}
