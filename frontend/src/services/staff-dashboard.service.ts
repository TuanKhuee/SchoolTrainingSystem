import { httpClient } from "@/lib/http-client";

export interface DashboardStats {
    totalProducts: number;
    todayOrders: number;
    totalCustomers: number;
    revenueStats: { date: string; revenue: number }[];
    topProducts: { name: string; sold: number }[];
    stockDistribution: { name: string; value: number; fill: string }[];
    monthlyRevenueStats: { date: string; revenue: number }[];
}

export const staffDashboardService = {
    async getStats(): Promise<DashboardStats> {
        return httpClient<DashboardStats>("/staff/dashboard/stats");
    },
};
