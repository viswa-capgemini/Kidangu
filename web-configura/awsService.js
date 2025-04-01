const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

// Initialize S3 Client
const s3 = new S3Client({
  region: "eu-north-1",
  credentials: {
    accessKeyId: "",
    secretAccessKey: "",
  },
});

// Lambda handler
exports.handler = async (event) => {
  if(!event.file) {
    return {statusCode: 400, body: JSON.stringify({error: "No file provided"})}
  }

  const fileKey = `${event.file.originalname}`;
    const uploadParams = {
        Bucket: "demoappbucketviswa",
        Key: `models/${fileKey}`,
        Body: event.file.buffer,
        ContentType: event.file.mimetype,
    };
    //await s3.send(new PutObjectCommand(uploadParams));

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
};
