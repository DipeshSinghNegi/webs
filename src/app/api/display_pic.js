// pages/api/display_pic.js
import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const uploadsDir = path.join(process.cwd(), 'public/uploads');
    
    if (!fs.existsSync(uploadsDir)) {
      return res.status(200).json({ photo: null });
    }

    const files = fs.readdirSync(uploadsDir);
    const imageFiles = files.filter(file => 
      /\.(jpg|jpeg|png|gif|webp)$/i.test(file)
    );

    if (imageFiles.length === 0) {
      return res.status(200).json({ photo: null });
    }

    // Get the most recent file
    const latestFile = imageFiles
      .map(file => ({
        name: file,
        time: fs.statSync(path.join(uploadsDir, file)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time)[0];

    res.status(200).json({
      photo: `/uploads/${latestFile.name}`
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get display photo' });
  }
}