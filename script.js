// Add your image filenames here
const galleries = {
    life: [
        'life1.jpg',
        'life2.jpg',
        'life3.jpg',
        'life4.jpg',
        'life5.jpg',
        // Add more...
    ],
    art: [
        'watercolor1.jpg',
        'midjourney1.jpg',
        'macro1.jpg',
        'cloud1.jpg',
        // Add more...
    ],
    interests: [
        'interest1.jpg',
        'interest2.jpg',
        'interest3.jpg',
        // Add more...
    ]
};

function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

function displayGallery(galleryType) {
    const container = document.getElementById(`${galleryType}-gallery`);
    const images = shuffleArray(galleries[galleryType]);
    const imagesToShow = images.slice(0, 5); // Show 5 random images
    
    container.innerHTML = imagesToShow.map(img => 
        `<img src="images/${galleryType}/${img}" alt="${galleryType} image">`
    ).join('');
}

function shuffleGallery(galleryType) {
    displayGallery(galleryType);
}

// Initialize galleries on page load
window.onload = function() {
    displayGallery('life');
    displayGallery('art');
    displayGallery('interests');
};
