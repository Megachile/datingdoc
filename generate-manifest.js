const fs = require('fs');
const https = require('https');

const GITHUB_USER = 'Megachile';
const GITHUB_REPO = 'datingdoc';
const MANIFEST_FILE = 'site-manifest.json';
const RATE_LIMIT = 55; // Leave some buffer
const DELAY_MS = 500; // Half second between calls

let apiCallCount = 0;

async function fetchGitHubContent(path) {
    if (apiCallCount >= RATE_LIMIT) {
        console.log(`⚠️  Reached rate limit (${RATE_LIMIT} calls). Stopping here.`);
        console.log(`⏰ Wait 1 hour and run again to continue processing.`);
        return null;
    }

    try {
        apiCallCount++;
        console.log(`🌐 API call ${apiCallCount}/${RATE_LIMIT}: ${path}`);
        
        const url = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${path}`;
        
        const data = await new Promise((resolve, reject) => {
            const req = https.get(url, {
                headers: {
                    'User-Agent': 'manifest-generator'
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

async function fetchTextContent(downloadUrl) {
    if (apiCallCount >= RATE_LIMIT) return null;
    
    try {
        apiCallCount++;
        console.log(`📄 Fetching text content (call ${apiCallCount}/${RATE_LIMIT})`);
        
        const data = await new Promise((resolve, reject) => {
            const req = https.get(downloadUrl, {
                headers: {
                    'User-Agent': 'manifest-generator'
                }
            }, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    if (res.statusCode !== 200) {
                        reject(new Error(`Text fetch error: ${res.statusCode} ${res.statusMessage}`));
                    } else {
                        resolve(body);
                    }
                });
            });
            
            req.on('error', reject);
            req.setTimeout(10000, () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });
        });
        
        await new Promise(resolve => setTimeout(resolve, DELAY_MS));
        
        const pMatch = data.match(/<p[^>]*>(.*?)<\/p>/s);
        return pMatch ? pMatch[1].trim() : data.trim();
    } catch (error) {
        console.error('❌ Error fetching text content:', error.message);
        return null;
    }
}

function loadExistingManifest() {
    if (fs.existsSync(MANIFEST_FILE)) {
        try {
            const existing = JSON.parse(fs.readFileSync(MANIFEST_FILE, 'utf8'));
            console.log(`📁 Loaded existing manifest with ${Object.keys(existing.images?.interests_new || {}).length} interests`);
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
        last_updated: new Date().toISOString().split('T')[0],
        processing_status: {
            total_folders: 0,
            processed_folders: 0,
            remaining_folders: []
        }
    };
}

function saveManifest(manifest) {
    const manifestJson = JSON.stringify(manifest, null, 2);
    fs.writeFileSync(MANIFEST_FILE, manifestJson);
    
    const processed = manifest.processing_status.processed_folders;
    const total = manifest.processing_status.total_folders;
    const remaining = manifest.processing_status.remaining_folders.length;
    
    console.log(`\n✅ Manifest saved!`);
    console.log(`📊 Progress: ${processed}/${total} folders processed`);
    console.log(`📊 Remaining: ${remaining} folders`);
    console.log(`📊 API calls used: ${apiCallCount}/${RATE_LIMIT}`);
    
    if (remaining > 0) {
        console.log(`\n⏰ Wait 1 hour and run again to process remaining ${remaining} folders:`);
        manifest.processing_status.remaining_folders.slice(0, 5).forEach(folder => {
            console.log(`   - ${folder}`);
        });
        if (remaining > 5) console.log(`   ... and ${remaining - 5} more`);
    } else {
        console.log(`\n🎉 All folders processed! Manifest is complete.`);
        delete manifest.processing_status; // Clean up when done
    }
}

async function generateManifest() {
    console.log('🚀 Starting manifest generation...');
    console.log(`📊 Rate limit: ${RATE_LIMIT} API calls per hour\n`);
    
    const manifest = loadExistingManifest();
    
    // Process simple galleries first (only if not already done)
    const simpleGalleries = ['recent', 'life', 'art'];
    
    for (const gallery of simpleGalleries) {
        if (manifest.images[gallery].length === 0 && apiCallCount < RATE_LIMIT) {
            console.log(`📸 Processing ${gallery} gallery...`);
            const files = await fetchGitHubContent(`images/${gallery}`);
            
            if (files) {
                manifest.images[gallery] = files
                    .filter(file => file.type === "file" && file.name.match(/\.(jpe?g|png|gif|webp)$/i))
                    .map(file => file.name);
                
                console.log(`   ✅ Found ${manifest.images[gallery].length} images`);
            }
        }
    }
    
    // Process interests incrementally
    if (apiCallCount < RATE_LIMIT) {
        console.log(`\n🎯 Processing interests...`);
        
        // Get list of all interest folders (if we don't have it yet)
        if (manifest.processing_status.total_folders === 0) {
            const interestsDir = await fetchGitHubContent('images/interests_new');
            
            if (interestsDir) {
                const allFolders = interestsDir
                    .filter(item => item.type === "dir")
                    .map(folder => folder.name);
                
                const alreadyProcessed = Object.keys(manifest.images.interests_new);
                const remaining = allFolders.filter(folder => !alreadyProcessed.includes(folder));
                
                manifest.processing_status.total_folders = allFolders.length;
                manifest.processing_status.processed_folders = alreadyProcessed.length;
                manifest.processing_status.remaining_folders = remaining;
                
                console.log(`   📋 Found ${allFolders.length} total folders`);
                console.log(`   ✅ Already processed: ${alreadyProcessed.length}`);
                console.log(`   ⏳ Remaining: ${remaining.length}`);
            }
        }
        
        // Process remaining folders up to rate limit
        const remainingFolders = [...manifest.processing_status.remaining_folders];
        
        for (const folderName of remainingFolders) {
            if (apiCallCount >= RATE_LIMIT) break;
            
            console.log(`\n   🔍 Processing ${folderName}...`);
            
            const folderContents = await fetchGitHubContent(`images/interests_new/${folderName}`);
            
            if (folderContents) {
                const imageFile = folderContents.find(f => f.name.match(/\.(jpe?g|png|gif|webp)$/i));
                const textFile = folderContents.find(f => f.name === 'text.html' || f.name === 'text.txt');
                
                const interestData = {};
                
                if (imageFile) {
                    interestData.image = imageFile.name;
                    console.log(`      🖼️  Image: ${imageFile.name}`);
                }
                
                if (textFile && apiCallCount < RATE_LIMIT) {
                    const textContent = await fetchTextContent(textFile.download_url);
                    if (textContent) {
                        interestData.text = textContent;
                        console.log(`      📝 Text: ${textContent.substring(0, 50)}...`);
                    }
                }
                
                manifest.images.interests_new[folderName] = interestData;
                manifest.processing_status.processed_folders++;
                
                // Remove from remaining list
                const index = manifest.processing_status.remaining_folders.indexOf(folderName);
                if (index > -1) {
                    manifest.processing_status.remaining_folders.splice(index, 1);
                }
                
                console.log(`      ✅ Complete`);
            }
        }
    }
    
    manifest.last_updated = new Date().toISOString().split('T')[0];
    saveManifest(manifest);
    
    return manifest;
}

// Run the generator
generateManifest().catch(console.error);