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
    const latLngs = layer.getLatLngs();
    processPolygon(latLngs);
    displayArea(layer);
});

function processPolygon(latLngs) {
    const bounds = L.latLngBounds(latLngs[0]);
    const zoom = map.getZoom();
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
            const tileCoords = map.project(point, zoom).divideBy(tileSize).floor();
            tiles.push(tileCoords);
        }
    }

    let loadedTiles = 0;
    tiles.forEach(tileCoords => {
        const url = `https://basemaps.linz.govt.nz/v1/tiles/aerial/WebMercatorQuad/${zoom}/${tileCoords.x}/${tileCoords.y}.webp?api=c01hxzamyva2g6m208n3sqhsv23`;
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = url;

        img.onload = function() {
            const x = tileCoords.x * tileSize - map.getPixelBounds().min.x;
            const y = tileCoords.y * tileSize - map.getPixelBounds().min.y;
            context.drawImage(img, x, y, tileSize, tileSize);

            loadedTiles++;
            if (loadedTiles === tiles.length) {
                detectRust(canvas, context, latLngs[0]);
            }
        };
    });
}

function detectRust(canvas, context, latLngs) {
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    const lowerRust = [60, 20, 10];  // Adjusted lower bound for rust color based on provided images
    const upperRust = [200, 120, 80];  // Adjusted upper bound for rust color based on provided images
    const closeToRust = 40;  // Tolerance for "close to rust" colors

    // Create a mask based on the polygon
    const maskCanvas = document.createElement('canvas');
    const maskContext = maskCanvas.getContext('2d');
    maskCanvas.width = canvas.width;
    maskCanvas.height = canvas.height;

    maskContext.beginPath();
    latLngs.forEach((latLng, index) => {
        const point = map.latLngToContainerPoint(latLng);
        if (index === 0) {
            maskContext.moveTo(point.x, point.y);
        } else {
            maskContext.lineTo(point.x, point.y);
        }
    });
    maskContext.closePath();
    maskContext.fill();

    const maskImageData = maskContext.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
    const maskData = maskImageData.data;

    for (let i = 0; i < data.length; i += 4) {
        const x = (i / 4) % canvas.width;
        const y = Math.floor((i / 4) / canvas.width);

        const maskIndex = (y * maskCanvas.width + x) * 4;
        if (maskData[maskIndex + 3] > 0) {  // Check if pixel is within the polygon
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            if (r >= lowerRust[0] && r <= upperRust[0] && 
                g >= lowerRust[1] && g <= upperRust[1] && 
                b >= lowerRust[2] && b <= upperRust[2]) {
                data[i] = 255; // Red
                data[i + 1] = 0; // Green
                data[i + 2] = 0; // Blue
            } else if (Math.abs(r - lowerRust[0]) <= closeToRust &&
                       Math.abs(g - lowerRust[1]) <= closeToRust &&
                       Math.abs(b - lowerRust[2]) <= closeToRust) {
                data[i] = 255; // Yellow outline for close to rust colors
                data[i + 1] = 255; 
                data[i + 2] = 0; 
            } else {
                data[i + 3] = 50; // Reduce opacity for non-rust areas
            }
        } else {
            data[i + 3] = 0;  // Make pixels outside the polygon fully transparent
        }
    }

    context.putImageData(imageData, 0, 0);
}

function displayArea(layer) {
    const latLngs = layer.getLatLngs()[0];
    const area = L.GeometryUtil.geodesicArea(latLngs);
    document.getElementById('area').innerHTML = `Area: ${(area / 10000).toFixed(2)} m<sup>2</sup>`;
}
