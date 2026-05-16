import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const { Client } = pg;
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error('Missing DATABASE_URL');
    process.exit(1);
}

const client = new Client({
    connectionString,
});

const sql = `
-- Function to safely check if an admin exists (accessible by anon)
CREATE OR REPLACE FUNCTION public.app_has_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER -- Runs with privileges of the creator (postgres), bypassing RLS
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE role = 'admin'
  );
$$;

-- Grant execution to anon (for public access on login screen) and authenticated
GRANT EXECUTE ON FUNCTION public.app_has_admin() TO anon, authenticated;
`;

async function deploy() {
    try {
        await client.connect();
        console.log('Connected to Database. Deploying RPC function...');
        await client.query(sql);
        console.log('✅ Function app_has_admin deployed successfully.');
        await client.end();
    } catch (err) {
        console.error('❌ Deployment failed:', err);
        process.exit(1);
    }
}

deploy();
