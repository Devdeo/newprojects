
import { exec } from 'child_process';
import { tmpdir } from 'os';
import { join } from 'path';
import { promises as fs } from 'fs';
import formidable from 'formidable';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = new formidable.IncomingForm();
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    const { title, hours, streamKey } = fields;
    const video = files.video;

    if (!video || !streamKey) {
      return res.status(400).json({ error: 'Video file and stream key are required' });
    }

    // Create a temporary file for streaming
    const tempOutput = join(tmpdir(), `stream-${Date.now()}.mp4`);
    
    // Copy video to temp location and start streaming
    await fs.copyFile(video.filepath, tempOutput);
    
    const rtmpUrl = `rtmp://a.rtmp.youtube.com/live2/${streamKey}`;
    
    // Start FFmpeg process for streaming
    const ffmpegProcess = exec(
      `ffmpeg -re -stream_loop -1 -i "${tempOutput}" ` +
      `-c:v libx264 -preset ultrafast -b:v 3000k ` +
      `-maxrate 3000k -bufsize 6000k ` +
      `-pix_fmt yuv420p -g 50 -c:a aac -b:a 160k ` +
      `-ac 2 -ar 44100 -f flv "${rtmpUrl}"`,
      (error) => {
        if (error) {
          console.error('FFmpeg error:', error);
        }
      }
    );

    // Cleanup temp file when streaming ends
    ffmpegProcess.on('exit', () => {
      fs.unlink(tempOutput).catch(console.error);
    });

    // Create task record
    const task = {
      id: Date.now().toString(),
      title,
      hours,
      key: streamKey,
      status: 'active',
      videoUrl: tempOutput
    };

    return res.status(200).json(task);
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: 'Failed to process upload' });
  }
}
