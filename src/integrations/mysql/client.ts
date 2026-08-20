// MySQL client - NOTE: This is for SERVER-SIDE use only
// For browser/client-side, use mysqlApi from './api.ts' instead

import { v4 as uuidv4 } from 'uuid';

// Helper function to generate UUID
export function generateUUID(): string {
  return uuidv4();
}

// For server-side use (Node.js/Deno), import mysql2 directly
// For client-side use, import from './api.ts'

// Re-export API client for browser use
export { mysqlApi as mysqlClient } from './api';

// Server-side MySQL client (for Node.js backend)
// Uncomment and use this in your backend API server:
/*
import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'u488996979_clipping',
  password: process.env.MYSQL_PASSWORD || '@Clipping12345',
  database: process.env.MYSQL_DATABASE || 'u488996979_clipping',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
};

let pool: mysql.Pool | null = null;

export function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
  }
  return pool;
}

function toCamelCase(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(toCamelCase);
  if (typeof obj !== 'object') return obj;
  
  const camelObj: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      camelObj[camelKey] = toCamelCase(obj[key]);
    }
  }
  return camelObj;
}

export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  const connection = await getPool().getConnection();
  try {
    const [rows] = await connection.execute(sql, params);
    return toCamelCase(rows) as T[];
  } finally {
    connection.release();
  }
}

export async function execute(sql: string, params?: any[]): Promise<{ affectedRows: number; insertId?: number }> {
  const connection = await getPool().getConnection();
  try {
    const [result] = await connection.execute(sql, params) as any;
    return {
      affectedRows: result.affectedRows,
      insertId: result.insertId,
    };
  } finally {
    connection.release();
  }
}
*/

