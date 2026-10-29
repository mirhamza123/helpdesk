import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/AuthForms";
import { getSessionUser } from "@/lib/guard";

export const metadata: Metadata = { title: "Create account" };
export default async function RegisterPage() {
  if (await getSessionUser()) redirect("/dashboard");
  return (<><h1 className="mb-4 text-lg font-semibold">Create your account</h1><RegisterForm /></>);
}
