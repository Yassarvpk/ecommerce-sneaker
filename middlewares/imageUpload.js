const multer = require('multer');
  const sharp = require('sharp');
  const path = require('path');
  const fs = require('fs');

  const storage = multer.memoryStorage();
  const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only images are allowed'), false);
      }
    },
  }).array('images', 5); // Max 5 images

  const processImages = async (req, res, next) => {
    try {
      if (!req.files || req.files.length < 3) {
        req.session.message = 'Please upload at least 3 images';
        return res.redirect(req.originalUrl);
      }

      const processedImages = [];
      for (const file of req.files) {
        const filename = `${Date.now()}-${file.originalname}`;
        const outputPath = path.join(__dirname, '../public/uploads', filename);

        await sharp(file.buffer)
          .resize(800, 800, { fit: 'cover' })
          .toFile(outputPath);

        processedImages.push(`/uploads/${filename}`);
      }

      req.processedImages = processedImages;
      next();
    } catch (err) {
      console.error('Error processing images:', err.message);
      req.session.message = 'Error processing images';
      res.redirect(req.originalUrl);
    }
  };

  module.exports = { upload, processImages };