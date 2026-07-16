let currentUrl = "";

document.addEventListener("DOMContentLoaded", () => {
  const tabUrlEl = document.getElementById("tab-url");
  const btnQuick = document.getElementById("btn-quick");
  const btnOpenWeb = document.getElementById("btn-open-web");
  const statusContainer = document.getElementById("status-container");
  const statusText = document.getElementById("status-text");
  const errorMsg = document.getElementById("error-msg");
  const results = document.getElementById("results");
  const videoThumb = document.getElementById("video-thumb");
  const videoTitle = document.getElementById("video-title");
  const videoAuthor = document.getElementById("video-author");
  const formatsList = document.getElementById("formats-list");

  // Get active tab URL
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    if (activeTab && activeTab.url) {
      const url = activeTab.url;
      // Allow only http and https URLs
      if (url.startsWith("http://") || url.startsWith("https://")) {
        currentUrl = url;
        tabUrlEl.textContent = url;
        btnQuick.disabled = false;
        btnOpenWeb.disabled = false;
      } else {
        tabUrlEl.textContent = "Unsupported page (must be http/https)";
        tabUrlEl.style.color = "var(--danger)";
      }
    } else {
      tabUrlEl.textContent = "No active tab detected";
    }
  });

  // Action 1: Quick Download in Popup
  btnQuick.addEventListener("click", () => {
    if (!currentUrl) return;

    // Reset UI state
    statusContainer.style.display = "block";
    statusText.textContent = "Extracting video metadata...";
    errorMsg.style.display = "none";
    results.style.display = "none";
    formatsList.innerHTML = "";

    fetch("https://gendownload.com/api/extract", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url: currentUrl }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Server returned status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        statusContainer.style.display = "none";
        
        if (!data || (!data.formats && !data.title)) {
          throw new Error("No download options found for this link.");
        }

        // Show results
        results.style.display = "flex";
        videoThumb.src = data.thumbnail || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200";
        videoTitle.textContent = data.title || "Video Download";
        videoTitle.title = data.title || "";
        videoAuthor.textContent = data.author ? `by ${data.author}` : `${data.source || "unknown source"}`;

        if (data.formats && data.formats.length > 0) {
          data.formats.forEach((format) => {
            const btn = document.createElement("a");
            btn.className = "format-btn";
            btn.href = format.url;
            btn.target = "_blank";
            btn.rel = "noopener noreferrer";

            const labelStr = format.label || (format.type === "audio" ? "Audio" : "Video");
            const extStr = format.ext ? format.ext.toUpperCase() : "";
            const sizeStr = format.filesize ? formatBytes(format.filesize) : "";

            btn.innerHTML = `
              <div class="format-left">
                <span class="format-badge">${format.type}</span>
                <span class="format-quality" style="font-weight: 500;">${labelStr} (${extStr})</span>
              </div>
              <div class="format-right">
                ${sizeStr ? `<span class="format-size">${sizeStr}</span>` : ""}
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              </div>
            `;
            formatsList.appendChild(btn);
          });
        } else {
          const noFormats = document.createElement("div");
          noFormats.style.color = "var(--text-muted)";
          noFormats.style.fontSize = "12px";
          noFormats.style.textAlign = "center";
          noFormats.style.padding = "10px";
          noFormats.textContent = "No downloadable formats returned.";
          formatsList.appendChild(noFormats);
        }
      })
      .catch((err) => {
        statusContainer.style.display = "none";
        errorMsg.style.display = "block";
        errorMsg.textContent = `Error: ${err.message}`;
      });
  });

  // Action 2: Open in Web App and send URL
  btnOpenWeb.addEventListener("click", () => {
    if (!currentUrl) return;
    btnOpenWeb.disabled = true; // Prevent double clicks
    chrome.runtime.sendMessage({ action: "send_url", url: currentUrl }, () => {
      // Allow service worker to process message fully before closing popup window
      setTimeout(() => {
        window.close();
      }, 100);
    });
  });

  // Helper to format bytes to human readable form
  function formatBytes(bytes) {
    if (!bytes || isNaN(bytes)) return "";
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  }
});
