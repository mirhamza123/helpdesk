import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";
import { connectDB } from "@/lib/db";
import { User } from "@/models";
import { loginSchema } from "@/lib/validators";
import { rateLimit } from "@/lib/rate-limit";

class TooManyLoginAttempts extends CredentialsSignin {
  code = "too_many_attempts";
}

// Used to keep response time constant when the account doesn't exist.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 12);

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;
        if (!rateLimit(`login:${email}`, 8, 15 * 60_000)) throw new TooManyLoginAttempts();

        await connectDB();
        const user = await User.findOne({ email }).select("+password");
        const ok = await bcrypt.compare(password, user?.password ?? DUMMY_HASH);
        if (!user || !ok || !user.active) return null;
        return { id: user.id, name: user.name, email: user.email, role: user.role };
      },
    }),
  ],
});
