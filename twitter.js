// Twitter Content Script
// Handles capturing liked and retweeted tweets

console.log("Social Transcription: Twitter script loaded");

// Function to find the tweet container
function findTweetContainer(element) {
    return element.closest('article[data-testid="tweet"]');
}

// Function to extract text from tweet
function extractTweetText(tweetArticle) {
    if (!tweetArticle) return null;
    const textElement = tweetArticle.querySelector('div[data-testid="tweetText"]');
    return textElement ? textElement.innerText : "No text found (media only?)";
}

// Global click listener to capture interactions
document.addEventListener('click', (event) => {
    // Check if the click target is within a Like or Retweet button
    const likeButton = event.target.closest('[data-testid="like"]');
    const retweetButton = event.target.closest('[data-testid="retweet"]');

    let action = null;
    if (likeButton) {
        action = "Liked";
    } else if (retweetButton) {
        action = "Retweeted";
    }

    if (action) {
        const tweetArticle = findTweetContainer(event.target);
        if (tweetArticle) {
            const tweetText = extractTweetText(tweetArticle);
            console.log(`Social Transcription: ${action} tweet:`, tweetText);

            // Store the interaction
            chrome.storage.local.get(['tweets'], (result) => {
                const tweets = result.tweets || [];
                // Avoid duplicates if clicked multiple times rapidly? 
                // We can use timestamp + text hash, or just append distinct.
                // For MVP, just append.
                tweets.unshift({
                    action: action,
                    text: tweetText,
                    timestamp: new Date().toLocaleString(),
                    url: window.location.href // might be thread URL, not specific tweet URL
                });
                chrome.storage.local.set({ tweets: tweets.slice(0, 20) });
            });
        }
    }
}, true); // Use capture phase to ensure we catch it before bubbling stops
