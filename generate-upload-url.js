import { createClient } from 'npm:@insforge/sdk@1.2.10';
import { S3Client, PutObjectCommand } from 'npm:@aws-sdk/client-s3@3.535.0';
import { getSignedUrl } from 'npm:@aws-sdk/s3-request-presigner@3.535.0';

export default async function(req) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    const userToken = authHeader ? authHeader.replace('Bearer ', '') : null;

    if (!userToken) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Missing token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Initialize Insforge client with user's token
    const client = createClient({
      // INSFORGE_BASE_URL must be set in your deployment environment variables
      baseUrl: Deno.env.get('INSFORGE_BASE_URL'),
      edgeFunctionToken: userToken
    });

    // Authenticate user
    const { data: authData, error: authError } = await client.auth.getCurrentUser();
    if (authError || !authData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    const user = authData.user;

    // Parse parameters
    const body = await req.json().catch(() => ({}));
    const { vaultId, filename, contentType, isThumbnail } = body;

    console.log(`[generate-upload-url] Request received: vaultId=${vaultId}, filename=${filename}, contentType=${contentType}, isThumbnail=${isThumbnail}`);

    if (!vaultId || !filename || !contentType) {
      console.warn('[generate-upload-url] Missing required fields');
      return new Response(JSON.stringify({ error: 'Missing required fields: vaultId, filename, contentType' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[generate-upload-url] Authenticated user: ${user.id}`);

    // Verify user is a member of the vault
    const { data: member, error: memberError } = await client.database
      .from('vault_members')
      .select('*')
      .eq('vault_id', vaultId)
      .eq('profile_id', user.id)
      .maybeSingle();

    if (memberError) {
      console.error('[generate-upload-url] Database error checking membership:', memberError);
      return new Response(JSON.stringify({ error: 'Database verification failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!member) {
      console.warn(`[generate-upload-url] Forbidden: User ${user.id} is not a member of vault ${vaultId}`);
      return new Response(JSON.stringify({ error: 'Forbidden: You are not a member of this vault' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[generate-upload-url] User verified as vault member`);

    // Retrieve R2 credentials from environment variables.
    // See .env.example at the repository root for required variable names.
    const accountId = Deno.env.get('R2_ACCOUNT_ID');
    const accessKeyId = Deno.env.get('R2_ACCESS_KEY_ID');
    const secretAccessKey = Deno.env.get('R2_SECRET_ACCESS_KEY');
    const bucketName = Deno.env.get('R2_BUCKET_NAME');
    const publicUrlBase = Deno.env.get('VITE_R2_PUBLIC_URL') || Deno.env.get('R2_PUBLIC_URL');

    if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
      console.error('[generate-upload-url] R2 credentials configuration missing');
      return new Response(JSON.stringify({ error: 'Server configuration error: Missing Cloudflare R2 environment variables' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Sanitize filename
    const cleanFileName = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const timestamp = Date.now();
    const folder = isThumbnail ? 'thumbnails' : 'trips';
    const storageKey = `${folder}/${vaultId}/${timestamp}_${cleanFileName}`;

    console.log(`[generate-upload-url] Generating signed URL for storage key: ${storageKey}`);

    // Initialize S3/R2 client with forcePathStyle: true to avoid wildcard SSL cert errors
    const s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey
      },
      forcePathStyle: true
    });

    // Create Presigned URL command
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: storageKey,
      ContentType: contentType
    });

    console.log('[generate-upload-url] Calling getSignedUrl...');
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
    console.log('[generate-upload-url] Signed URL generated successfully');

    const publicUrl = publicUrlBase 
      ? `${publicUrlBase.replace(/\/$/, '')}/${storageKey}` 
      : `https://${bucketName}.${accountId}.r2.cloudflarestorage.com/${storageKey}`;

    return new Response(JSON.stringify({
      uploadUrl,
      storageKey,
      publicUrl
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
