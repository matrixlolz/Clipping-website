import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";

export const runtime = "nodejs";

let pool: mysql.Pool | null = null;

function getPool(): mysql.Pool {
  if (pool) return pool;
  const host = process.env.MYSQL_HOST;
  const user = process.env.MYSQL_USER;
  const password = process.env.MYSQL_PASSWORD;
  const database = process.env.MYSQL_DATABASE;

  if (!host || !user || !database) {
    throw new Error("MySQL is not configured (MYSQL_HOST, MYSQL_USER, MYSQL_DATABASE).");
  }

  pool = mysql.createPool({
    host,
    user,
    password,
    database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: "utf8mb4",
  });
  return pool;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const id = params.id?.trim();
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const db = getPool();
    const [rows] = await db.execute<mysql.RowDataPacket[]>(
      "SELECT * FROM campaigns WHERE id = ? LIMIT 1",
      [id],
    );
    if (!rows.length) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load campaign";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
