import { cloudflareGraphQL } from "../r2/client";

export type ZoneOperationGroup = {
  count: number;
  dimensions: {
    datetimeHour?: string;
    clientRequestPath?: string;
  };
  sum: {
    visits: number;
    edgeResponseBytes: number;
  };
};

export type ZoneGraphQLResponse = {
  viewer: {
    zones: Array<{
      hourly?: ZoneOperationGroup[];
      topPaths?: ZoneOperationGroup[];
    }>;
  };
};

export async function getZoneAnalytics(startDate: string, endDate: string, period: string = "24h") {
  const limit = period === "30d" ? 10000 : period === "7d" ? 2000 : 48;
  const query = `
query {
  viewer {
    zones(filter: {zoneTag: "${process.env.CLOUDFLARE_ZONE_ID}"}) {
      hourly: httpRequestsAdaptiveGroups(
        limit: ${limit}
        orderBy: [datetimeHour_ASC]
        filter: {
          datetime_geq: "${startDate}"
          datetime_lt: "${endDate}"
          requestSource: "eyeball"
        }
      ) {
        count
        dimensions {
          datetimeHour
        }
        sum {
          visits
          edgeResponseBytes
        }
      }
      
      topPaths: httpRequestsAdaptiveGroups(
        limit: 20
        orderBy: [sum_edgeResponseBytes_DESC]
        filter: {
          datetime_geq: "${startDate}"
          datetime_lt: "${endDate}"
          requestSource: "eyeball"
        }
      ) {
        count
        dimensions {
          clientRequestPath
        }
        sum {
          edgeResponseBytes
        }
      }
    }
  }
}
  `;

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !apiToken) {
    return { error: "CLOUDFLARE_ACCOUNT_ID hoặc CLOUDFLARE_API_TOKEN chưa được cấu hình trong .env.local" };
  }
  
  if (!process.env.CLOUDFLARE_ZONE_ID) {
    return { error: "CLOUDFLARE_ZONE_ID chưa được cấu hình trong .env.local" };
  }

  try {
    const data = await cloudflareGraphQL<ZoneGraphQLResponse>(
      query,
      {},
      { accountId, apiToken }
    );
    
    const zone = data?.viewer?.zones?.[0];
    const hourlyGroups = zone?.hourly ?? [];
    const topPathGroups = zone?.topPaths ?? [];
    
    let totalRequests = 0;
    let totalVisits = 0;
    let totalBytes = 0;
    
    const chartData = hourlyGroups.map(g => {
      totalRequests += g.count;
      totalVisits += g.sum.visits;
      totalBytes += g.sum.edgeResponseBytes;
      
      const d = new Date(g.dimensions.datetimeHour!);
      let label = `${d.getHours().toString().padStart(2, '0')}:00`;
      
      // Bổ sung ngày nếu khoảng thời gian dài hơn 24h
      if (period === "7d" || period === "30d") {
        label = `${d.getDate()}/${d.getMonth()+1} ${label}`;
      }
      
      return {
        time: label,
        requests: g.count,
        visits: g.sum.visits,
        bytesMB: Math.round(g.sum.edgeResponseBytes / (1024 * 1024) * 100) / 100
      };
    });
    
    const topPaths = topPathGroups.map(g => ({
      path: g.dimensions.clientRequestPath || "/",
      requests: g.count,
      bytesMB: Math.round(g.sum.edgeResponseBytes / (1024 * 1024) * 100) / 100
    }));
    
    return {
      success: true,
      data: {
        totalRequests,
        totalVisits,
        totalBytes,
        chartData,
        topPaths
      }
    };
  } catch(e: any) {
    return { error: e.message || "Lỗi khi gọi API Cloudflare GraphQL" };
  }
}
