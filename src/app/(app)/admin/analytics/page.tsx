import type { Metadata } from "next";
import { requirePageUser } from "@/lib/guard";
import { getAnalytics } from "@/lib/analytics";
import { AnalyticsCharts } from "@/components/AnalyticsCharts";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  await requirePageUser(["admin"]);
  return (<><PageHeader title="Analytics" /><AnalyticsCharts data={await getAnalytics()} /></>);
}
