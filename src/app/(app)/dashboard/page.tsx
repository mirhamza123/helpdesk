import { redirect } from "next/navigation";
import { requirePageUser } from "@/lib/guard";

export default async function Dashboard() {
  const user = await requirePageUser();
  redirect(user.role === "admin" ? "/admin/analytics" : "/tickets");
}
