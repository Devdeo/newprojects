
import { google } from 'googleapis';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, '');

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${baseUrl}/api/gdrive/callback`
);

export default async function handler(req, res) {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !baseUrl) {
    return res.status(500).json({ error: 'Missing required environment variables' });
  }

  const { code } = req.query;
  
  if (!code) {
    return res.redirect('/dashboard?error=no_code');
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Store tokens in session or cookies if needed
    const redirectUrl = new URL('/dashboard', baseUrl);
    redirectUrl.searchParams.set('auth', 'success');
    
    return res.redirect(redirectUrl.toString());
  } catch (error) {
    console.error('OAuth error:', error.message, error.stack);
    const errorMessage = encodeURIComponent(error.message || 'Authentication failed');
    return res.redirect(`/dashboard?error=${errorMessage}`);
  }
}
