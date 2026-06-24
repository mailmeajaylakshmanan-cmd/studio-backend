const mongoose = require('mongoose');

const photoSchema = new mongoose.Schema({
  eventId: { type: String, required: true }, // The Wedding ID
  s3Key: { type: String, required: true },   // Path in S3: "eventId/photo.jpg"
  faceIds: [String],                         // Array of Face IDs from Rekognition
  uploadedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Photo', photoSchema);
