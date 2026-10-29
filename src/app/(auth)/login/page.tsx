import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/AuthForms";
import { getSessionUser } from "@/lib/guard";

export const metadata: Metadata = { title: "Sign in" };
export default async function LoginPage() {
  if (await getSessionUser()) redirect("/dashboard");
  return (<><h1 className="mb-4 text-lg font-semibold">Sign in</h1><LoginForm /></>);
}
