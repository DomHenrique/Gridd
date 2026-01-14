
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Parse Input
    const { email, password, fullName, role } = await req.json()

    if (!email || !password || !fullName) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2. Init Admin Client
    // We need the SERVICE_ROLE_KEY to create users directly in Auth
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
          auth: {
              autoRefreshToken: false,
              persistSession: false
          }
      }
    )

    // 3. Create User in Auth
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Auto-confirm for now, or false if you want flow
      user_metadata: {
        full_name: fullName
      }
    })

    if (createError) {
      console.error('Error creating user in Auth:', createError)
      throw createError
    }

    if (!userData.user) {
         throw new Error('User creation failed silently')
    }

    // 4. Update Profile with Role
    // The trigger 'on_auth_user_created' might have already created the profile with default role.
    // We need to ensure the role we want is set.
    
    // Give a small delay or retry logic if needed, but usually update works fine even if trigger is racey,
    // assuming RLS allows Service Role to update everything (which it does).
    
    const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({ role: role || 'client' })
        .eq('id', userData.user.id)

    if (profileError) {
        console.error('Error updating profile role:', profileError)
        // We don't abort, but we warn. User is created.
    }

    return new Response(JSON.stringify({ user: userData.user, message: 'User created successfully' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
