
import { google } from 'googleapis';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  const form = new formidable.IncomingForm();
  
  try {
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/gdrive/callback`
    );

    // Set credentials from stored tokens
    oauth2Client.setCredentials(fields.tokens);

    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    
    const response = await drive.files.create({
      requestBody: {
        name: files.video.name,
        mimeType: files.video.type,
        permissions: [{ type: 'anyone', role: 'reader' }]
      },
      media: {
        mimeType: files.video.type,
        body: fs.createReadStream(files.video.path)
      }
    });

    const fileId = response.data.id;
    const videoUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
    
    res.status(200).json({ videoUrl });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
}
