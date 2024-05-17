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

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Simple color threshold for rust detection (reddish-brown color)
        if (r > 100 && r < 200 && g < 100 && b < 100) {
            data[i] = 255; // Red
            data[i + 1] = 0; // Green
            data[i + 2] = 0; // Blue
        } else {
            data[i + 3] = 50; // Reduce opacity for non-rust areas
        }
    }

    processedCtx.putImageData(imageData, 0, 0);
}
