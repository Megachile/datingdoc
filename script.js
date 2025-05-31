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

    console.log(`${galleryType} gallery - Total images found:`, images.length);

    const shuffled = images.sort(() => Math.random() - 0.5);
    // Compute how many *can* fit at min width, but don't exceed hard cap
    const imagesToShow = shuffled.slice(0, Math.min(8, images.length));

    console.log(`${galleryType} gallery - Images to show:`, imagesToShow.length);
    console.log(`${galleryType} gallery - Image names:`, imagesToShow);

    container.innerHTML = imagesToShow.map(img => 
        `<img src="https://megachile.github.io/datingdoc/images/${galleryType}/${img}" 
              alt="${galleryType} image" 
              onerror="this.style.border='2px solid red'; this.alt='Image not found'">`
    ).join('');

    console.log(`${galleryType} gallery - Actual images in DOM:`, container.querySelectorAll('img').length);
}




async function shuffleGallery(galleryType) {
    await displayGallery(galleryType);
}

window.onload = async function() {
    await displayGallery('life');
    await displayGallery('art');
    await displayGallery('interests');
};
