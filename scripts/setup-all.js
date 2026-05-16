import { startMinioSetup } from './setup-minio.js';
import { runMigrations } from './setup-db.js';

async function main() {
    console.log("🛠️ Starting Application Setup...");
    
    // Check environment
    if (!process.env.DATABASE_URL) console.warn("⚠️ DATABASE_URL not set");
    if (!process.env.MINIO_ACCESS_KEY) console.warn("⚠️ MINIO_ACCESS_KEY not set");

    try {
        // Run sequentially to avoid log interleaving
        
        // 1. Setup MinIO
        console.log("\n📦 --- MinIO Setup ---");
        // Assuming setup-minio.js can be imported or executed. 
        // I will need to modify setup-minio.js slightly to export a function or just run it via import if that's how it's written.
        // Actually, let's just use child_process for isolation or dynamic import if it auto-runs.
        // Looking at setup-minio.js content, it executes `checkStorage()` at the end. 
        // So importing it will run it. However, it's async and doesn't wait.
        // I should modify setup-minio.js to export the function instead of running it immediately, OR spawn it.
        // For simplicity, I'll update setup-minio.js to export.
        
        await startMinioSetup();

        // 2. Setup DB
        console.log("\n🐘 --- Database Setup ---");
        await runMigrations();

        console.log("\n✅ Setup Complete!");
    } catch (error) {
        console.error("\n❌ Setup Failed:", error);
        process.exit(1);
    }
}

main();
