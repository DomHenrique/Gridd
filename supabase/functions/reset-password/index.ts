import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

console.log("Reset Password Function Initialized")

serve(async (req) => {
  // CORS Headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Verify Request Auth (Must be logged in)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing Authorization Header')

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user: caller }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !caller) throw new Error('Unauthorized')

    // 2. Check Caller Role (Must be Admin)
    const { data: callerProfile, error: profileError } = await supabaseClient
        .from('profiles')
        .select('role')
        .eq('id', caller.id)
        .single();
    
    if (profileError || callerProfile?.role !== 'admin') {
        throw new Error('Forbidden: Only Admins can reset passwords.')
    }

    // 3. Parse Request Body
    const { email, newPassword } = await req.json()
    if (!email || !newPassword) throw new Error("Email and New Password are required")

    // 4. Find User ID by Email (Admin Client)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // We can list users to find the ID (admin.listUsers is paginated, but searching by email is better if supported, 
    // or just use generating ID logic if we knew it? No, userId is UUID. 
    // Actually, createClient allows referencing auth.users? No.
    // Easier way: List users filtered? No, admin.listUsers doesn't filter by email well in generic version.
    // Best way: Use the 'profiles' table which we have access to! Profiles has ID and Email.
    
    const { data: targetProfile, error: targetError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

    if (targetError || !targetProfile) throw new Error("User not found")

    // 5. Update Password
    const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      targetProfile.id,
      { password: newPassword }
    )

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ message: "Password updated successfully" }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
