import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";
import { whopsdk } from "@/lib/whop-sdk";
import { buildCampaignInsertRow, type CreateCampaignInput } from "@/lib/campaign-create-payload";

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

async function getCampaignTableColumns(db: mysql.Pool): Promise<Set<string>> {
  const [cols] = await db.execute<mysql.RowDataPacket[]>(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'campaigns'",
    [process.env.MYSQL_DATABASE as string],
  );
  return new Set(cols.map((c) => String(c.COLUMN_NAME)));
}

export async function GET(req: NextRequest) {
  try {
    const db = getPool();
    const cols = await getCampaignTableColumns(db);

    const sp = req.nextUrl.searchParams;
    const status = sp.get("status");
    const niche = sp.get("niche");
    const search = sp.get("search");
    const whopCompanyId = sp.get("whopCompanyId");

    const where: string[] = [];
    const params: unknown[] = [];

    if (status && status !== "all" && cols.has("status")) {
      where.push("`status` = ?");
      params.push(status);
    }
    if (niche && cols.has("niche")) {
      where.push("`niche` = ?");
      params.push(niche);
    }
    if (whopCompanyId && cols.has("whop_company_id")) {
      where.push("`whop_company_id` = ?");
      params.push(whopCompanyId);
    }
    if (search && cols.has("name")) {
      if (cols.has("description")) {
        where.push("(`name` LIKE ? OR `description` LIKE ?)");
        params.push(`%${search}%`, `%${search}%`);
      } else {
        where.push("`name` LIKE ?");
        params.push(`%${search}%`);
      }
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const orderBy = cols.has("created_at") ? "`created_at` DESC" : "`id` DESC";
    const [rows] = await db.execute<mysql.RowDataPacket[]>(
      `SELECT * FROM campaigns ${whereSql} ORDER BY ${orderBy}`,
      params,
    );
    return NextResponse.json(rows);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load campaigns";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Creates a campaign via local MySQL API using embedded/local identity. */
export async function POST(req: NextRequest) {
  let body: CreateCampaignInput;
  try {
    body = (await req.json()) as CreateCampaignInput;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const whopHeader = req.headers.get("x-whop-user-token");

  let createdBy: string | null = body.created_by?.trim() || null;

  if (!createdBy && whopHeader) {
    const payload = await whopsdk.verifyUserToken(req.headers, { dontThrow: true });
    if (payload?.userId) createdBy = payload.userId;
  }

  if (!createdBy) {
    return NextResponse.json(
      { error: "Unable to resolve campaign owner id for local DB insert." },
      { status: 400 },
    );
  }

  try {
    const fullRow = buildCampaignInsertRow(body, createdBy) as Record<string, unknown>;

    const db = getPool();
    const tableColumns = await getCampaignTableColumns(db);
    const keys = Object.keys(fullRow).filter((k) => tableColumns.has(k));
    if (keys.length === 0) {
      throw new Error("Campaigns table has no matching columns for this payload.");
    }
    const values = keys.map((k) => fullRow[k]);
    const placeholders = keys.map(() => "?").join(", ");
    const quotedColumns = keys.map((k) => `\`${k}\``).join(", ");

    const [insertResult] = await db.execute<mysql.ResultSetHeader>(
      `INSERT INTO campaigns (${quotedColumns}) VALUES (${placeholders})`,
      values,
    );

    const hasId = tableColumns.has("id");
    let rowId: unknown = undefined;
    if (hasId && keys.includes("id")) {
      rowId = fullRow.id;
    } else if (hasId && insertResult.insertId) {
      rowId = insertResult.insertId;
    }

    if (hasId && rowId !== undefined) {
      const [rows] = await db.execute<mysql.RowDataPacket[]>(
        "SELECT * FROM campaigns WHERE id = ? LIMIT 1",
        [rowId],
      );
      return NextResponse.json(rows[0] ?? { id: rowId });
    }
    return NextResponse.json({ id: fullRow.id ?? insertResult.insertId ?? null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Campaign create failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
