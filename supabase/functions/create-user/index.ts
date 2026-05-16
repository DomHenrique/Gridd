import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
console.log("Create User Function Initialized");
serve(async (req)=>{
  // CORS Headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
  };
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    // 1. Verify Request Auth (Must be logged in)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing Authorization Header');
    // Create a regular client to verify the caller's identity
    const supabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    });
    const { data: { user: caller }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !caller) throw new Error('Unauthorized');
    // 2. Check Caller Role (Must be Admin)
    const { data: callerProfile, error: profileError } = await supabaseClient.from('profiles').select('role').eq('id', caller.id).single();
    if (profileError || callerProfile?.role !== 'admin') {
      throw new Error('Forbidden: Only Admins can create users.');
    }
    // 3. Parse Request Body
    const { email, password, role, name, allowed_client_ids } = await req.json();
    if (!email || !password) throw new Error("Email and Password are required");
    // 4. Create User using Admin Client (Service Role)
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      user_metadata: {
        name: name,
        role: role
      },
      email_confirm: true // Auto-confirm for immediate login
    });
    if (createError) throw createError;
    // 5. Ensure Profile Role and Permissions match
    if (newUser.user) {
      const { error: updateError } = await supabaseAdmin.from('profiles').update({
        role: role || 'user',
        allowed_client_ids: allowed_client_ids || []
      }).eq('id', newUser.user.id);
      if (updateError) console.error("Failed to sync role/permissions to profile:", updateError);
    }
    return new Response(JSON.stringify(newUser), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 400,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
