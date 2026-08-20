import { NextRequest, NextResponse } from "next/server";
import { whopsdk } from "@/lib/whop-sdk";

/** List Whop products for a company (for campaign product selector). */
export async function GET(req: NextRequest) {
  const companyId = req.nextUrl.searchParams.get("companyId");
  if (!companyId?.trim()) {
    return NextResponse.json({ products: [] as { id: string; title: string }[] });
  }

  if (!process.env.WHOP_API_KEY) {
    return NextResponse.json({ products: [] as { id: string; title: string }[] });
  }

  try {
    const list = await whopsdk.products.list({ company_id: companyId.trim() });
    const products: { id: string; title: string }[] = [];
    for await (const item of list) {
      products.push({
        id: item.id,
        title: item.title?.trim() || item.id,
      });
      if (products.length >= 100) break;
    }
    return NextResponse.json({ products });
  } catch (e) {
    console.error("whop products list:", e);
    return NextResponse.json({ products: [] as { id: string; title: string }[] });
  }
}
