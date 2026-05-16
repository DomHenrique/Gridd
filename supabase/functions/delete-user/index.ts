import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

console.log("Delete User Function Initialized")

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
    // 1. Verify Request Auth
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
        throw new Error('Forbidden: Only Admins can delete users.')
    }

    // 3. Parse Body
    const { userId } = await req.json()
    if (!userId) throw new Error("User ID is required")

    // 4. Delete User (Admin Service)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Delete from Auth (cascades to profile usually)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    
    if (deleteError) throw deleteError;

    return new Response(
      JSON.stringify({ message: "User deleted successfully" }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
