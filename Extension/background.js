/**
 * Background Service Worker for Pass Guard Extension
 */

chrome.runtime.onInstalled.addListener(() => {
    console.log('Pass Guard Extension installed');
});

// We can handle global events here if needed
