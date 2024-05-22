const map = L.map('map').setView([-36.8485, 174.7633], 14);  // Centered on Auckland CBD

const aucklandLayer = L.tileLayer('https://basemaps.linz.govt.nz/v1/tiles/auckland-central-2023-0.06m/WebMercatorQuad/{z}/{x}/{y}.webp?api=c01hxzamyva2g6m208n3sqhsv23', {
    maxZoom: 22,
    attribution: '&copy; <a href="https://www.linz.govt.nz/">LINZ</a>'
}).addTo(map);

const bayOfPlentyLayer = L.tileLayer('https://basemaps.linz.govt.nz/v1/tiles/bay-of-plenty-2023-0.1m/WebMercatorQuad/{z}/{x}/{y}.webp?api=c01hxzamyva2g6m208n3sqhsv23', {
    maxZoom: 22,
    attribution: '&copy; <a href="https://www.linz.govt.nz/">LINZ</a>'
});

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
                        calculateArea(polygon);
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
