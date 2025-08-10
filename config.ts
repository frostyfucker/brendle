/**
 * ==============================================================================
 * IMPORTANT: Application Configuration
 * ==============================================================================
 *
 * This file contains critical configuration variables for the application.
 * You must replace the placeholder values with your actual credentials
 * for the application to function correctly.
 *
 */

/**
 * Google Client ID for Authentication.
 *
 * IMPORTANT: You must replace this placeholder with your actual Google Client ID.
 * To get a Client ID, follow the instructions on the Google Cloud Console:
 * 1. Go to https://console.cloud.google.com/apis/credentials
 * 2. Click "+ CREATE CREDENTIALS" and select "OAuth client ID".
 * 3. Choose "Web application" for the Application type.
 * 4. Under "Authorized JavaScript origins", add the URL where you are hosting the app (e.g., http://localhost:3000).
 * 5. Copy the "Client ID" provided by Google and paste it here, replacing the placeholder text.
 *
 * The application will NOT function correctly without a valid Client ID.
 */
export const GOOGLE_CLIENT_ID = "260729532435-cuepcp6db9ef87n8f74kroarlmiknpkr.apps.googleusercontent.com";

// --- User Role Management ---
// Add the lowercase email addresses of your users to the appropriate role array.
// Any user not listed here will be assigned the 'guest' role upon login.

/**
 * Administrator emails. Admins have full access to all features.
 */
export const ADMIN_EMAILS = [
    'sizedlife@gmail.com', // Placeholder for Dane Walter
    'frostyf478@gmail.com'     // Roy Hodge (as requested)
];

/**
 * Staff emails. Staff have access to operational and task-management features.
 */
export const STAFF_EMAILS = [
    'luis.r@example.com',   // Placeholder for Luis
    'danny.m@example.com',  // Placeholder for Danny
    'james.p@example.com'   // Placeholder for James
];
