# ShuttleScore | Badminton Performance Tracker

This is a Next.js application designed to track badminton match statistics. It uses Firebase for Authentication and Firestore for data storage.

## Deployment Instructions (Firebase App Hosting)

Firebase App Hosting is the recommended way to deploy this Next.js app. It automatically builds and deploys your site whenever you push to GitHub.

### 1. Push to GitHub
If you haven't already, initialize a git repository and push your code to GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 2. Connect to Firebase
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Select your project.
3. Click on **App Hosting** in the left sidebar.
4. Click **Get Started** and connect your GitHub repository.
5. Follow the prompts to set up the build settings (defaults are usually fine for Next.js).

### 3. Environment Variables
In the Firebase App Hosting dashboard for your app, ensure you add your Firebase configuration as environment variables if they are not already detected:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

## Local Development
Run the development server:
```bash
npm run dev
```
