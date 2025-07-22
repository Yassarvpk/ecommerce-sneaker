const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const tempStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDir = path.join(__dirname, '../public/uploads/temp');
    fs.mkdirSync(tempDir, { recursive: true });
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueSuffix);
  },
});

const upload = multer({
  storage: tempStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
}).array('images', 5); // Limit to 5 images

const processImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length < 3) {
      req.session.message = 'At least 3 images are required';
      return res.redirect(req.originalUrl);
    }

    const processedImagePaths = [];
    for (const file of req.files) {
      const outputDir = path.join(__dirname, '../public/uploads/products');
      fs.mkdirSync(outputDir, { recursive: true });

      const outputFilename = `product-${Date.now()}-${file.originalname}`;
      const outputPath = path.join(outputDir, outputFilename);

      try {
        await sharp(file.path)
          .resize(600, 600, { fit: 'cover' })
          .jpeg({ quality: 90 })
          .toFile(outputPath);
        processedImagePaths.push(`/uploads/products/${outputFilename}`);
      } catch (sharpErr) {
        console.error('❌ Sharp processing error for', file.originalname, ':', sharpErr.message);
        continue; // Skip failed image but continue processing others
      } finally {
        try {
          fs.unlinkSync(file.path); // Delete temp file
        } catch (unlinkErr) {
          console.warn('⚠️ Could not delete temp file:', file.path, unlinkErr.message);
        }
      }
    }

    if (processedImagePaths.length < 3) {
      req.session.message = 'At least 3 images must be successfully processed';
      return res.redirect(req.originalUrl);
    }

    req.processedImages = processedImagePaths; // Store in req.processedImages
    next();
  } catch (err) {
    console.error('❌ Error processing images:', err.message);
    req.session.message = 'Error processing images';
    res.redirect(req.originalUrl);
  }
};

module.exports = {
  upload,
  processImages,
};