const GITHUB_USER = 'Megachile';
const GITHUB_REPO = 'datingdoc';

async function loadGalleryImages(galleryType) {
    try {
        const response = await fetch(
            `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/images/${galleryType}`
        );
        const files = await response.json();

        if (!Array.isArray(files)) {
            throw new Error(`GitHub API returned non-array: ${JSON.stringify(files)}`);
        }

        return files
            .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name))
            .map(file => file.name);
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

window.onload = async function() {
    await displayGallery('life');
    await displayGallery('art');
    await displayGallery('interests');
};
