import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const email = process.env.SUPER_ADMIN_EMAIL;
const password = process.env.SUPER_ADMIN_PASSWORD;

if (!supabaseUrl || !serviceRoleKey || !email || !password) {
    console.error('Missing environment variables. Check .env file.');
    console.log('Required: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function createSuperAdmin() {
    console.log(`Creating Super Admin user: ${email}...`);

    try {
        // 1. Check if user already exists in Auth
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) throw listError;

        let userId = users.find(u => u.email === email)?.id;

        if (!userId) {
            // 2. Create User if not exists
            const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
                email: email,
                password: password,
                email_confirm: true,
                user_metadata: { name: 'Super Admin', role: 'admin' }
            });

            if (createError) throw createError;
            userId = newUser.user.id;
            console.log('Auth user created successfully.');
        } else {
            console.log('Auth user already exists. Updating details...');
            // Optional: Update password if needed
            const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
                password: password,
                user_metadata: { name: 'Super Admin', role: 'admin' }
            });
             if (updateError) throw updateError;
        }

        // 3. Ensure "admin" role in public.profiles (Using Service Role to bypass RLS if strictly needed, 
        // but normally the trigger does it. We force update to be sure.)
        const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
                id: userId,
                email: email,
                name: 'Super Admin',
                role: 'admin',
                updated_at: new Date().toISOString()
            });

        if (profileError) throw profileError;

        console.log('✅ Super Admin configured successfully in profiles table!');

    } catch (error) {
        console.error('❌ Error creating Super Admin:', error);
        process.exit(1);
    }
}

createSuperAdmin();
