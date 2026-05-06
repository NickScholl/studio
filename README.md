
# ShuttleScore | Badminton Performance Tracker

This project is built with Next.js 15 and Firebase. Follow these steps to deploy your site.

## 🚀 Deployment Options

### 1. Firebase (Standard Hosting)
The project is already configured with `firebase.json`.
1. Ensure you have the Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Deploy: `firebase deploy`

### 2. Firebase App Hosting (Easiest & Recommended)
If you want automatic deployments on every push:
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Select **App Hosting** and connect your GitHub repository.
3. It will automatically build and deploy your Next.js app on every push to your main branch.

### 3. Cloudflare Pages
To deploy via Cloudflare:
1. Push your code to a GitHub/GitLab repository.
2. In the **Cloudflare Dashboard**, go to **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
3. Select your repository.
4. For "Build settings", Cloudflare will auto-detect **Next.js**. 
5. Click **Save and Deploy**.

---
*Built with ❤️ for Badminton Players.*
