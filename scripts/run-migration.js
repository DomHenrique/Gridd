
import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Client } = pg;
const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  try {
    await client.connect();
    const migrationFile = path.join(__dirname, '../supabase/migrations/20260118_activity_logs.sql');
    const sql = fs.readFileSync(migrationFile, 'utf8');
    await client.query(sql);
    console.log('Migration applied successfully!');
  } catch (err) {
    console.error('Error applying migration:', err);
  } finally {
    await client.end();
  }
}

run();
