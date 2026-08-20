import { NextRequest, NextResponse } from "next/server";
import { getWhopCompanyTitleForExperience } from "@/lib/whop-experience-server";

export async function GET(req: NextRequest) {
  const experienceId = req.nextUrl.searchParams.get("experienceId");

  if (!experienceId) {
    return NextResponse.json({ name: null });
  }

  try {
    const name = await getWhopCompanyTitleForExperience(experienceId);
    return NextResponse.json({ name });
  } catch (error) {
    console.error("Failed to fetch experience company:", error);
    return NextResponse.json({ name: null });
  }
}
