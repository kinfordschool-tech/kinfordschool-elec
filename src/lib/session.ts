const SECRET_KEY_STR = process.env.SESSION_SECRET || 'kinford-default-super-secret-key-321-backup';

// Helper to convert string to Uint8Array
function stringToUint8Array(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

// Helper to get crypto HMAC key
async function getHmacKey() {
  const keyBuffer = stringToUint8Array(SECRET_KEY_STR);
  return await crypto.subtle.importKey(
    'raw',
    keyBuffer as any,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

// Helper to encode base64url
function base64urlEncode(buffer: ArrayBuffer | Uint8Array) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Helper to decode base64url
function base64urlDecode(str: string): ArrayBuffer {
  let base64 = str
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Sign a payload object and return a signed token string.
 */
export async function createSessionToken(payload: any, expiresInSeconds: number): Promise<string> {
  const expires = Date.now() + (expiresInSeconds * 1000);
  const fullPayload = {
    ...payload,
    expires,
  };
  
  const payloadStr = JSON.stringify(fullPayload);
  const payloadBase64 = base64urlEncode(stringToUint8Array(payloadStr));
  
  const key = await getHmacKey();
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    stringToUint8Array(payloadBase64) as any
  );
  const signatureBase64 = base64urlEncode(signatureBuffer);
  
  return `${payloadBase64}.${signatureBase64}`;
}

/**
 * Verify a token string and return the payload if valid and not expired, or null.
 */
export async function verifySessionToken(token: string | undefined): Promise<any | null> {
  if (!token) return null;
  
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  
  const [payloadBase64, signatureBase64] = parts;
  
  try {
    const key = await getHmacKey();
    const signatureBuffer = base64urlDecode(signatureBase64);
    const payloadBuffer = stringToUint8Array(payloadBase64);
    
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBuffer as any,
      payloadBuffer as any
    );
    
    if (!isValid) {
      return null;
    }
    
    const payloadStr = new TextDecoder().decode(base64urlDecode(payloadBase64));
    const payload = JSON.parse(payloadStr);
    
    if (Date.now() > payload.expires) {
      return null; // Expired
    }
    
    return payload;
  } catch (err) {
    console.error('Session verification error:', err);
    return null;
  }
}
