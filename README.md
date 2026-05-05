
# ShuttleScore | Badminton Performance Tracker

This is your Next.js application built with Firebase. Follow these steps to get it launched!

## 1. Project Map
To run correctly, your project contains:
- `src/` -> Application logic and Firebase setup
- `public/` -> Static assets (Ensured `index.html` is removed to avoid conflicts)
- `package.json` -> Dependencies and scripts
- `firebase.json` -> Configuration for standard Firebase Hosting
- `apphosting.yaml` -> Configuration for Firebase App Hosting

## 2. Option A: Standard Firebase Hosting (Manual CLI)
If you want to deploy from your own computer using the Firebase CLI:
1. Install the CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize (if not done): `firebase init hosting` (Select "Next.js" when asked)
4. Deploy: `firebase deploy`

## 3. Option B: Firebase App Hosting (Automatic - Recommended)
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Select **App Hosting** from the left sidebar.
3. Connect your GitHub repository.
4. Select the `main` branch and click **Finish and Deploy**.

## 4. Important: Authorized Domains
Whether using Option A or B, you **must** add your live URL to the Firebase Console:
1. Go to **Authentication** > **Settings** > **Authorized Domains**.
2. Add your project's URL (e.g., `your-project.web.app`).

---
*Built with ❤️ for Badminton Players.*
