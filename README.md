
# ShuttleScore | Badminton Performance Tracker

This is your Next.js application built with Firebase. If you are seeing a "Page Not Found" or "Missing index.html" error, follow these exact steps to fix it.

## 1. Fix the "Missing index.html" Error (CLI Deployment)
If you are deploying using the **Firebase CLI** from your terminal, you must enable the Web Frameworks experiment so Firebase knows how to handle Next.js:

1. **Install/Update Firebase Tools**: 
   `npm install -g firebase-tools`
2. **Enable Web Frameworks**: 
   `firebase experiments:enable webframeworks`
3. **Login**: 
   `firebase login`
4. **Deploy**: 
   `firebase deploy`

**Why this works**: By enabling `webframeworks`, Firebase will look at your `package.json`, see that it's a Next.js app, and automatically build and deploy the server-side logic for you. It will no longer look for a static `index.html` file.

## 2. Option B: Firebase App Hosting (Easiest)
If you don't want to use the CLI, use **App Hosting**. This is the modern, "hands-off" way to host Next.js:
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Select **App Hosting** from the left sidebar.
3. Connect your GitHub repository.
4. Select the `main` branch and click **Finish and Deploy**.
5. It will handle the entire build and setup for you automatically.

## 3. Important: Authorized Domains
After your site is live (e.g., `shuttlescore.web.app`), you **must** add that URL to your Firebase project:
1. Go to **Authentication** > **Settings** > **Authorized Domains**.
2. Add your live URL to the list so Google Login and Email Auth work correctly.

---
*Built with ❤️ for Badminton Players.*
