import { Pool, PoolConfig } from 'pg';

let connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not defined');
}

// 1. Automatically fix database connection string common pooler format issues
if (connectionString.includes('pooler.supabase.com')) {
  // Supabase transaction pooler requires the username in format: postgres.[project-ref]
  // If the user provided the default "postgres" username, rewrite it programmatically.
  if (connectionString.startsWith('postgresql://postgres:') || connectionString.startsWith('postgres://postgres:')) {
    connectionString = connectionString.replace('://postgres:', '://postgres.bvgvyslczhooyvqqztyx:');
  }
  
  // Ensure sslmode=require is appended to the connection string
  if (!connectionString.includes('sslmode=')) {
    const separator = connectionString.includes('?') ? '&' : '?';
    connectionString += `${separator}sslmode=require`;
  }
}

const poolConfig: PoolConfig = {
  connectionString,
  ssl: {
    rejectUnauthorized: false, // Required for secure remote SSL handshake with Supabase
  },
  max: 10, // Optimize pool size for in-person laptop deployment
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000, // Increase connection timeout to 10s for PgBouncer cold starts
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
