# HotelBrendle Orchestrator

**Your AI-Powered Hotel Management Dashboard**

Welcome! HotelBrendle Orchestrator is a sophisticated, all-in-one dashboard designed for modern hotel management. It leverages the power of Google's Gemini AI to streamline operations, enhance guest services, and provide actionable insights at a glance.

This application is built with React, TypeScript, and Tailwind CSS, and it runs entirely in your browser.

## Features

-   **AI Hotel Pulse:** A live, interactive command center for your entire hotel! See a floor-plan overview, get real-time room statuses, and receive predictive alerts to solve issues before they happen.
-   **AI Daily Briefing:** Start the day with an intelligent summary of key hotel metrics.
-   **AI Task Suggestions:** Let the AI recommend prioritized tasks for your staff based on your daily directive.
-   **Video-Powered Maintenance Reporter:** Staff can record a video of an issue, and our AI will analyze it to auto-generate a detailed work order.
-   **Personalized Guest Services:** Instantly generate warm, personalized welcome messages for arriving guests.
-   **Instant Feedback Analysis:** Paste guest reviews to get an immediate summary of positives and negatives.
-   **AI Local Guide:** Provide guests with tailored recommendations for local attractions, restaurants, and sights.
-   **Sleek & Responsive UI:** A beautiful, modern interface with multiple themes that looks great on any device.

## Setup and Configuration

This guide will walk you through setting up the application to run locally.

### 1. Prerequisites

*   A Google Account
*   Node.js and npm (Recommended for local server)
*   A code editor like VS Code

### 2. Getting a Gemini API Key

The application's AI features are powered by Google Gemini.

1.  Go to [Google AI Studio](https://aistudio.google.com/).
2.  Click on **"Get API key"**.
3.  Create a new API key in a new or existing Google Cloud project.
4.  **Important:** This application is configured to get the API key from `process.env.API_KEY`. You must ensure this environment variable is set in the environment where you run the app.

### 3. Google Sign-In & Drive Configuration (CRITICAL STEP)

User authentication and the "Save to Drive" feature depend on Google's OAuth 2.0 service.

#### A. Create your OAuth Client ID

1.  Navigate to the [Google Cloud Console Credentials page](https://console.cloud.google.com/apis/credentials).
2.  Make sure you have selected the same project where you created your Gemini API key.
3.  Click **"+ CREATE CREDENTIALS"** and select **"OAuth client ID"**.
4.  Set the **Application type** to **"Web application"**.
5.  Give it a descriptive name (e.g., "Hotel Brendle Web Client").
6.  **This is the most important step:** Add authorized URLs under **"Authorized JavaScript origins"**.
    *   If you are running the app locally using the `npm run serve` command, add `http://localhost:3000`.
    *   **If you get an `origin_mismatch` error,** Google is telling you the URL of your app is not trusted. Copy the `origin` URL from the error details (it looks like `https://*.usercontent.goog`) and add it to this list. You can add multiple origins.
7.  Click **"Create"**. A popup will appear with your Client ID.

#### B. Enable the Google Drive API

1.  In the Google Cloud Console, go to the [API Library](https://console.cloud.google.com/apis/library).
2.  Search for **"Google Drive API"**.
3.  Click on it and **Enable** it for your project. This is required for the "Save to Drive" feature.

#### C. Update the Configuration File

1.  Open the `config.ts` file in the project.
2.  Copy your **Client ID** from the Google Cloud Console.
3.  Paste it into the `GOOGLE_CLIENT_ID` variable, replacing the placeholder.
    ```typescript
    // In config.ts
    export const GOOGLE_CLIENT_ID = "YOUR_CLIENT_ID_GOES_HERE.apps.googleusercontent.com";
    ```
4.  While you're in `config.ts`, update the `ADMIN_EMAILS` and `STAFF_EMAILS` arrays with the correct user emails for role management.

### 4. Running the Application Locally

You cannot just open `index.html` in your browser from the filesystem due to browser security policies (CORS). You must use a local web server.

1.  Open your terminal in the project directory.
2.  Install the server dependency: `npm install`
3.  Start the server: `npm run serve`
4.  Open your web browser and navigate to `http://localhost:3000`.

---

Your HotelBrendle Orchestrator should now be running with all features enabled. Enjoy!
