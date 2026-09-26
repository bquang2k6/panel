import { cloudflareGraphQL } from "./client";
import { R2_ANALYTICS_QUERY } from "./queries";

export type R2OperationGroup = {
  sum: {
    requests: number;
    responseBytes?: number;
  };
  dimensions: {
    actionType: string;
    date?: string;
  };
};

export type R2StorageGroup = {
  max: {
    objectCount: number;
    payloadSize: number;
  };
  dimensions: {
    bucketName?: string;
    date?: string;
  };
};

export type R2GraphQLResponse = {
  viewer: {
    accounts: Array<{
      r2OperationsAdaptiveGroups?: R2OperationGroup[];
      r2StorageAdaptiveGroups?: R2StorageGroup[];
    }>;
  };
};

export type R2Category = "Class A" | "Class B" | "Free";

export const CLASS_A_ACTIONS = new Set([
  "PutObject",
  "CopyObject",
  "CreateMultipartUpload",
  "UploadPart",
  "CompleteMultipartUpload",
  "AbortMultipartUpload",
  "ListObjects",
  "ListObjectsV2",
  "ListBuckets",
  "PutBucketCors",
  "PutBucketLifecycle",
  "PutObjectTagging",
  "PutBucketEncryption",
]);

export const CLASS_B_ACTIONS = new Set([
  "GetObject",
  "HeadObject",
  "HeadBucket",
  "GetBucketLocation",
  "GetBucketCors",
]);

export function classifyAction(actionType: string): R2Category {
  if (CLASS_A_ACTIONS.has(actionType)) return "Class A";
  if (CLASS_B_ACTIONS.has(actionType)) return "Class B";
  return "Free";
}

export type R2StorageConfig = {
  id: string;
  name: string;
  accountId: string;
  apiToken: string;
  bucketName: string;
  billingDay: number;
};

export function calculateBillingCycle(billingDay: number = 19, refDate: Date = new Date()) {
  const now = new Date(refDate);
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDay = now.getDate();

  const bDay = Math.min(Math.max(1, Number(billingDay) || 19), 28);

  let startDate: Date;
  let endDate: Date;

  if (currentDay >= bDay) {
    startDate = new Date(currentYear, currentMonth, bDay, 0, 0, 0, 0);
    endDate = new Date(currentYear, currentMonth + 1, bDay, 23, 59, 59, 999);
  } else {
    startDate = new Date(currentYear, currentMonth - 1, bDay, 0, 0, 0, 0);
    endDate = new Date(currentYear, currentMonth, bDay, 23, 59, 59, 999);
  }

  const formatDate = (d: Date) => {
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const label = `${formatDate(startDate)} - ${formatDate(endDate)}`;

  return {
    startDate,
    endDate,
    label,
    bDay,
  };
}

export function getR2StorageConfigs(): R2StorageConfig[] {
  // Primary configuration format: CLOUDFLARE_STORAGES JSON string
  if (process.env.CLOUDFLARE_STORAGES) {
    try {
      const parsed = JSON.parse(process.env.CLOUDFLARE_STORAGES);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item: any, index: number) => ({
          id: item.id || `storage-${index + 1}`,
          name: item.name || `Storage ${index + 1} (${item.bucketName || "R2"})`,
          accountId: item.accountId || "",
          apiToken: item.apiToken || "",
          bucketName: item.bucketName || "",
          billingDay: Number(item.billingDay) || 19,
        }));
      }
    } catch (e) {
      console.warn("Failed to parse CLOUDFLARE_STORAGES env variable:", e);
    }
  }

  // Fallback if CLOUDFLARE_STORAGES is not set
  const primaryAccountId = process.env.CLOUDFLARE_ACCOUNT_ID || "";
  const primaryApiToken = process.env.CLOUDFLARE_API_TOKEN || "";
  const primaryBucket = process.env.CLOUDFLARE_R2_BUCKET || "mycloud";

  return [
    {
      id: "storage-main",
      name: `Storage Main (${primaryBucket})`,
      accountId: primaryAccountId,
      apiToken: primaryApiToken,
      bucketName: primaryBucket,
      billingDay: 19,
    },
  ];
}

