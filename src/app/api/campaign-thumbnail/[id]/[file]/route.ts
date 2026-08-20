import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { isCampaignIdFormat } from "@/lib/campaign-draft-id";

export const runtime = "nodejs";

const FILE_RE = /^[A-Za-z0-9._-]+\.(jpg|jpeg|png|webp|gif|svg|avif|bmp)$/i;

function contentTypeFromExt(file: string): string {
  const ext = file.split(".").pop()?.toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  if (ext === "svg") return "image/svg+xml";
  if (ext === "avif") return "image/avif";
  if (ext === "bmp") return "image/bmp";
  return "image/jpeg";
}

export async function GET(
  _req: NextRequest,
  context: { params: { id: string; file: string } },
) {
  const { id, file } = context.params;
  if (!isCampaignIdFormat(id) || !FILE_RE.test(file)) {
    return NextResponse.json({ error: "Invalid image path" }, { status: 400 });
  }

  const absoluteFile = path.join(process.cwd(), "public", id, "uploads", file);
  try {
    const bytes = await readFile(absoluteFile);
    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": contentTypeFromExt(file),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }
}

