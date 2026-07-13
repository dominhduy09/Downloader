# Downloader Vercel Deployment Guide

This guide details the step-by-step instructions to deploy the **Downloader** web application to **Vercel**.

---

## 🛠️ Project Settings Check
Because our Vite React project is located in the `web` subdirectory, Vercel needs to be configured to build from that folder instead of the project root.

- **Root Directory**: `web`
- **Framework Preset**: `Vite` (automatic)
- **Build Command**: `npm run build` (or `vite build`)
- **Output Directory**: `dist`

---

## 🚀 Option 1: Deploy via Vercel Dashboard (Recommended)

This connects Vercel directly to your GitHub repository for automatic CD (continuous deployment) on every push.

1. **Push your code to GitHub**:
   Initialize a git repository in the project root (`Downloader/`), commit the files, and push them to a new public or private repository on GitHub.
   ```bash
   git init
   git add .
   git commit -m "Initialize Downloader project"
   # Link and push to your GitHub repo
   ```

2. **Import repository on Vercel**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard).
   - Click **Add New > Project**.
   - Authorize GitHub (if not already done) and click **Import** next to your `Downloader` repository.

3. **Configure Project Settings**:
   - In the **Configure Project** screen, look for **Root Directory**.
   - Click **Edit** next to it, select the `web` folder, and click **Continue**.
   - Vercel will automatically detect the **Vite** preset and fill in the Build Command (`npm run build`) and Output Directory (`dist`).

4. **Deploy**:
   - Click **Deploy**. Vercel will build the React web app and provide you with a live URL (e.g. `downloader-xxx.vercel.app`) in under a minute!

---

## 💻 Option 2: Deploy via Vercel CLI

If you want to deploy directly from your terminal without linking to GitHub.

1. **Install Vercel CLI globally**:
   ```bash
   npm install -g vercel
   ```

2. **Log in to your Vercel account**:
   ```bash
   vercel login
   ```

3. **Navigate to the web directory**:
   ```bash
   cd web
   ```

4. **Trigger Deployment**:
   - Run the development build trigger:
     ```bash
     vercel
     ```
   - Vercel will ask you a few setup questions. Confirm the defaults:
     - Set up and deploy? **Yes**
     - Link to existing project? **No**
     - What's your project's name? **downloader**
     - In which directory is your code located? **./** (since you are already inside the `web` folder)
   - After the preview link is created, run the production build deployment:
     ```bash
     vercel --prod
     ```

---

## 🔗 Extension Integration Note
Once your Vercel deployment completes:
1. Copy your live Vercel URL (e.g. `https://downloader-abc.vercel.app`).
2. If you are developing or testing the Chrome extension locally, update the tab matching rule in the extension's `background.js` from `http://localhost:5173/*` to your new production Vercel URL domain so they can continue to communicate using context script window message pipes.
