import { rm } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { isCampaignIdFormat } from "@/lib/campaign-draft-id";

export const runtime = "nodejs";

/** Remove `public/{uuid}/` when the user abandons the launch flow before completing. */
export async function DELETE(
  _req: NextRequest,
  context: { params: { id: string } },
) {
  const { id } = context.params;
  if (!id || !isCampaignIdFormat(id)) {
    return NextResponse.json({ error: "Invalid campaign id" }, { status: 400 });
  }

  const root = path.join(process.cwd(), "public", id);
  try {
    await rm(root, { recursive: true, force: true });
  } catch (e) {
    console.error("[campaign-draft] delete:", e);
    return NextResponse.json({ error: "Failed to remove draft folder" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
