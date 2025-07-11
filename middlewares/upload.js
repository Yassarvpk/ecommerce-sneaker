const multer = require("multer");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");

const tempStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const tempDir = path.join(__dirname, "../public/uploads/temp");
    fs.mkdirSync(tempDir, { recursive: true });
    cb(null, tempDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + file.originalname;
    cb(null, uniqueSuffix);
  },
});

const upload = multer({ storage: tempStorage });

const processImages = async (req, res, next) => {
  try {
    const processedImagePaths = [];

  for (const file of req.files) {
    const outputDir = path.join(__dirname, "../public/uploads/products");
    fs.mkdirSync(outputDir, { recursive: true });

    const outputFilename = `product-${Date.now()}-${file.originalname}`;
    const outputPath = path.join(outputDir, outputFilename);

    try {
      await sharp(file.path)
        .resize(600, 600, { fit: "cover" })
        .jpeg({ quality: 90 })
        .toFile(outputPath);

      processedImagePaths.push(`/uploads/products/${outputFilename}`);
    } catch (sharpErr) {
      console.error("❌ Sharp processing error:", sharpErr.message);
    }
  }

    req.body.processedImages = processedImagePaths;
    next();
  } catch (err) {
    console.error("❌ Error processing images:", err.message);
    res.status(500).send("Image processing failed");
  }
};

module.exports = {
  upload: upload,
  processImages: processImages,
};
