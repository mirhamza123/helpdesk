import type { NextAuthConfig } from "next-auth";
import type { Role } from "@/lib/constants";

/** Edge-safe config (no DB / bcrypt) — shared by middleware and the full Auth.js instance. */
export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
  providers: [],
  callbacks: {
    // First line of defence (middleware). Every page and API route re-checks on the server too.
    authorized({ auth, request: { nextUrl } }) {
      const user = auth?.user;
      const path = nextUrl.pathname;
      // The server page checks whether a session still belongs to an active DB user.
      // Do not redirect from these pages based on a possibly stale JWT.
      if (path === "/login" || path === "/register") return true;
      if (path === "/") return true;
      if (!user) return false;
      if (path.startsWith("/admin") && user.role !== "admin") return Response.redirect(new URL("/dashboard", nextUrl));
      if (path.startsWith("/tickets/new") && user.role !== "user") return Response.redirect(new URL("/dashboard", nextUrl));
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as Role;
      return session;
    },
  },
} satisfies NextAuthConfig;
