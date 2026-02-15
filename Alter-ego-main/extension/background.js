// Background script for handling events and storage
console.log("Background script loaded.");

chrome.runtime.onInstalled.addListener(() => {
    console.log("Extension installed.");
});
