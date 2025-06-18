const CACHE_DURATION = 24 * 3600000; // 24 hours

let siteData = null;

// Load the entire site manifest in one HTTP request (not GitHub API)
async function loadSiteManifest() {
    const cacheKey = 'site-manifest';
    
    const useCache = true;
    
    if (useCache) {
        // Check cache first
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
            try {
                const { data, timestamp } = JSON.parse(cached);
                if (Date.now() - timestamp < CACHE_DURATION) {
                    siteData = data;
                    return data;
                }
            } catch (e) {
                console.warn('Cache parse failed, fetching fresh manifest');
            }
        }
    }

    try {
        console.log('Fetching site manifest...');
        const response = await fetch(
            `https://megachile.github.io/datingdoc/site-manifest.json?t=${Date.now()}`
        );
        
        if (!response.ok) {
            throw new Error(`Manifest fetch error: ${response.status}`);
        }
        
        const data = await response.json();
        siteData = data;
        
        // Cache the manifest (only if useCache is true)
        if (useCache) {
            sessionStorage.setItem(cacheKey, JSON.stringify({
                data: data,
                timestamp: Date.now()
            }));
        }
        
        console.log('Site manifest loaded and cached');
        console.log(`Loaded ${Object.keys(data.images?.interests_new || {}).length} interests`);
        console.log(`Loaded ${data.images?.life?.length || 0} life photos`);
        console.log(`Loaded ${data.images?.art?.length || 0} art photos`);
        console.log(`Loaded ${data.images?.recent?.length || 0} recent photos`);
        
        return data;
    } catch (error) {
        console.error('Error loading site manifest:', error);
        return null;
    }
}

async function loadRecentPhotos() {
    if (!siteData) {
        console.warn('No site data loaded for recent photos');
        return;
    }
    
    const container = document.getElementById("recent-photos");
    const images = siteData.images.recent?.slice(0, 3) || [];

    if (images.length === 0) {
        container.innerHTML = '<p>No recent photos available</p>';
        return;
    }

    container.innerHTML = images.map(file => `
        <img src="https://megachile.github.io/datingdoc/images/recent/${file}" alt="Recent photo" />
    `).join('');
    
    console.log('Recent photos loaded:', images.length);
}

async function displayGallery(galleryType) {
    if (!siteData) {
        console.warn(`No site data loaded for ${galleryType} gallery`);
        return;
    }
    
    const container = document.getElementById(`${galleryType}-gallery`);
    const images = siteData.images[galleryType] || [];

    console.log(`${galleryType} gallery - Total images available:`, images.length);

    if (images.length === 0) {
        container.innerHTML = `<p>No ${galleryType} images available</p>`;
        return;
    }

    const shuffled = [...images].sort(() => Math.random() - 0.5);
    const imagesToShow = shuffled.slice(0, Math.min(4, images.length));

    container.innerHTML = imagesToShow.map(img => 
        `<img src="https://megachile.github.io/datingdoc/images/${galleryType}/${img}" 
              alt="${galleryType} image" 
              onerror="this.style.border='2px solid red'; this.alt='Image not found: ${img}'">`
    ).join('');

    console.log(`${galleryType} gallery - Displayed:`, imagesToShow.length);
}

async function shuffleGallery(galleryType) {
    console.log(`Shuffling ${galleryType} gallery...`);
    await displayGallery(galleryType);
}

async function loadInterestCards() {
    if (!siteData) {
        console.warn('No site data loaded for interest cards');
        return;
    }
    
    console.log("Loading interest cards...");
    const container = document.getElementById("interests-gallery");
    container.innerHTML = '';

    const interests = siteData.images.interests_new || {};
    const interestKeys = Object.keys(interests);
    
    if (interestKeys.length === 0) {
        container.innerHTML = '<p>No interests available</p>';
        return;
    }
    
    const shuffledKeys = interestKeys.sort(() => Math.random() - 0.5).slice(0, 4);
    console.log(`Showing interests:`, shuffledKeys);
    
    for (const key of shuffledKeys) {
        const interest = interests[key];
        const title = key.replace(/[-_]/g, ' ');
        
        const imageTag = interest.image
            ? `<img src="https://megachile.github.io/datingdoc/images/interests_new/${key}/${interest.image}" alt="${title}" />`
            : '';

        const cardHTML = `
            <div class="interest-card">
                ${imageTag}
                <div class="interest-text">
                    <h4>${title}</h4>
                    <p>${interest.text || ''}</p>
                </div>
            </div>
        `;

        container.innerHTML += cardHTML;
    }
    
    console.log(`Interest cards loaded: ${shuffledKeys.length}`);
}

function clearCache() {
    sessionStorage.removeItem('site-manifest');
    siteData = null;
    console.log('Manifest cache cleared!');
}

// Tweet functionality (unchanged)
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

// YouTube functionality (unchanged)
const YOUTUBE_API_KEY = 'AIzaSyBIb3kGAIu7YPjy1J7-aQTOGHCcjDmvsNM';
const PLAYLIST_ID = 'PLg1iF_DuBDtcJDdvv1UOA2l3GtOuBPkDA';
let player;
let playlistVideos = [];

const tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
const firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

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
    
    // Check if video fails to load and try another one
    setTimeout(() => {
      try {
        const state = player.getPlayerState();
        // -1 = unstarted/failed, 5 = video cued but can't play
        if (state === -1 || state === 5) {
          console.log('Video failed to load, trying another...');
          loadRandomSong(); // Try a different random video
        }
      } catch (error) {
        console.log('Error checking player state, trying another video...');
        loadRandomSong();
      }
    }, 3000); // Wait 3 seconds to check if video loaded
    
  } else {
    player = new YT.Player('youtube-player', {
      height: '315',
      width: '560',
      videoId: randomVideoId,
      playerVars: {
        'autoplay': 0,
        'modestbranding': 1,
        'rel': 0
      },
      events: {
        'onError': function(event) {
          console.log('YouTube player error, trying another video...');
          loadRandomSong(); // Try a different video on error
        },
        'onReady': function(event) {
          // Check if the initial video failed to load
          setTimeout(() => {
            try {
              const state = player.getPlayerState();
              if (state === -1 || state === 5) {
                console.log('Initial video failed to load, trying another...');
                loadRandomSong();
              }
            } catch (error) {
              console.log('Error checking initial player state');
            }
          }, 2000);
        }
      }
    });
  }
}

window.onload = async function () {
  console.log('Loading site...');
  
  // Load manifest first (1 HTTP request total to GitHub Pages)
  await loadSiteManifest();
  
  if (siteData) {
    // Then load all content with zero additional API calls
    console.log('Loading galleries from manifest...');
    await displayGallery('life');
    await displayGallery('art');
    loadRecentPhotos();
    loadInterestCards();
    console.log('All galleries loaded from manifest!');
  } else {
    console.error('Failed to load site manifest - galleries will not work');
  }
  
  loadRandomTweet();
};