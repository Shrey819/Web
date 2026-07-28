import { Pool, neonConfig, QueryResultRow, PoolClient } from '@neondatabase/serverless';
import ws from 'ws';

// Set up WebSocket for Neon to bypass strict port 5432 firewalls
neonConfig.webSocketConstructor = ws;

// Prevent multiple instances of Pool in development
declare global {
  var _dbPool: Pool | undefined;
}

const getPool = () => {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set.");
  }
  
  if (process.env.NODE_ENV === 'development') {
    if (!global._dbPool) {
      global._dbPool = new Pool({ connectionString: process.env.DATABASE_URL });
    }
    return global._dbPool;
  }
  
  return new Pool({ connectionString: process.env.DATABASE_URL });
};

export const pool = getPool();

/**
 * Execute a query with parameterized values
 */
export async function query<T extends QueryResultRow = QueryResultRow>(text: string, params?: unknown[]) {
  const start = Date.now();
  try {
    const res = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DB Query] executed in ${duration}ms: ${text.substring(0, 50)}...`);
    }
    return res;
  } catch (error) {
    console.error(`[DB Error] query failed: ${text}`, error);
    throw error;
  }
}

/**
 * Transaction helper
 * Usage: await transaction(async (client) => { await client.query(...) })
 */
export async function transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
