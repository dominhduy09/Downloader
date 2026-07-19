# Privacy Policy

**Last Updated:** July 18, 2026  
**Project:** Downloader (`dominhduy09/Downloader`)

Your privacy is highly important to us. This Privacy Policy explains how **Downloader** (including the web application and the companion browser extension) handles, processes, and protects your information.

---

## 📋 Executive Summary

*   **No Personal Data Collection:** We do not collect, store, or sell any personally identifiable information (PII).
*   **No Tracking or Analytics:** There are no third-party tracking scripts, advertising trackers, or telemetry analytics embedded in the application or extension.
*   **Local Processing:** All configurations, language selections, and connectivity checks happen entirely locally on your machine.

---

## 🌐 1. Downloader Web Application (`/web`)

The React-based web application is a client-side interface designed for media link processing.

### Data Processing & Media Links
*   **URL Inputs:** When you input a video or audio link into the extraction form, that link is processed solely to retrieve media metadata. 
*   **Temporary Post-Messages:** Links dispatched from the companion browser extension via standard browser `postMessage` (`DOWNLOAD_URL`) are read by the application instantly in memory and are never persisted to any cloud database by this project.

### Local Storage & Application State
*   **i18n Language Preferences:** Your selected application language (English, Spanish, Vietnamese, French, or Japanese) is saved directly in your browser's local state context to ensure your preferences persist across page reloads.
*   **Connectivity Pinger:** The network status indicator in the footer triggers low-overhead, client-side requests to verify internet connectivity and active service status. This network ping metadata is never logged.

---

## 🔌 2. Companion Browser Extension (`/extension`)

The Google Chrome and Microsoft Edge extension utilizes the **Manifest V3** framework and operates under a minimalist permission model.

### Permissions Used & Justification
*   **`tabs` / `activeTab`:** Used strictly to retrieve the URL of your currently active browser tab when you click the "Open in Downloader Web" button.
*   **Host Permissions:** Used to perform a quick, local `HEAD` connection request to `http://localhost:5173/` to determine if your local development server is active, falling back to the production Vercel deployment if it is offline.

### Data Transmission & Lifecycle
*   **In-Transit Processing:** The extension reads your active tab's URL *only* when explicitly initiated by a user interaction (clicking the extension popup button).
*   **No Background Background Logging:** The background service worker acts purely as a redirection dispatcher. It does not monitor, record, or log browsing history, cache background traffic, or transmit session tokens to external servers.

---

## 🔒 3. Third-Party Hosting & Deployments

*   **Vercel Infrastructure:** The static production build of the web application is hosted on Vercel (`downloader-topaz-eta.vercel.app`). Vercel may collect standard, anonymous server access logs required to securely serve the application assets. For more information, please review the [Vercel Privacy Policy](https://vercel.com/legal/privacy-policy).

---

## 🤝 4. Compliance and Revisions

*   **Manifest V3 Compliance:** This extension is designed to fully satisfy the Google Chrome Web Store Developer Terms and Program Policies regarding Single-Purpose description and Minimal User Data Collection.
*   **Policy Updates:** As features evolve (such as adding individual channel bookmark history or custom dark-mode profiles), any changes to data utilization will be accurately updated in this document.

---

## 📬 5. Contact & Support

If you have any questions or feedback regarding the privacy of your data within this workspace, please contact the author:

*   **Author:** Minh Duy Do
*   **GitHub:** [@dominhduy09](https://github.com/dominhduy09)
*   **Email:** dominhduy09@gmail.com
