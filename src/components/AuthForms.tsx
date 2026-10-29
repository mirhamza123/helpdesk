"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { loginSchema, registerSchema } from "@/lib/validators";
import { api } from "@/lib/client";
import { Alert } from "./ui";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsed = loginSchema.safeParse(Object.fromEntries(new FormData(e.currentTarget)));
    if (!parsed.success) return setError(parsed.error.issues[0].message);
    setBusy(true); setError("");
    const res = await signIn("credentials", { ...parsed.data, redirect: false });
    setBusy(false);
    if (res?.code === "too_many_attempts") return setError("Too many sign-in attempts. Please wait 15 minutes and try again.");
    if (res?.error) return setError("Incorrect email or password, or the account is disabled.");
    router.push("/dashboard"); router.refresh();
  }
  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {error && <Alert>{error}</Alert>}
      <div><label className="label" htmlFor="email">Email</label><input id="email" name="email" type="email" autoComplete="email" className="input" /></div>
      <div><label className="label" htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete="current-password" className="input" /></div>
      <button className="btn-primary w-full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
      <p className="text-center text-sm text-ink-500">No account? <Link className="font-medium text-brand-600 hover:underline" href="/register">Create one</Link></p>
    </form>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsed = registerSchema.safeParse(Object.fromEntries(new FormData(e.currentTarget)));
    if (!parsed.success) return setErrors(parsed.error.flatten().fieldErrors);
    setErrors({}); setError(""); setBusy(true);
    const res = await api("/api/register", "POST", parsed.data);
    if (!res.ok) { setBusy(false); setErrors(res.fieldErrors ?? {}); return setError(res.error); }
    const login = await signIn("credentials", { email: parsed.data.email, password: parsed.data.password, redirect: false });
    setBusy(false);
    router.push(login?.error ? "/login" : "/dashboard"); router.refresh();
  }
  const f = (id: string, label: string, type = "text", auto?: string) => (
    <div><label className="label" htmlFor={id}>{label}</label>
      <input id={id} name={id} type={type} autoComplete={auto} className="input" />
      {errors[id]?.[0] && <p className="field-error">{errors[id][0]}</p>}</div>
  );
  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {error && <Alert>{error}</Alert>}
      {f("name", "Full name", "text", "name")}{f("email", "Email", "email", "email")}
      {f("password", "Password", "password", "new-password")}{f("confirmPassword", "Confirm password", "password", "new-password")}
      <p className="text-xs text-ink-500">At least 8 characters, with a letter and a number.</p>
      <button className="btn-primary w-full" disabled={busy}>{busy ? "Creating account…" : "Create account"}</button>
      <p className="text-center text-sm text-ink-500">Already registered? <Link className="font-medium text-brand-600 hover:underline" href="/login">Sign in</Link></p>
    </form>
  );
}
