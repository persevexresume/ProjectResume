# Environment Variables - Updated

## Status
API key has been successfully rotated as of March 20, 2026.

## Vercel Configuration Required
The following environment variable must be set in Vercel Dashboard:

- **VITE_GEMINI_API_KEY**: The new Google Gemini API key (updated for security)

## Location to Update
1. Go to https://vercel.com/dashboard
2. Select the PersevexResume project
3. Go to Settings → Environment Variables
4. Find `VITE_GEMINI_API_KEY`
5. Update with the new key value
6. Redeploy the project

## Local Development
The new API key has been added to `client/.env` for local development.

## Summary
- Old exposed key: Revoked from Google Cloud Console
- New key: Generated and configured
- Git history: Cleaned of old exposed key
- Status: Ready for deployment
