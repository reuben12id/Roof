const imageLoader = document.getElementById('imageLoader');
const originalCanvas = document.getElementById('originalCanvas');
const processedCanvas = document.getElementById('processedCanvas');
const originalCtx = originalCanvas.getContext('2d');
const processedCtx = processedCanvas.getContext('2d');

imageLoader.addEventListener('change', handleImage, false);

function handleImage(e) {
    const reader = new FileReader();
    reader.onload = function (event) {
        const img = new Image();
        img.onload = function () {
            originalCanvas.width = img.width;
            originalCanvas.height = img.height;
            processedCanvas.width = img.width;
            processedCanvas.height = img.height;
            originalCtx.drawImage(img, 0, 0);
            detectRust();
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(e.target.files[0]);
}

function detectRust() {
    const imageData = originalCtx.getImageData(0, 0, originalCanvas.width, originalCanvas.height);
    const data = imageData.data;

    const lowerRust = [100, 40, 20];  // Lower bound for rust color (extended range)
    const upperRust = [255, 150, 100];  // Upper bound for rust color (extended range)
    const closeToRust = 40;  // Tolerance for "close to rust" colors

    for (let i = 0; i < data.length; i += 4) {
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
    }

    processedCtx.putImageData(imageData, 0, 0);
}
