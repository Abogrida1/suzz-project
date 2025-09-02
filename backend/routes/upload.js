const express = require('express');
const { uploadSingle, getFileUrl } = require('../middleware/upload');

const router = express.Router();

// Upload single file (avatar, message attachment)
router.post('/single', uploadSingle('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const fileUrl = getFileUrl(req, req.file.filename);

    res.json({
      message: 'File uploaded successfully',
      file: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype,
        url: fileUrl
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Upload failed' });
  }
});

// Upload avatar specifically
router.post('/avatar', uploadSingle('avatar'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No avatar uploaded' });
    }

    // Check if it's an image
    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({ message: 'Avatar must be an image' });
    }

    const fileUrl = getFileUrl(req, req.file.filename);

    res.json({
      message: 'Avatar uploaded successfully',
      avatar: {
        filename: req.file.filename,
        url: fileUrl
      }
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ message: 'Avatar upload failed' });
  }
});

module.exports = router;
