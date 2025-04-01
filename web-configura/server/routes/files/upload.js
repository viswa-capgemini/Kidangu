const config = require("config");
const express = require("express");
const multer = require("multer");
const multerS3 = require('multer-s3');
const router = express.Router();
const axios = require("axios");

const { S3Client, PutObjectCommand, ListObjectsCommand } = require("@aws-sdk/client-s3");

// Initialize S3 Client (v3)
const s3 = new S3Client({
    region: config.get("awsRegion"),
    // endpoint: `https://s3.${config.get("awsRegion")}.amazonaws.com`, // optional
    credentials: {
      accessKeyId: config.get("awsAccessKeyID"),
      secretAccessKey: config.get("awsSecretKeyID"),
    },
  });

// Multer to handle form-data
const upload = multer({ storage: multer.memoryStorage() });

router.post("/", upload.single("file"), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }

    const fileKey = `${req.file.originalname}`;
    const uploadParams = {
        Bucket: config.get("awsBucketName"),
        Key: `models/${fileKey}`,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
    };

    try {
        const result = await s3.send(new PutObjectCommand(uploadParams));
        console.log("S3 Upload Result:", result);

        res.status(200).json({
            message: "File uploaded successfully",
            fileKey: fileKey,
        });
    } catch (error) {
        console.log("Error uploading to S3:", error.name, error.message, error.stack);
        res.status(500).json({ error: `Error uploading to S3: ${error.message}` });
    }
});

router.get("/", async (req, res) => {
    try {
        const result = await s3.send(new ListObjectsCommand({
            Bucket: config.get("awsBucketName"),
            Prefix: "models/"
        }));
        res.json(result.Contents.map(obj => obj.Key));
        console.log("S3 List Objects Result:", result);
    } catch (error) {
        console.log("Error listing objects in S3:", error.name, error.message, error.stack);
        res.status(500).json({ error: `Error listing objects in S3: ${error.message}` });
    }
});

module.exports = router;