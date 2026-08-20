import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { isCampaignIdFormat } from "@/lib/campaign-draft-id";

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024;

function extFromMimeOrName(mime: string, name?: string): string {
  const byMime: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/svg+xml": "svg",
    "image/avif": "avif",
    "image/bmp": "bmp",
  };
  if (byMime[mime]) return byMime[mime];
  if (name && name.includes(".")) {
    const ext = name.split(".").pop()!.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (ext) return ext;
  }
  return "jpg";
}

export async function POST(req: NextRequest) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const campaignIdRaw = formData.get("campaignId");
  const campaignId =
    typeof campaignIdRaw === "string" ? campaignIdRaw.trim() : "";
  if (!campaignId || !isCampaignIdFormat(campaignId)) {
    return NextResponse.json(
      { error: "Missing or invalid campaignId (expected UUID)" },
      { status: 400 },
    );
  }

  const file = formData.get("file");
  if (!(file instanceof Blob) || file.size === 0) {
    return NextResponse.json({ error: "Missing or empty file" }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
  }

  const mime = file.type || "image/jpeg";
  if (!mime.startsWith("image/")) {
    return NextResponse.json({ error: "Only image uploads are allowed" }, { status: 400 });
  }

  const slotRaw = formData.get("slot");
  const slot =
    typeof slotRaw === "string" && slotRaw !== "" ? parseInt(slotRaw, 10) : 0;
  const slotNum = Number.isFinite(slot) ? Math.min(4, Math.max(0, slot)) : 0;

  const fileNameFromUpload =
    typeof (file as { name?: unknown }).name === "string"
      ? ((file as { name: string }).name || undefined)
      : undefined;
  const ext = extFromMimeOrName(mime, fileNameFromUpload);
  const fileName = `${Date.now()}-${slotNum}.${ext}`;
  const absoluteDir = path.join(process.cwd(), "public", campaignId, "uploads");
  const absoluteFile = path.join(absoluteDir, fileName);
  const buffer = Buffer.from(await file.arrayBuffer());
  try {
    await mkdir(absoluteDir, { recursive: true });
    await writeFile(absoluteFile, buffer);
  } catch (error) {
    console.error("[campaign-thumbnail] local write failed", error);
    return NextResponse.json({ error: "Failed to save file on server" }, { status: 500 });
  }
  const publicUrl = `/api/campaign-thumbnail/${campaignId}/${encodeURIComponent(fileName)}`;
  return NextResponse.json({ url: publicUrl });
}
