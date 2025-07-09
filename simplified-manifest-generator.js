cat << 'EOL' > simplified-manifest-generator.js
const fs = require('fs');
const https = require('https');

const GITHUB_USER = 'Megachile';
const GITHUB_REPO = 'datingdoc';
const MANIFEST_FILE = 'site-manifest.json';
const RATE_LIMIT = 10; // Much lower since we're only checking 2 folders
const DELAY_MS = 500; // Half second between calls

let apiCallCount = 0;

async function fetchGitHubContent(path) {
    if (apiCallCount >= RATE_LIMIT) {
        console.log(`⚠️  Reached rate limit (${RATE_LIMIT} calls). Stopping here.`);
        return null;
    }

    try {
        apiCallCount++;
        console.log(`🌐 API call ${apiCallCount}/${RATE_LIMIT}: ${path}`);
        
        const url = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${path}`;
        
        const data = await new Promise((resolve, reject) => {
            const req = https.get(url, {
                headers: {
                    'User-Agent': 'simplified-manifest-generator'
                }
            }, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    if (res.statusCode !== 200) {
                        reject(new Error(`GitHub API error: ${res.statusCode} ${res.statusMessage}`));
                    } else {
                        try {
                            resolve(JSON.parse(body));
                        } catch (parseError) {
                            reject(new Error(`JSON parse error: ${parseError.message}`));
                        }
                    }
                });
            });
            
            req.on('error', reject);
            req.setTimeout(10000, () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });
        });
        
        // Add delay to be nice to the API
        await new Promise(resolve => setTimeout(resolve, DELAY_MS));
        
        return data;
    } catch (error) {
        console.error(`❌ Error fetching ${path}:`, error.message);
        return null;
    }
}

function loadExistingManifest() {
    if (fs.existsSync(MANIFEST_FILE)) {
        try {
            const existing = JSON.parse(fs.readFileSync(MANIFEST_FILE, 'utf8'));
            console.log(`📁 Loaded existing manifest with ${Object.keys(existing.images?.interests_new || {}).length} interests preserved`);
            return existing;
        } catch (error) {
            console.log('⚠️  Could not parse existing manifest, starting fresh');
        }
    }
    
    return {
        images: {
            recent: [],
            life: [],
            art: [],
            interests_new: {}
        },
        last_updated: new Date().toISOString().split('T')[0]
    };
}

function saveManifest(manifest) {
    const manifestJson = JSON.stringify(manifest, null, 2);
    fs.writeFileSync(MANIFEST_FILE, manifestJson);
    
    console.log(`\n✅ Manifest updated!`);
    console.log(`📊 Recent photos: ${manifest.images.recent.length}`);
    console.log(`📊 Life photos: ${manifest.images.life.length}`);
    console.log(`📊 Art photos: ${manifest.images.art?.length || 0} (preserved)`);
    console.log(`📊 Interests: ${Object.keys(manifest.images.interests_new || {}).length} (preserved)`);
    console.log(`📊 API calls used: ${apiCallCount}/${RATE_LIMIT}`);
    console.log(`🎉 Recent and life galleries updated!`);
}

async function generateSimpleManifest() {
    console.log('🚀 Starting targeted manifest update...');
    console.log(`📊 Refreshing only 'recent' and 'life' galleries (preserving all other data)\n`);
    
    const manifest = loadExistingManifest();
    
    // Process only recent and life galleries
    const targetGalleries = ['recent', 'life'];
    
    for (const gallery of targetGalleries) {
        if (apiCallCount < RATE_LIMIT) {
            console.log(`📸 Processing ${gallery} gallery...`);
            const files = await fetchGitHubContent(`images/${gallery}`);
            
            if (files) {
                const imageFiles = files
                    .filter(file => file.type === "file" && file.name.match(/\.(jpe?g|png|gif|webp)$/i))
                    .map(file => file.name);
                
                manifest.images[gallery] = imageFiles;
                console.log(`   ✅ Found ${imageFiles.length} images`);
                
                if (imageFiles.length > 0) {
                    console.log(`   📋 Images: ${imageFiles.slice(0, 3).join(', ')}${imageFiles.length > 3 ? '...' : ''}`);
                }
            }
        }
    }
    
    manifest.last_updated = new Date().toISOString().split('T')[0];
    saveManifest(manifest);
    
    return manifest;
}

// Run the simplified generator
generateSimpleManifest().catch(console.error);
EOL