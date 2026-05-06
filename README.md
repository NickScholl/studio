
# ShuttleScore | Badminton Performance Tracker

This project is built with Next.js 15 and Firebase. Follow these steps to resolve 404 errors or build issues.

## 1. Fix "Could not find the next executable"
If you see this error in your terminal, it usually means your local dependencies need a refresh:
1. Run `npm install` in your terminal to ensure Next.js is locally available.
2. Run `firebase experiments:enable webframeworks`.
3. Run `firebase deploy`.

## 2. Authorized Domains
After your site is live (e.g., `shuttlescore.web.app`), you **must** add that URL to your Firebase project:
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Select **Authentication** > **Settings** > **Authorized Domains**.
3. Add your live URL (e.g., `https://shuttlescore.web.app`) to the list.

## 3. Option B: Firebase App Hosting (Easiest)
If you want to avoid CLI errors entirely, use **App Hosting**:
1. Connect your GitHub repository in the Firebase Console under "App Hosting".
2. It will automatically build and deploy your Next.js app on every push.

---
*Built with ❤️ for Badminton Players.*
