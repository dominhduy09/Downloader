const WEB_APP_URL = "https://downloader-topaz-eta.vercel.app/";

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
    sendResponse({ received: true });
  }
  return true;
});

// Helper function to send the URL to the Web App tab
function sendUrlToWeb(url) {
  chrome.tabs.query({}, (tabs) => {
    // Find a tab that matches the web app URL (either local development or production deploy)
    const existingTab = tabs.find(t => t.url && (t.url.startsWith("http://localhost:5173") || t.url.startsWith("https://downloader-topaz-eta.vercel.app")));

    if (existingTab) {
      // Focus the window and the tab
      chrome.windows.update(existingTab.windowId, { focused: true });
      chrome.tabs.update(existingTab.id, { active: true }, () => {
        // Send message to the tab
        executeSendMessage(existingTab.id, url);
      });
    } else {
      // Probe if localhost:5173 dev server is running
      fetch("http://localhost:5173/", { method: "HEAD", mode: "no-cors" })
        .then(() => {
          openNewTab("http://localhost:5173/", url);
        })
        .catch(() => {
          openNewTab("https://downloader-topaz-eta.vercel.app/", url);
        });
    }
  });
}

// Helper to open a new tab and pipe url on load complete
function openNewTab(targetUrl, url) {
  chrome.tabs.create({ url: targetUrl }, (newTab) => {
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
