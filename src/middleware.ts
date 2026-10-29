import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

export default NextAuth(authConfig).auth;

// API routes are excluded on purpose: each one authenticates/authorises itself and returns JSON errors.
export const config = { matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"] };
