const map = L.map('map').setView([-36.8485, 174.7633], 14);  // Centered on Auckland CBD

const layers = {
    auckland: L.tileLayer('https://basemaps.linz.govt.nz/v1/tiles/auckland-central-2023-0.06m/WebMercatorQuad/{z}/{x}/{y}.webp?api=c01hxzamyva2g6m208n3sqhsv23', { maxZoom: 22, attribution: '&copy; <a href="https://www.linz.govt.nz/">LINZ</a>' }),
    bayOfPlenty: L.tileLayer('https://basemaps.linz.govt.nz/v1/tiles/bay-of-plenty-2023-0.1m/WebMercatorQuad/{z}/{x}/{y}.webp?api=c01hxzamyva2g6m208n3sqhsv23', { maxZoom: 22, attribution: '&copy; <a href="https://www.linz.govt.nz/">LINZ</a>' }),
    taurangaCity: L.tileLayer('https://basemaps.linz.govt.nz/v1/tiles/tauranga-city-urban-2022-0.1m/WebMercatorQuad/{z}/{x}/{y}.webp?api=c01hxzamyva2g6m208n3sqhsv23', { maxZoom: 22, attribution: '&copy; <a href="https://www.linz.govt.nz/">LINZ</a>' }),
    waikato: L.tileLayer('https://basemaps.linz.govt.nz/v1/tiles/waikato-2021-2022-0.05m/WebMercatorQuad/{z}/{x}/{y}.webp?api=c01hxzamyva2g6m208n3sqhsv23', { maxZoom: 22, attribution: '&copy; <a href="https://www.linz.govt.nz/">LINZ</a>' }),
    waikatoUrban: L.tileLayer('https://basemaps.linz.govt.nz/v1/tiles/waikato-urban-2021-0.1m/WebMercatorQuad/{z}/{x}/{y}.webp?api=c01hxzamyva2g6m208n3sqhsv23', { maxZoom: 22, attribution: '&copy; <a href="https://www.linz.govt.nz/">LINZ</a>' }),
    wellingtonCity: L.tileLayer('https://basemaps.linz.govt.nz/v1/tiles/wellington-city-urban-2021-0.075m/WebMercatorQuad/{z}/{x}/{y}.webp?api=c01hxzamyva2g6m208n3sqhsv23', { maxZoom: 22, attribution: '&copy; <a href="https://www.linz.govt.nz/">LINZ</a>' }),
    sydney: L.tileLayer('https://basemaps.six.nsw.gov.au/v1/tiles/sydney-2024-0.1m/WebMercatorQuad/{z}/{x}/{y}.webp', { maxZoom: 22, attribution: '&copy; <a href="https://www.six.nsw.gov.au/">Six Maps</a>' }),
    aerial: L.tileLayer('https://basemaps.linz.govt.nz/v1/tiles/aerial/WebMercatorQuad/{z}/{x}/{y}.webp?api=c01hxzamyva2g6m208n3sqhsv23', { maxZoom: 22, attribution: '&copy; <a href="https://www.linz.govt.nz/">LINZ</a>' })
};

// Add the initial layer to the map
layers.auckland.addTo(map);

const layerSelect = document.getElementById('layer-select');
layerSelect.addEventListener('change', function() {
    const selectedLayer = layerSelect.value;
    // Remove all layers
    Object.values(layers).forEach(layer => map.removeLayer(layer));
    // Add the selected layer
    layers[selectedLayer].addTo(map);
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
    logMessage(`Polygon created with area: ${area.toFixed(2)} m²`, 'success');
}

const searchBar = document.getElementById('search-bar');

searchBar.addEventListener('keypress', function
