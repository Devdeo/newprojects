
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

  try {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/drive.metadata.readonly'
      ],
      prompt: 'consent'
    });

    res.status(200).json({ authUrl });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: error.message });
  }
}
