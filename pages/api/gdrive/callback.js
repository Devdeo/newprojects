
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
  
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    
    res.redirect('/dashboard?auth=success');
  } catch (error) {
    console.error('Error:', error);
    res.redirect('/dashboard?auth=error');
  }
}
