const GITHUB_USER = 'Megachile';
const GITHUB_REPO = 'datingdoc';

async function loadGalleryImages(galleryType) {
    const cacheKey = `gallery-${galleryType}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
        try {
            return JSON.parse(cached);
        } catch (e) {
            console.warn(`Cache parse failed for ${cacheKey}, ignoring cache.`);
        }
    }

    try {
        const response = await fetch(
            `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/images/${galleryType}`
        );
        const files = await response.json();

        if (!Array.isArray(files)) {
            throw new Error(`GitHub API returned non-array: ${JSON.stringify(files)}`);
        }

        const images = files
            .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name))
            .map(file => file.name);

        sessionStorage.setItem(cacheKey, JSON.stringify(images));
        return images;
    } catch (error) {
        console.error(`Error loading ${galleryType} images:`, error);
        return [];
    }
}


async function loadRecentPhotos() {
  const container = document.getElementById("recent-photos");

  try {
    const response = await fetch("https://api.github.com/repos/megachile/datingdoc/contents/images/recent");
    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error(`GitHub API returned non-array: ${JSON.stringify(data)}`);
    }

    const images = data
      .filter(file => file.type === "file" && file.name.match(/\.(jpe?g|png|gif)$/i))
      .slice(0, 3); // Expecting exactly 3

    container.innerHTML = images.map(file => `
      <img src="https://megachile.github.io/datingdoc/images/recent/${file.name}" alt="Recent photo" />
    `).join('');
  } catch (error) {
    console.error("Error loading recent photos:", error);
  }
}


async function displayGallery(galleryType) {
    const container = document.getElementById(`${galleryType}-gallery`);
    const images = await loadGalleryImages(galleryType);

    console.log(`${galleryType} gallery - Total images found:`, images.length);

    const shuffled = images.sort(() => Math.random() - 0.5);

    const containerWidth = container.offsetWidth;
    const minImageWidth = 250;
    const hardCap = 4;

    const imagesThatFit = Math.floor(containerWidth / minImageWidth);
    const totalImagesToShow = Math.min(4, images.length);

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

async function loadInterestCards() {
  console.log("loadInterestCards() called");

  const container = document.getElementById("interests-gallery");
  container.innerHTML = ''; // clear it first

  try {
    const response = await fetch("https://api.github.com/repos/megachile/datingdoc/contents/images/interests");
    const folders = await response.json();

    const interestFolders = folders.filter(item => item.type === "dir");
    const shuffledFolders = interestFolders.sort(() => Math.random() - 0.5).slice(0, 4);
    
    for (const folder of shuffledFolders) {
      const folderName = folder.name;
      const filesResponse = await fetch(folder.url);
      const files = await filesResponse.json();
      
      // Get image file
      const imageFile = files.find(f => f.name.match(/\.(jpe?g|png|gif)$/i));
      
      // Get text file if it exists
      const textFile = files.find(f => f.name === 'text.html' || f.name === 'text.txt');
      
      // Use folder name as-is, just replace hyphens/underscores with spaces
      const title = folderName.replace(/[-_]/g, ' ');
      
      // Build content
      let contentHTML = `<h4>${title}</h4>`;
      
      if (textFile) {
        const textResponse = await fetch(textFile.download_url);
        const text = await textResponse.text();
        // Extract just the <p> content if it exists
        const pMatch = text.match(/<p[^>]*>(.*?)<\/p>/s);
        if (pMatch) {
          contentHTML += `<p>${pMatch[1].trim()}</p>`;
        }
      }
      
      const imageTag = imageFile
        ? `<img src="https://megachile.github.io/datingdoc/images/interests/${folderName}/${imageFile.name}" alt="${title}" />`
        : '';

      const cardHTML = `
        <div class="interest-card">
          ${imageTag}
          <div class="interest-text">${contentHTML}</div>
        </div>
      `;

      container.innerHTML += cardHTML;
    }
  } catch (error) {
    console.error("Error loading interest cards:", error);
  }
}

const TWEET_URLS = [
  "https://twitter.com/alicemazzy/status/1801475410896818270",
  "https://twitter.com/bschne/status/1811012184597545051",
  "https://twitter.com/thinkagainer/status/1841639619659432184",
  "https://twitter.com/hiAndrewQuinn/status/1843009880783028722",
  "https://twitter.com/ScarletAstrorum/status/1860720169015722165",
  "https://twitter.com/adam_kranz/status/1852513827038064866",
  "https://twitter.com/thogge/status/1871578387304812824",
  "https://twitter.com/Ruesavatar/status/1882162603138670862",
  "https://twitter.com/taijitu_sees/status/1898058358852403242",
  "https://twitter.com/911witchery/status/1898558814468579613",
  "https://twitter.com/daniellellecco/status/1908911166748840055",
  "https://twitter.com/SketchesbyBoze/status/1911523502110413274",
  "https://twitter.com/_samantha_joy/status/1912485609760862505",
  "https://twitter.com/taijitu_sees/status/1915103500234797150",
  "https://twitter.com/Romy_Holland/status/1916727710493348166",
  "https://twitter.com/tasshinfogleman/status/1918685888164552785",
  "https://twitter.com/carinmariederry/status/1920913459908104297"
];


function loadRandomTweet() {
  const container = document.getElementById("tweet-container");
  const randomURL = TWEET_URLS[Math.floor(Math.random() * TWEET_URLS.length)];
  container.innerHTML = `
    <blockquote class="twitter-tweet" data-theme="light">
      <a href="${randomURL}"></a>
    </blockquote>
  `;

  if (window.twttr?.widgets) {
    window.twttr.widgets.load(container);
  }
}

window.onload = async function () {
  await displayGallery('life');
  await displayGallery('art');
  await displayGallery('interests');
  loadRecentPhotos();
  loadInterestCards();
  loadRandomTweet(); 
};

const YOUTUBE_API_KEY = 'AIzaSyBIb3kGAIu7YPjy1J7-aQTOGHCcjDmvsNM';
const PLAYLIST_ID = 'PLg1iF_DuBDtcJDdvv1UOA2l3GtOuBPkDA';
let player;
let playlistVideos = [];

// Load YouTube IFrame API
const tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
const firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// Called automatically when YouTube API is ready
function onYouTubeIframeAPIReady() {
  fetchPlaylistVideos();
}

async function fetchPlaylistVideos() {
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${PLAYLIST_ID}&key=${YOUTUBE_API_KEY}`
    );
    
    if (!response.ok) {
      console.error('API Error:', response.status, response.statusText);
      return;
    }
    
    const data = await response.json();
    
    if (data.items) {
      playlistVideos = data.items.map(item => item.snippet.resourceId.videoId);
      loadRandomSong();
    } else {
      console.error('No items in response:', data);
    }
  } catch (error) {
    console.error('Error fetching playlist:', error);
  }
}

function loadRandomSong() {
  if (playlistVideos.length === 0) return;
  
  const randomVideoId = playlistVideos[Math.floor(Math.random() * playlistVideos.length)];
  
  if (player) {
    player.loadVideoById(randomVideoId);
  } else {
    player = new YT.Player('youtube-player', {
      height: '315',
      width: '560',
      videoId: randomVideoId,
      playerVars: {
        'autoplay': 0,
        'modestbranding': 1,
        'rel': 0
      }
    });
  }
}