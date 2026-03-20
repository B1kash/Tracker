const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

const BUCKET = process.env.AWS_S3_BUCKET_NAME;

/**
 * Upload a file buffer to S3
 * @param {Buffer} buffer - file data
 * @param {string} mimetype - e.g. 'image/jpeg'
 * @param {string} folder - S3 key prefix e.g. 'gym-photos'
 * @returns {Promise<string>} Public URL of uploaded file
 */
async function uploadToS3(buffer, mimetype, folder = 'uploads') {
    const ext = mimetype.split('/')[1] || 'jpg';
    const key = `${folder}/${uuidv4()}.${ext}`;

    await s3.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: mimetype,
    }));

    return `https://${BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}

/**
 * Delete a file from S3 by its full URL
 * @param {string} url - The full S3 URL
 */
async function deleteFromS3(url) {
    try {
        const urlObj = new URL(url);
        const key = urlObj.pathname.slice(1); // remove leading '/'
        await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
    } catch (e) {
        console.error('S3 delete failed:', e.message);
    }
}

module.exports = { uploadToS3, deleteFromS3 };
