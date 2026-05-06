
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

### 3. Cloudflare Pages + Firebase (Hybrid Setup)
If you want to host the UI on Cloudflare but keep using your Firebase backend:
1. Push your code to a GitHub repository.
2. In the **Cloudflare Dashboard**, go to **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
3. Select your repository.
4. For "Build settings", select **Next.js**.
5. **Crucial Step**: Go to the **Environment Variables** tab in your Cloudflare project settings and add your Firebase config keys (API_KEY, AUTH_DOMAIN, etc.) if you are using process.env, or ensure your `src/firebase/config.ts` is committed with the correct values.
6. Click **Save and Deploy**. Cloudflare will host the frontend, and the app will communicate with Firebase via the client SDK as it does now.

---
*Built with ❤️ for Badminton Players.*
