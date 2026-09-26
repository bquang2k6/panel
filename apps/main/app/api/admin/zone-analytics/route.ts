import { NextRequest, NextResponse } from "next/server";
import { getZoneAnalytics } from "@/lib/cloudflare/zone/analytics";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "24h";

    const now = new Date();
    let startDateStr: string;
    let endDateStr = now.toISOString();

    if (period === "7d") {
      const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      startDateStr = d7.toISOString();
    } else if (period === "30d") {
      const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      startDateStr = d30.toISOString();
    } else {
      // Default to 24h
      const d24 = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      startDateStr = d24.toISOString();
    }

    const result = await getZoneAnalytics(startDateStr, endDateStr, period);

    if (result.error) {
      return NextResponse.json({ success: false, message: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      period,
      analytics: result.data,
    });
  } catch (error: any) {
    console.error("Zone Analytics Route Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch Zone analytics" },
      { status: 500 },
    );
  }
}
