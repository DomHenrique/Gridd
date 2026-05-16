import dns from 'dns';
import { promisify } from 'util';
import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Client } = pg;

const lookup = promisify(dns.lookup);

// Helper to wait for DB connection
async function waitForDb(connectionString, retries = 30, delay = 2000) {
    for (let i = 0; i < retries; i++) {
        const client = new Client({ connectionString });
        try {
            await client.connect();
            await client.end();
            console.log("✅ Database is ready.");
            return true;
        } catch (err) {
            console.log(`⏳ Waiting for database... (${i + 1}/${retries}) - Error: ${err.message}`);
            await new Promise(res => setTimeout(res, delay));
        }
    }
    throw new Error("❌ Database unreachable after multiple retries.");
}

// Helper to resolve hostname to IPv4
async function resolveToIpv4(connectionString) {
    try {
        const url = new URL(connectionString);
        const { address } = await lookup(url.hostname, { family: 4 });
        console.log(`Resolved ${url.hostname} to ${address}`);
        url.hostname = address;
        return url.toString();
    } catch (e) {
        console.warn(`Failed to resolve ${connectionString} to IPv4:`, e.message);
        return connectionString;
    }
}

async function runMigrations() {
    console.log("🚀 Starting database migrations...");
    
    if (!process.env.DATABASE_URL) {
        console.error("❌ DATABASE_URL is not set.");
        process.exit(1);
    }

    // Force IPv4 Resolution
    const dbUrl = await resolveToIpv4(process.env.DATABASE_URL);

    await waitForDb(dbUrl);

    const client = new Client({
        connectionString: dbUrl,
    });

    try {
        await client.connect();
        
        const migrationsDir = path.join(__dirname, '../supabase/migrations');
        if (!fs.existsSync(migrationsDir)) {
             console.log("⚠️ No migrations directory found.");
             return;
        }

        const files = fs.readdirSync(migrationsDir)
            .filter(f => f.endsWith('.sql'))
            .sort(); // Ensure order by filename

        if (files.length === 0) {
            console.log("ℹ️ No migration files found.");
            return;
        }

        // Create a migrations table if not exists to track history (Simple idempotency)
        await client.query(`
            CREATE TABLE IF NOT EXISTS _migrations (
                id SERIAL PRIMARY KEY,
                name TEXT UNIQUE NOT NULL,
                applied_at TIMESTAMP DEFAULT NOW()
            );
        `);

        for (const file of files) {
            // Check if already applied
            const check = await client.query('SELECT name FROM _migrations WHERE name = $1', [file]);
            if (check.rowCount > 0) {
                console.log(`⏩ Skipping ${file} (already applied)`);
                continue;
            }

            console.log(`▶️ Applying ${file}...`);
            const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
            
            await client.query('BEGIN');
            try {
                await client.query(sql);
                await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
                await client.query('COMMIT');
                console.log(`✅ Applied ${file}`);
            } catch (err) {
                await client.query('ROLLBACK');
                console.error(`❌ Error applying ${file}:`, err);
                throw err;
            }
        }

        console.log("✨ All migrations applied successfully.");

    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

// Allow running directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    runMigrations();
}

export { runMigrations };
