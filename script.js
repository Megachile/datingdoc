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

    // --- New logic: prefer 4, fall back to 3, 2, 1 based on available width
    const containerWidth = container.offsetWidth;
    const minImageWidth = 250;
    const preferredCount = 4;
    const maxCount = 6;

    let imagesPerRow = Math.floor(containerWidth / minImageWidth);
    let totalImagesToShow;

    if (imagesPerRow >= preferredCount) {
        totalImagesToShow = preferredCount;
    } else if (imagesPerRow >= 3) {
        totalImagesToShow = 3;
    } else if (imagesPerRow >= 2) {
        totalImagesToShow = 2;
    } else {
        totalImagesToShow = 1;
    }

    totalImagesToShow = Math.min(totalImagesToShow, maxCount, images.length);

    const imagesToShow = shuffled.slice(0, totalImagesToShow);

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