export type R2ProcessedAnalytics = {
  isConfigured: boolean;
  errorMessage?: string;
  bucketName: string;
  activeStorageId: string;
  billingDay: number;
  billingCycleLabel: string;
  availableStorages: Array<{ id: string; name: string; bucketName: string; billingDay: number }>;
  summary: {
    totalRequests: number;
    classA: number;
    classB: number;
    freeOps: number;
    egressBytes: number;
    storageBytes: number;
    totalObjects: number;
  };
  operations: Array<{
    actionType: string;
    category: R2Category;
    requests: number;
    percentage: number;
  }>;
  chartData: Array<{
    date: string;
    classA: number;
    classB: number;
    freeOps: number;
    total: number;
    egressMB: number;
  }>;
};


export async function getR2Operations({
  storageId,
  bucketName,
  startDate,
  endDate,
}: {
  storageId?: string;
  bucketName?: string;
  startDate?: string;
  endDate?: string;
}): Promise<R2ProcessedAnalytics> {
  const configs = getR2StorageConfigs();
  const selectedConfig = configs.find((c) => c.id === storageId) || configs[0];

  const availableStorages = configs.map((c) => ({
    id: c.id,
    name: c.name,
    bucketName: c.bucketName,
    billingDay: c.billingDay,
  }));

  const accountId = selectedConfig.accountId;
  const apiToken = selectedConfig.apiToken;
  const targetBucket = bucketName || selectedConfig.bucketName || "";

  const isEnvPresent = !!(accountId && apiToken);

  if (!isEnvPresent) {
    return getMockR2Analytics(
      targetBucket,
      false,
      `CLOUDFLARE_ACCOUNT_ID hoặc CLOUDFLARE_API_TOKEN cho ${selectedConfig.name} chưa được cấu hình trong .env`,
      availableStorages,
      selectedConfig.id,
    );
  }

  try {
    const data = await cloudflareGraphQL<R2GraphQLResponse>(
      R2_ANALYTICS_QUERY,
      {
        bucketName: targetBucket || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      },
      { accountId, apiToken },
    );

    const account = data.viewer?.accounts?.[0];
    if (!account) {
      throw new Error(
        `Cloudflare API không trả về account tương ứng với accountTag: ${accountId}`,
      );
    }

    const ops = account?.r2OperationsAdaptiveGroups ?? [];
    const storage = account?.r2StorageAdaptiveGroups ?? [];

    return processR2Data(
      ops,
      storage,
      targetBucket,
      true,
      availableStorages,
      selectedConfig.id,
      selectedConfig.billingDay,
    );
  } catch (error: any) {
    const errorMsg =
      error?.message || "Không thể kết nối đến Cloudflare GraphQL API";
    console.error("Cloudflare R2 Analytics API Error:", errorMsg);
    return getMockR2Analytics(
      targetBucket,
      true,
      errorMsg,
      availableStorages,
      selectedConfig.id,
      selectedConfig.billingDay,
    );
  }
}

