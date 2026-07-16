# Contributing to Downloader

Thank you for your interest in contributing to **Downloader**! We appreciate your help in making this video & audio extractor and companion browser extension even better.

Please take a moment to review this document before submitting your issues or pull requests.

## 📋 Code of Conduct

By participating in this project, you agree to maintain a respectful, welcoming, and collaborative environment. Be kind to other contributors and respect differing viewpoints.

## 🐛 Reporting Bugs

If you find a bug, please help us by opening an issue:
1. **Search existing issues** to make sure the bug hasn't already been reported.
2. **Provide a clear description** of the bug and how to reproduce it.
3. **Include environment details** (browser version, OS, extension version).
4. **Attach screenshots or console error logs** if applicable.

## 💡 Suggesting Features

We welcome new ideas! If you have a feature request:
1. Check if the feature is already planned or discussed in the issues.
2. Open a new issue describing the feature, its use case, and how it benefits users.

## 🛠️ Development Setup

Follow these steps to set up your local development environment:

### Web Application
1. Navigate to the web folder: `cd web`
2. Install dependencies: `npm install`
3. Run the development server: `npm run dev`
4. Open your browser to `http://localhost:5173/`

### Chrome / Edge Extension
1. Open your browser extension manager: `edge://extensions/` or `chrome://extensions/`
2. Toggle on **Developer Mode**.
3. Click **Load unpacked** and select the `extension/` directory.

## 🎨 Coding Standards

### Web Client (React + Tailwind CSS)
- Write reusable, semantic React components.
- Keep Tailwind utility classes clean and organized.
- Preserve internationalization: Add any new text strings to `web/src/translations.js` across all 5 languages (EN, ES, VI, FR, JA) and call them using the `t()` helper.

### Browser Extension (Manifest V3)
- Ensure all popup styles align with the website style guidelines (Inter font family, brand colors, custom spacing).
- Write clean service worker scripts (`background.js`) utilizing secure Chrome Extensions APIs.
- Keep background communication race-condition-free by utilizing messaging callbacks.

## 🚀 Submitting Pull Requests

1. **Fork the repository** and create a new branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. **Implement your changes** and verify they compile successfully (`npm run build`).
3. **Commit your changes** with descriptive commit messages:
   ```bash
   git commit -m "feat: add support for custom format extraction"
   ```
4. **Push to your branch**:
   ```bash
   git push origin feature/your-feature-name
   ```
5. **Open a Pull Request** against our `main` branch. Provide a detailed description of the changes, verification results, and any related issue references.

Thank you for contributing!
