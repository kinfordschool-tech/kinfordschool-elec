import { Pool, PoolConfig } from 'pg';
import { parse } from 'pg-connection-string';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not defined');
}

// 1. Detect if the user's password contains an unencoded '?' character
const atIndex = connectionString.indexOf('@');
const questionIndex = connectionString.indexOf('?');
if (questionIndex !== -1 && (atIndex === -1 || questionIndex < atIndex)) {
  console.error(
    `\n⚠️ [CRITICAL DATABASE CONFIG ERROR]` +
    `\nYour DATABASE_URL password contains an unencoded '?' character.` +
    `\nThis breaks connection URL parsing, causing the driver to treat your database username as the hostname.` +
    `\nFIX REQUIRED: In Render, please change the '?' in your database password string to '%3F' (the URL-encoded equivalent).\n`
  );
}

// 2. Parse connection parameters using pg-connection-string
const parsedConfig = parse(connectionString);
console.log(`[DB INIT] Connecting to Database - Host: ${parsedConfig.host || 'unknown'}, Port: ${parsedConfig.port || '5432'}`);

// 3. Construct PoolConfig explicitly by passing individual parameters instead of connectionString.
// If connectionString is passed, pg will re-parse it internally and overwrite the ssl setting.
const poolConfig: PoolConfig = {
  host: parsedConfig.host || undefined,
  port: parsedConfig.port ? parseInt(parsedConfig.port as string, 10) : undefined,
  user: parsedConfig.user || undefined,
  password: parsedConfig.password || undefined,
  database: parsedConfig.database || undefined,
  ssl: {
    rejectUnauthorized: false, // Force pg to accept Supabase's self-signed certificate chain
  },
  max: 10, // Optimize pool size for in-person laptop deployment
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000, // 10s timeout for cold poolers
};

let pool: Pool;

if (process.env.NODE_ENV === 'production') {
  pool = new Pool(poolConfig);
} else {
  // In development, use a global variable to prevent creating new connections on hot reload
  const globalWithPool = global as typeof globalThis & {
    _postgresPool?: Pool;
  };
  if (!globalWithPool._postgresPool) {
    globalWithPool._postgresPool = new Pool(poolConfig);
  }
  pool = globalWithPool._postgresPool;
}

// Listen to pool errors to prevent Node process from crashing on idle connection losses
pool.on('error', (err) => {
  console.error('UNEXPECTED DATABASE CLIENT ERROR on idle client:', {
    message: err.message,
    code: (err as any).code,
    stack: err.stack,
  });
});

export default pool;

/**
 * Execute a parameterized database query with rich error reporting.
 */
export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'production') {
      console.log('Executed query', { text, duration, rows: res.rowCount });
    }
    return res.rows;
  } catch (error: any) {
    // Log rich diagnostic details to Render logs
    console.error('DATABASE QUERY EXECUTION FAILED:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint,
      position: error.position,
      query: text,
      params: params,
      durationMs: Date.now() - start,
    });
    throw error;
  }
}
