// YouTube Content Script
console.log("Social Transcription: YouTube script loaded");

let currentVideoId = null;

// Function to extract video ID from URL
function getVideoId(url) {
    const urlParams = new URLSearchParams(new URL(url).search);
    return urlParams.get('v');
}

// Function to handle video navigation
function handleNavigation() {
    const videoId = getVideoId(window.location.href);
    if (videoId && videoId !== currentVideoId) {
        currentVideoId = videoId;
        console.log(`Social Transcription: Detected video ${videoId}`);

        // Wait a bit for title to update
        setTimeout(() => {
            const videoTitle = document.title.replace(' - YouTube', '');
            const videoUrl = window.location.href;

            chrome.storage.local.get(['captions'], (result) => {
                const captions = result.captions || [];
                // Check if we already have this video
                if (!captions.some(c => c.videoId === videoId)) {
                    captions.unshift({
                        videoId: videoId,
                        title: videoTitle,
                        url: videoUrl,
                        timestamp: new Date().toLocaleString()
                    });
                    chrome.storage.local.set({ captions: captions.slice(0, 10) });
                    console.log("Video metadata saved.");
                }
            });
        }, 2000);
    }
}

// YouTube is an SPA, so we need to watch for navigation events
window.addEventListener('yt-navigate-finish', handleNavigation);

// Also check on initial load
if (window.location.href.includes('watch?v=')) {
    handleNavigation();
}
