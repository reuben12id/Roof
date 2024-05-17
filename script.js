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

const compass = document.getElementById('compass');
const compassImg = document.getElementById('compassImg');
let currentRotation = 0;

compass.addEventListener('click', () => {
    currentRotation = (currentRotation + 15) % 360;
    map.setBearing(currentRotation);
    compassImg.style.transform = `rotate(${currentRotation}deg)`;
});

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
