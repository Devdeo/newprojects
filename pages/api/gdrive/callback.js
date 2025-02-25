
import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXT_PUBLIC_BASE_URL}/api/gdrive/callback`
);

export default async function handler(req, res) {
  const { code } = req.query;
  
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    
    // Store tokens in session or database
    // Redirect back to dashboard
    res.redirect('/dashboard?auth=success');
  } catch (error) {
    console.error('Error:', error);
    res.redirect('/dashboard?auth=error');
  }
}
