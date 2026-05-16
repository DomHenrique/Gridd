
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables manually since we are in a module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Error: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const args = process.argv.slice(2);
if (args.length < 3) {
  console.log('Usage: node scripts/create-user.js <email> <password> <role> [name]');
  console.log('Roles: admin, manager, user');
  process.exit(1);
}

const [email, password, role, nameArg] = args;
const name = nameArg || email.split('@')[0];

async function createUser() {
  console.log(`Creating user: ${email} (${role})...`);

  // 1. Create Auth User
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    user_metadata: { name, role },
    email_confirm: true
  });

  if (authError) {
    console.error('Error creating auth user:', authError.message);
    return;
  }

  const userId = authData.user.id;
  console.log(`Auth User created. ID: ${userId}`);

  // 2. Ensure Profile Role is correct
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId);

  if (profileError) {
    console.error('Error updating profile role:', profileError.message);
  } else {
    console.log(`✅ User '${email}' created successfully with role '${role}'.`);
    if (role === 'user') {
        console.log("ℹ️  Note: This user is a 'staff/creative'. They will not see ANY clients until you assign them.");
    }
  }
}

createUser();
