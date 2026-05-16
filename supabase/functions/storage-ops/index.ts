
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "https://esm.sh/@aws-sdk/client-s3@3.450.0"
import { getSignedUrl } from "https://esm.sh/@aws-sdk/s3-request-presigner@3.450.0"

console.log("Storage Ops Function Initialized")

const minioEndpoint = Deno.env.get('MINIO_ENDPOINT') || 'http://172.17.0.1:9000'
const publicEndpoint = 'http://localhost:9000'
const minioBucket = (Deno.env.get('MINIO_BUCKET_NAME') || 'agency-assets').toLowerCase()

const s3Client = new S3Client({
  region: "us-east-1", 
  endpoint: minioEndpoint,
  credentials: {
    accessKeyId: Deno.env.get('MINIO_ACCESS_KEY') ?? "",
    secretAccessKey: Deno.env.get('MINIO_SECRET_KEY') ?? "",
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
    const { action, filename, fileType } = await req.json()

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

    if (!filename) {
      throw new Error("Filename is required")
    }

    if (action === 'upload') {
        const command = new PutObjectCommand({
            Bucket: minioBucket,
            Key: filename,
            ContentType: fileType || 'application/octet-stream',
        });

        // 1 hour expiry
        let url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        
        // Rewrite URL for browser access (internal -> public)
        if (minioEndpoint !== publicEndpoint) {
            url = url.replace(minioEndpoint, publicEndpoint);
            url = url.replace('http://minio:9000', publicEndpoint);
            url = url.replace('http://host.docker.internal:9000', publicEndpoint);
            url = url.replace('http://172.17.0.1:9000', publicEndpoint);
        }
        
        return new Response(
            JSON.stringify({ url }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    } 
    else if (action === 'delete') {
        const command = new DeleteObjectCommand({
            Bucket: minioBucket,
            Key: filename,
        });

        await s3Client.send(command);

        return new Response(
            JSON.stringify({ success: true }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    throw new Error(`Unknown action: ${action}`)

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