function processR2Data(
  ops: R2OperationGroup[],
  storage: R2StorageGroup[],
  bucketName: string,
  isConfigured: boolean,
  availableStorages: Array<{ id: string; name: string; bucketName: string; billingDay: number }>,
  activeStorageId: string,
  billingDay: number = 19,
): R2ProcessedAnalytics {
  let totalRequests = 0;
  let classA = 0;
  let classB = 0;
  let freeOps = 0;
  let egressBytes = 0;

  const billingCycle = calculateBillingCycle(billingDay);

  const actionMap: Record<string, number> = {};
  const dateMap: Record<
    string,
    {
      classA: number;
      classB: number;
      freeOps: number;
      total: number;
      egressMB: number;
    }
  > = {};

  ops.forEach((item) => {
    const count = Number(item.sum?.requests || 0);
    const bytes = Number(item.sum?.responseBytes || 0);
    const action = item.dimensions?.actionType || "Unknown";
    const dateStr =
      item.dimensions?.date || new Date().toISOString().slice(0, 10);
    const category = classifyAction(action);

    totalRequests += count;
    egressBytes += bytes;
    actionMap[action] = (actionMap[action] || 0) + count;

    if (category === "Class A") classA += count;
    else if (category === "Class B") classB += count;
    else freeOps += count;

    if (!dateMap[dateStr]) {
      dateMap[dateStr] = {
        classA: 0,
        classB: 0,
        freeOps: 0,
        total: 0,
        egressMB: 0,
      };
    }

    dateMap[dateStr].total += count;
    dateMap[dateStr].egressMB +=
      Math.round((bytes / (1024 * 1024)) * 100) / 100;
    if (category === "Class A") dateMap[dateStr].classA += count;
    else if (category === "Class B") dateMap[dateStr].classB += count;
    else dateMap[dateStr].freeOps += count;
  });

  const operations = Object.entries(actionMap)
    .map(([actionType, requests]) => ({
      actionType,
      category: classifyAction(actionType),
      requests,
      percentage:
        totalRequests > 0
          ? Math.round((requests / totalRequests) * 1000) / 10
          : 0,
    }))
    .sort((a, b) => b.requests - a.requests);

  const chartData = Object.entries(dateMap)
    .map(([date, metrics]) => ({
      date: date.length > 5 ? date.slice(5) : date,
      ...metrics,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // If chartData is empty, add today
  if (chartData.length === 0) {
    const today = new Date().toISOString().slice(5, 10);
    chartData.push({
      date: today,
      classA,
      classB,
      freeOps,
      total: totalRequests,
      egressMB: Math.round((egressBytes / (1024 * 1024)) * 100) / 100,
    });
  }

  // Storage info
  let storageBytes = 0;
  let totalObjects = 0;
  storage.forEach((item) => {
    if (item.max?.payloadSize > storageBytes)
      storageBytes = item.max.payloadSize;
    if (item.max?.objectCount > totalObjects)
      totalObjects = item.max.objectCount;
  });

  return {
    isConfigured,
    bucketName,
    activeStorageId,
    billingDay,
    billingCycleLabel: billingCycle.label,
    availableStorages,
    summary: {
      totalRequests,
      classA,
      classB,
      freeOps,
      egressBytes,
      storageBytes,
      totalObjects,
    },
    operations,
    chartData,
  };
}

export function getMockR2Analytics(
  bucketName = "locket-wan-media",
  isConfigured = false,
  errorMessage?: string,
  availableStorages: Array<{ id: string; name: string; bucketName: string; billingDay: number }> = [
    {
      id: "storage-main",
      name: "Tài khoản 1 (mycloud)",
      bucketName: "mycloud",
      billingDay: 19,
    },
  ],
  activeStorageId = "storage-main",
  billingDay: number = 19,
): R2ProcessedAnalytics {
  const billingCycle = calculateBillingCycle(billingDay);

  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(5, 10);
  });

  const chartData = dates.map((date, idx) => {
    const base = (idx + 1) * 45;
    const classB = base * 12 + Math.floor(Math.random() * 80);
    const classA = base * 3 + Math.floor(Math.random() * 30);
    const freeOps = Math.floor(Math.random() * 15);
    const total = classA + classB + freeOps;
    const egressMB = Math.round(total * 1.8 * 10) / 10;
    return { date, classA, classB, freeOps, total, egressMB };
  });

  const totalRequests = chartData.reduce((acc, d) => acc + d.total, 0);
  const classA = chartData.reduce((acc, d) => acc + d.classA, 0);
  const classB = chartData.reduce((acc, d) => acc + d.classB, 0);
  const freeOps = chartData.reduce((acc, d) => acc + d.freeOps, 0);
  const egressBytes = Math.round(
    chartData.reduce((acc, d) => acc + d.egressMB, 0) * 1024 * 1024,
  );

  return {
    isConfigured,
    errorMessage,
    bucketName: bucketName || "mycloud",
    activeStorageId,
    billingDay,
    billingCycleLabel: billingCycle.label,
    availableStorages,
    summary: {
      totalRequests,
      classA,
      classB,
      freeOps,
      egressBytes,
      storageBytes: 14.8 * 1024 * 1024 * 1024, // ~14.8 GB
      totalObjects: 48920,
    },
    operations: [
      {
        actionType: "GetObject",
        category: "Class B",
        requests: classB,
        percentage: Math.round((classB / totalRequests) * 1000) / 10,
      },
      {
        actionType: "PutObject",
        category: "Class A",
        requests: Math.round(classA * 0.7),
        percentage: Math.round(((classA * 0.7) / totalRequests) * 1000) / 10,
      },
      {
        actionType: "ListObjectsV2",
        category: "Class A",
        requests: Math.round(classA * 0.3),
        percentage: Math.round(((classA * 0.3) / totalRequests) * 1000) / 10,
      },
      {
        actionType: "DeleteObject",
        category: "Free",
        requests: freeOps,
        percentage: Math.round((freeOps / totalRequests) * 1000) / 10,
      },
    ],
    chartData,
  };
}

