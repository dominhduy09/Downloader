const WEB_APP_URL = "http://localhost:5173/";

// Create the context menu item when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "send-to-downloader",
    title: "Send link to Downloader",
    contexts: ["link"]
  });
});

// Listen for context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "send-to-downloader") {
    const linkUrl = info.linkUrl;
    if (linkUrl) {
      sendUrlToWeb(linkUrl);
    }
  }
});

// Listen for messages from popup.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "send_url") {
    sendUrlToWeb(message.url);
  }
});

// Helper function to send the URL to the Web App tab
function sendUrlToWeb(url) {
  chrome.tabs.query({}, (tabs) => {
    // Find a tab that matches the web app URL
    const existingTab = tabs.find(t => t.url && t.url.startsWith("http://localhost:5173"));

    if (existingTab) {
      // Focus the window and the tab
      chrome.windows.update(existingTab.windowId, { focused: true });
      chrome.tabs.update(existingTab.id, { active: true }, () => {
        // Send message to the tab
        executeSendMessage(existingTab.id, url);
      });
    } else {
      // Open web app in a new tab
      chrome.tabs.create({ url: WEB_APP_URL }, (newTab) => {
        const listener = (tabId, changeInfo) => {
          if (tabId === newTab.id && changeInfo.status === "complete") {
            // Remove the listener once loaded
            chrome.tabs.onUpdated.removeListener(listener);
            // Give React app a short window (600ms) to mount event listeners
            setTimeout(() => {
              executeSendMessage(newTab.id, url);
            }, 600);
          }
        };
        chrome.tabs.onUpdated.addListener(listener);
      });
    }
  });
}

// Function injected into the tab to post the message
function executeSendMessage(tabId, url) {
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    func: (urlToSend) => {
      window.postMessage({ type: "DOWNLOAD_URL", url: urlToSend }, "*");
    },
    args: [url]
  }).catch((err) => {
    console.error("Failed to inject script into tab:", err);
  });
}
