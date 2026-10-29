import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/guard";

export default async function Home() {
  redirect((await getSessionUser()) ? "/dashboard" : "/login");
}
