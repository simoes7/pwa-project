# Google OAuth Setup Guide

This guide will help you set up Google OAuth for the Smart Queue application.

## 1. Create Google OAuth Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. In the sidebar, go to **APIs & Services** > **Credentials**
4. Click **+ CREATE CREDENTIALS** > **OAuth client ID**
5. Select **Web application** as the application type
6. Configure the following:
   - **Name**: Smart Queue Web App
   - **Authorized JavaScript origins**: `http://localhost:5173`
   - **Authorized redirect URIs**: `http://localhost:3001/auth/google/callback`
7. Click **Create**
8. Copy the **Client ID** and **Client Secret**

## 2. Configure Environment Variables

1. In the `backend` folder, create a `.env` file (copy from `.env.example`)
2. Add your Google OAuth credentials:

```env
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
SESSION_SECRET=your_random_session_secret_here
PORT=3001
NODE_ENV=development
```

## 3. Enable Google+ API

1. In the Google Cloud Console, go to **APIs & Services** > **Library**
2. Search for **Google+ API** and enable it
3. Also enable **Google People API** for better profile information

## 4. Test the Implementation

1. Start the backend server:
   ```bash
   cd backend
   npm start
   ```

2. Start the frontend development server:
   ```bash
   cd frontend
   npm run dev
   ```

3. Navigate to `http://localhost:5173/register`
4. Click the "Continue with Google" button
5. Complete the Google authentication flow
6. You should be redirected back to the application and logged in

## 5. Troubleshooting

### Common Issues:

1. **"redirect_uri_mismatch" error**
   - Make sure the redirect URI in Google Console matches exactly: `http://localhost:3001/auth/google/callback`

2. **"invalid_client" error**
   - Check that your Client ID and Client Secret are correct in the `.env` file

3. **CORS errors**
   - Ensure the frontend URL is added to authorized JavaScript origins in Google Console

4. **Session issues**
   - Make sure your SESSION_SECRET is set to a random string in the `.env` file

### Debug Mode:

Add console logging to the backend OAuth strategy to debug issues:

```javascript
// In server.js, modify the Google strategy callback
console.log('Google OAuth Profile:', profile);
console.log('Email:', profile.emails[0].value);
```

## 6. Production Deployment

For production deployment:

1. Update the authorized origins and redirect URIs in Google Console to your production URLs
2. Set `NODE_ENV=production` in your production environment
3. Use HTTPS URLs for production
4. Consider using JWT tokens instead of URL parameters for better security
5. Set `cookie: { secure: true }` in the session configuration for HTTPS

## 7. Security Notes

- Never commit your `.env` file to version control
- Use a strong, random SESSION_SECRET
- In production, use HTTPS for all OAuth redirects
- Consider implementing additional security measures like CSRF protection
- Regularly rotate your OAuth secrets
