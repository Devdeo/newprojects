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
  try {
    const form = new formidable.IncomingForm();
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        err ? reject(err) : resolve([fields, files]);
      });
    });

    const { title, streamKey } = fields;
    const video = files.video;

    // Validation
    if (!title || !streamKey || !video) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (!streamKey.match(/^[a-zA-Z0-9_-]{4,}$/)) {
      return res.status(400).json({ error: 'Invalid stream key format' });
    }

    // Process video file
    const tempOutput = join(tmpdir(), `loop-${Date.now()}.mp4`);
    await new Promise((resolve, reject) => {
      exec(`ffmpeg -stream_loop -1 -i "${video.filepath}" -c copy "${tempOutput}"`, 
        (error) => error ? reject(error) : resolve());
    });

    // Start streaming
    const rtmpUrl = `rtmp://a.rtmp.youtube.com/live2/${streamKey}`;
    const ffmpegProcess = exec(
      `ffmpeg -re -stream_loop -1 -i "${tempOutput}" ` +
      `-c:v libx264 -preset veryfast -maxrate 3000k -bufsize 6000k ` +
      `-pix_fmt yuv420p -g 50 -c:a aac -b:a 160k -ac 2 -ar 44100 ` +
      `-f flv "${rtmpUrl}"`
    );

    // Cleanup
    ffmpegProcess.on('exit', () => {
      fs.unlink(tempOutput).catch(console.error);
    });

    res.status(200).json({ message: 'Streaming started successfully' });
  } catch (error) {
    console.error('Stream error:', error);
    res.status(500).json({ error: 'Streaming failed' });
  }
}