const thumbnails = document.querySelectorAll('.gallery-item img');
const viewerContainer = document.getElementById('viewer-container');
const closeButton = document.querySelector('.close-button');

// Initialize OpenSeadragon viewer
const viewer = OpenSeadragon({
    id: "openseadragon-viewer",
    prefixUrl: "https://cdnjs.cloudflare.com/ajax/libs/openseadragon/5.0.1/images/",
    tileSources: null // No initial image
});

// Show viewer when a thumbnail is clicked
thumbnails.forEach((thumbnail) => {
    thumbnail.addEventListener('click', () => {
        const fullImage = thumbnail.getAttribute('data-full');
        viewer.open(fullImage);
        viewerContainer.style.display = 'block'; // Show full-page viewer

    });
});

// Close viewer when the close button is clicked
closeButton.addEventListener('click', () => {
    viewerContainer.style.display = 'none'; // Hide full-page viewer
    viewer.close(); // Optional: close the currently open image
});

// Close viewer when the Escape key is pressed
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') { // Check if the Escape key is pressed
        viewerContainer.style.display = 'none'; // Hide full-page viewer
        viewer.close(); // Optionally close the currently open image
    }
});
