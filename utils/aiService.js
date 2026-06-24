const { RekognitionClient, IndexFacesCommand, SearchFacesByImageCommand, CreateCollectionCommand } = require("@aws-sdk/client-rekognition");

const rekClient = new RekognitionClient({ region: "us-east-1" });

// 1. Create a "Face Collection" for the specific wedding
exports.createCollection = async (eventId) => {
  try {
    await rekClient.send(new CreateCollectionCommand({ CollectionId: eventId }));
  } catch (e) {
    console.log("Collection already exists or error:", e.message);
  }
};

// 2. Scan an uploaded photo and remember the faces (Indexing)
exports.indexFaces = async (bucket, key, eventId) => {
  const command = new IndexFacesCommand({
    CollectionId: eventId,
    Image: { S3Object: { Bucket: bucket, Name: key } },
    ExternalImageId: key.replace(/\//g, "_"), // S3 key reference
    DetectionAttributes: ["ALL"]
  });
  return await rekClient.send(command);
};

// 3. Search for a guest's face in the wedding collection
exports.searchByFace = async (imageBuffer, eventId) => {
  const command = new SearchFacesByImageCommand({
    CollectionId: eventId,
    Image: { Bytes: imageBuffer },
    MaxFaces: 5,
    FaceMatchThreshold: 90 // 90% confidence
  });
  return await rekClient.send(command);
};
