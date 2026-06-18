import type { Metadata } from "next";

export const revalidate = 30;

import DashboardClient from "@/components/dashboard/dashboard-client";

import { getDashboardViewData } from "@/lib/dashboard-queries";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Operational overview of result review and parent delivery.",
};

export default async function DashboardPage() {
  const data = await getDashboardViewData();
  return <DashboardClient data={data} />;
}
