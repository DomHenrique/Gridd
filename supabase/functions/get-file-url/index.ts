import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { S3Client, GetObjectCommand } from "https://esm.sh/@aws-sdk/client-s3@3.450.0"
import { getSignedUrl } from "https://esm.sh/@aws-sdk/s3-request-presigner@3.450.0"

console.log("Get File URL Function Initialized")

const minioEndpoint = Deno.env.get('MINIO_ENDPOINT') || 'http://localhost:9000'
const minioBucket = (Deno.env.get('MINIO_BUCKET_NAME') || 'agency-assets').toLowerCase()
const minioAccessKey = Deno.env.get('MINIO_ACCESS_KEY')
const minioSecretKey = Deno.env.get('MINIO_SECRET_KEY')

const s3Client = new S3Client({
  region: "us-east-1",
  endpoint: minioEndpoint,
  credentials: {
    accessKeyId: minioAccessKey ?? "",
    secretAccessKey: minioSecretKey ?? "",
  },
  forcePathStyle: true,
})

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { filename } = await req.json()
    if (!filename) throw new Error("Filename is required")

    // 1. Verify Request Auth
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing Authorization Header')

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) throw new Error('Unauthorized')

    // Generate Presigned GET URL
    const command = new GetObjectCommand({
        Bucket: minioBucket,
        Key: filename,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 Hour Link

    return new Response(
      JSON.stringify({ url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
