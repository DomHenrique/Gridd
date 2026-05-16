import { S3Client, ListBucketsCommand, CreateBucketCommand } from "@aws-sdk/client-s3";
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const endpoint = process.env.MINIO_ENDPOINT || 'http://localhost:9000';
const accessKeyId = process.env.MINIO_ACCESS_KEY;
const secretAccessKey = process.env.MINIO_SECRET_KEY;
const bucketName = process.env.MINIO_BUCKET_NAME || 'agency-assets';

if (!accessKeyId || !secretAccessKey) {
    console.error("❌ MinIO Credentials missing in .env");
    process.exit(1);
}


const s3 = new S3Client({
    region: "us-east-1",
    endpoint: endpoint,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true
});

async function waitForMinio(retries = 100, delay = 2000) {
    console.log(`Connecting to MinIO at ${endpoint}...`);
    for (let i = 0; i < retries; i++) {
        try {
            await s3.send(new ListBucketsCommand({}));
            console.log("✅ MinIO is ready.");
            return true;
        } catch (e) {
            console.log(`⏳ Waiting for MinIO... (${i + 1}/${retries}) - Error: ${e.message}`);
            await new Promise(res => setTimeout(res, delay));
        }
    }
    throw new Error("❌ MinIO unreachable after multiple retries.");
}

async function checkStorage() {
    try {
        await waitForMinio();

        console.log("Listing buckets...");
        const { Buckets } = await s3.send(new ListBucketsCommand({}));
        
        console.log("Current buckets:", Buckets?.map(b => b.Name).join(", ") || "None");

        const bucketExists = Buckets?.some(b => b.Name === bucketName);

        if (!bucketExists) {
            console.log(`Bucket '${bucketName}' not found. Creating...`);
            await s3.send(new CreateBucketCommand({ Bucket: bucketName }));
            console.log(`✅ Bucket '${bucketName}' created successfully.`);
            console.log(`Note: Files will be organized in folders per client (ClientName/file.jpg).`);
        } else {
            console.log(`✅ Bucket '${bucketName}' already exists.`);
        }

    } catch (e) {
        console.error("❌ Failed to setup MinIO:", e);
        // Do not swallow error, let it propagate to stop setup
        process.exit(1); 
    }
}

async function startMinioSetup() {
    await checkStorage();
}

export { startMinioSetup };

// Only run if called directly
import { fileURLToPath } from 'url';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    checkStorage();
}
