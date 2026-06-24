const router = require('express').Router();
const aiService = require('../utils/aiService'); // Adjusted path
const Photo = require('../models/Photo');
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const s3Client = new S3Client({ region: "us-east-1" });

// Called when a new wedding project is created to initialize AI storage
router.post('/init-event', async (req, res) => {
  const { eventId } = req.body;
  await aiService.createCollection(eventId);
  res.json({ message: "AI Collection ready" });
});

// Called after a photographer uploads a photo to S3
router.post('/process-upload', async (req, res) => {
  const { eventId, s3Key } = req.body;
  try {
    const result = await aiService.indexFaces("clikz-event-photos", s3Key, eventId);
    const faceIds = result.FaceRecords.map(r => r.Face.FaceId);
    
    await Photo.create({ eventId, s3Key, faceIds });
    res.json({ success: true, count: faceIds.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Called when a guest uploads a selfie from the QR code page
router.post('/find-me', async (req, res) => {
  const { eventId, selfieBase64 } = req.body;
  try {
    const buffer = Buffer.from(selfieBase64, 'base64');
    const result = await aiService.searchByFace(buffer, eventId);
    const matchedIds = result.FaceMatches.map(m => m.Face.FaceId);
    
    // Find all photos in MongoDB that contain any of these matched Face IDs
    const photos = await Photo.find({ eventId, faceIds: { $in: matchedIds } });
    res.json(photos); 
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a temporary URL to upload a photo directly to S3 from the browser
router.post('/get-upload-url', async (req, res) => {
  const { eventId, fileName, fileType } = req.body;
  const s3Key = `${eventId}/${Date.now()}-${fileName}`;

  const command = new PutObjectCommand({
    Bucket: "clikz-event-photos",
    Key: s3Key,
    ContentType: fileType
  });

  try {
    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    res.json({ url, s3Key });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
