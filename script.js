const map = L.map('map').setView([-36.8485, 174.7633], 14);  // Centered on Auckland CBD

L.tileLayer('https://basemaps.linz.govt.nz/v1/tiles/aerial/WebMercatorQuad/{z}/{x}/{y}.webp?api=c01hxzamyva2g6m208n3sqhsv23', {
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
    displayArea(layer);
});

function displayArea(layer) {
    const latLngs = layer.getLatLngs()[0];
    const polygon = turf.polygon([latLngs.map(latLng => [latLng.lng, latLng.lat])]);
    const area = turf.area(polygon);
    document.getElementById('area').innerHTML = `Area: ${(area / 10000).toFixed(2)} m<sup>2</sup>`;
}

// Compass rotation logic
const compass = document.getElementById('compass');
const innerCircle = document.querySelector('.inner-circle');
let isDragging = false;
let startAngle = 0;

compass.addEventListener('mousedown', (e) => {
    isDragging = true;
    startAngle = getMouseAngle(e);
});

document.addEventListener('mousemove', (e) => {
    if (isDragging) {
        const angle = getMouseAngle(e);
        const rotation = (angle - startAngle + currentRotation + 360) % 360;
        map.setBearing(rotation);
        innerCircle.style.transform = `rotate(${rotation}deg)`;
    }
});

document.addEventListener('mouseup', () => {
    if (isDragging) {
        isDragging = false;
        currentRotation = map.getBearing();
    }
});

function getMouseAngle(e) {
    const rect = compass.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;
    const angle = Math.atan2(mouseY, mouseX) * (180 / Math.PI);
    return (angle + 360) % 360;
}

let currentRotation = 0;

L.Map.include({
    setBearing: function(angle) {
        this._bearing = angle;
        this.fire('bearingchange');
        return this;
    },
    getBearing: function() {
        return this._bearing || 0;
    }
});

map.on('bearingchange', function() {
    const center = map.getCenter();
    map.setView(center, map.getZoom(), {
        animate: false,
        bearing: map.getBearing()
    });
});
