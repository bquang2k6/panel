import { NextRequest, NextResponse } from "next/server";
import {
  getR2Operations,
  getR2StorageConfigs,
  calculateBillingCycle,
} from "@/lib/cloudflare/r2/analytics";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "today";
    const bucket = searchParams.get("bucket") || undefined;
    const storageId = searchParams.get("storageId") || undefined;

    const now = new Date();
    let startDateStr: string;
    let endDateStr = now.toISOString();

    if (period === "billing") {
      const configs = getR2StorageConfigs();
      const selectedConfig =
        configs.find((c) => c.id === storageId) || configs[0];
      const cycle = calculateBillingCycle(selectedConfig.billingDay, now);
      startDateStr = cycle.startDate.toISOString();
      const cycleEnd = cycle.endDate > now ? now : cycle.endDate;
      endDateStr = cycleEnd.toISOString();
    } else if (period === "today") {
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      startDateStr = today.toISOString();
    } else if (period === "24h") {
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      startDateStr = yesterday.toISOString();
    } else if (period === "30d") {
      const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      d30.setHours(0, 0, 0, 0);
      startDateStr = d30.toISOString();
    } else {
      // Default: 7d
      const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      d7.setHours(0, 0, 0, 0);
      startDateStr = d7.toISOString();
    }

    const analytics = await getR2Operations({
      storageId,
      bucketName: bucket,
      startDate: startDateStr,
      endDate: endDateStr,
    });


    return NextResponse.json({
      success: true,
      period,
      analytics,
    });
  } catch (error) {
    console.error("R2 Analytics Route Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch R2 analytics",
      },
      { status: 500 },
    );
  }
}