// Your GitHub username and repo name
const GITHUB_USER = 'Megachile';
const GITHUB_REPO = 'Megachile.github.io'; // Repo name isn't needed for constructing URLs in a project site

async function loadGalleryImages(galleryType) {
    try {
        const response = await fetch(
            `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/datingdoc/images/${galleryType}`
        );
        const files = await response.json();
        
        // Filter for image files only
        const imageFiles = files
            .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name))
            .map(file => file.name);
            
        return imageFiles;
    } catch (error) {
        console.error(`Error loading ${galleryType} images:`, error);
        return [];
    }
}

async function displayGallery(galleryType) {
    const container = document.getElementById(`${galleryType}-gallery`);
    const images = await loadGalleryImages(galleryType);
    const shuffled = images.sort(() => Math.random() - 0.5);
    const imagesToShow = shuffled.slice(0, 5);
    
    container.innerHTML = imagesToShow.map(img => 
        `<img src="https://megachile.github.io/datingdoc/images/${galleryType}/${img}" alt="${galleryType} image">`
    ).join('');
}

async function shuffleGallery(galleryType) {
    await displayGallery(galleryType);
}

// Initialize galleries on page load
window.onload = async function() {
    await displayGallery('life');
    await displayGallery('art');
    await displayGallery('interests');
};
