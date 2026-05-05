
# ShuttleScore | Badminton Performance Tracker

This is your Next.js application built with Firebase. Follow these steps to get it launched!

## 1. Project Map
To run correctly, your project should contain:
- `src/` -> Application logic and Firebase setup
- `public/` -> Static assets (Ensured `index.html` is removed to avoid conflicts)
- `package.json` -> Dependencies and scripts
- `firebase.json` -> Hosting configuration
- `apphosting.yaml` -> App Hosting settings

## 2. Push to GitHub
Open your terminal inside your folder and run:

```bash
git init
git add .
git commit -m "Configure for App Hosting"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

## 3. Launch with Firebase App Hosting (Recommended)
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Select **App Hosting** from the left sidebar.
3. Click **Get Started** and connect your GitHub repository.
4. Select the `main` branch and click **Finish and Deploy**.
5. Firebase will automatically build your Next.js 15 app and provide a live URL.

## 4. Troubleshooting "Page Not Found"
If you see a Firebase 404 page:
- Ensure there is NO `index.html` file inside your `public/` folder.
- Ensure you have connected your repository via **App Hosting**, not just standard Hosting.

---
*Built with ❤️ for Badminton Players.*
