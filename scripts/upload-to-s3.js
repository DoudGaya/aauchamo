const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const s3 = new S3Client({
  region: process.env.S3_REGION || 'us-east-1',
  endpoint: process.env.S3_ENDPOINT || undefined,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.S3_BUCKET;
const RELEASE_DIR = path.join(__dirname, '../release');

async function uploadRelease() {
  if (!BUCKET_NAME) {
    console.error('Error: S3_BUCKET environment variable is missing.');
    process.exit(1);
  }

  try {
    const files = fs.readdirSync(RELEASE_DIR);
    const exeFiles = files.filter(f => f.endsWith('.exe'));
    
    if (exeFiles.length === 0) {
      console.log('No .exe files found in the release directory.');
      return;
    }

    for (const file of exeFiles) {
      const filePath = path.join(RELEASE_DIR, file);
      const fileStream = fs.createReadStream(filePath);
      
      console.log(`Uploading ${file} to S3 bucket ${BUCKET_NAME}...`);
      
      const uploadParams = {
        Bucket: BUCKET_NAME,
        Key: `downloads/${file.replace(/ /g, '-')}`, // URL friendly name
        Body: fileStream,
        ContentType: 'application/x-msdownload',
      };

      await s3.send(new PutObjectCommand(uploadParams));
      console.log(`✅ Successfully uploaded ${file}`);
      console.log(`🔗 Public Download URL (if bucket is public): https://${BUCKET_NAME}.s3.amazonaws.com/downloads/${file.replace(/ /g, '-')}`);
    }
  } catch (error) {
    console.error('Error uploading to S3:', error);
  }
}

uploadRelease();
