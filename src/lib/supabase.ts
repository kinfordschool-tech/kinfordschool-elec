/**
 * Kinford School of Guidance - Supabase Configuration & Startup Verification Check
 * 
 * Required Environment Variables:
 * - DATABASE_URL: PostgreSQL connection URL (e.g. postgresql://...)
 * - SUPABASE_URL: Supabase Project API URL (e.g. https://xxxx.supabase.co)
 * - SUPABASE_SERVICE_ROLE_KEY: Supabase secret service role key (Server-side ONLY)
 * - ADMIN_PASSWORD: Password for admin panel login
 * - SESSION_SECRET: Encryption secret for cookie-based sessions
 */

const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'ADMIN_PASSWORD',
  'SESSION_SECRET'
];

// Startup verification check
for (const varName of REQUIRED_ENV_VARS) {
  if (!process.env[varName]) {
    const errorMsg = `CRITICAL CONFIG ERROR: Missing environment variable [${varName}]`;
    console.error(errorMsg);
    if (process.env.NODE_ENV === 'production') {
      throw new Error(errorMsg);
    }
  }
}

export const supabaseUrl = process.env.SUPABASE_URL || '';
export const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * Upload a candidate photo to Supabase Storage using the secure Service Role Key.
 * Bypasses RLS to write straight to the designated bucket.
 */
export async function uploadToSupabaseStorage(
  bucketName: string,
  fileName: string,
  fileBody: ArrayBuffer,
  contentType: string
): Promise<string> {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Supabase credentials are not configured properly.');
  }

  const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucketName}/${fileName}`;

  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'apikey': supabaseServiceRoleKey,
      'Authorization': `Bearer ${supabaseServiceRoleKey}`,
      'Content-Type': contentType,
    },
    body: fileBody,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Supabase Storage upload failed with status ${res.status}`);
  }

  // Return the public URL for the uploaded file
  return `${supabaseUrl}/storage/v1/object/public/${bucketName}/${fileName}`;
}
