// Setup type definitions for Deno.
// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';

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
    const { action, code, code_verifier, refresh_token } = await req.json()

    // Pegar credenciais das variáveis de ambiente do Supabase
    const client_id = Deno.env.get('GOOGLE_CLIENT_ID')
    const client_secret = Deno.env.get('GOOGLE_CLIENT_SECRET')
    const redirect_uri = Deno.env.get('GOOGLE_REDIRECT_URI')

    if (!client_id || !client_secret) {
      throw new Error('Configuração do Google faltando no servidor.')
    }

    let body = new URLSearchParams()
    body.append('client_id', client_id)
    body.append('client_secret', client_secret)

    if (action === 'exchange') {
      console.log('Trocando código de autorização por tokens...')
      body.append('grant_type', 'authorization_code')
      body.append('code', code)
      body.append('redirect_uri', redirect_uri || '')
      if (code_verifier) {
        body.append('code_verifier', code_verifier)
      }
    } else if (action === 'refresh') {
      console.log('Renovando token de acesso...')
      body.append('grant_type', 'refresh_token')
      body.append('refresh_token', refresh_token)
    } else {
      throw new Error('Ação inválida')
    }

    const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Erro na API do Google:', data)
      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
