"use server";

import {
  getCurrentMonthRevenueDailyData,
  getCurrentMonthOrdersDailyData,
  getCurrentMonthUsersDailyData,
  getMonthlyRevenueChartData,
  getMonthlyOrdersChartData,
  getMonthlyUsersChartData,
  getDailyUploadStats,
  type MonthlyRevenuePoint,
  type MonthlyOrdersPoint,
  type MonthlyUsersPoint,
  type DailyUploadStats,
} from "@/lib/queries";

export async function getMonthlyAnalyticsAction(months: number): Promise<{
  revenueData: MonthlyRevenuePoint[];
  ordersData: MonthlyOrdersPoint[];
  usersData: MonthlyUsersPoint[];
}> {
  const safeMonths = [1, 3, 6, 12].includes(months) ? months : 1;

  if (safeMonths === 1) {
    const [revenueData, ordersData, usersData] = await Promise.all([
      getCurrentMonthRevenueDailyData().catch(() => []),
      getCurrentMonthOrdersDailyData().catch(() => []),
      getCurrentMonthUsersDailyData().catch(() => []),
    ]);
    return { revenueData, ordersData, usersData };
  }

  const [revenueData, ordersData, usersData] = await Promise.all([
    getMonthlyRevenueChartData(safeMonths).catch(() => []),
    getMonthlyOrdersChartData(safeMonths).catch(() => []),
    getMonthlyUsersChartData(safeMonths).catch(() => []),
  ]);

  return { revenueData, ordersData, usersData };
}

export async function getDailyUploadStatsAction(date: string): Promise<DailyUploadStats> {
  return await getDailyUploadStats(date);
}

