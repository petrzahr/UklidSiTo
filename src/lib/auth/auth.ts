import { NextAuthOptions, getServerSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { getConfig } from "@/lib/config/env";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async signIn({ user }) {
      const config = getConfig();
      if (!user.email) return false;

      const userEmail = user.email.toLowerCase().trim();
      const adminEmail = config.adminEmail.toLowerCase().trim();

      if (!adminEmail) {
        console.error(
          "[Auth Error] ADMIN_EMAIL is not configured. Access denied to all accounts."
        );
        return false;
      }

      if (userEmail === adminEmail) {
        return true;
      }

      console.warn(
        `[Auth Warning] Unauthorized sign-in attempt from ${userEmail}. Only ${adminEmail} is permitted.`
      );
      return false;
    },
    async jwt({ token, user }) {
      if (user?.email) {
        token.email = user.email.toLowerCase();
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.email) {
        session.user.email = token.email as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || "development-secret-uklidsito",
};

/**
 * Server-side helper to ensure the caller is an authenticated administrator.
 * In development mode, if GOOGLE_CLIENT_ID is not configured, it can provide a mock admin
 * session so the developer can test the UI locally.
 */
export async function requireAdminSession() {
  const config = getConfig();

  // If OAuth is configured, require real session
  if (config.googleClientId && config.googleClientSecret) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      throw new Error("Unauthorized: Přihlášení vyžadováno.");
    }
    if (session.user.email.toLowerCase() !== config.adminEmail.toLowerCase()) {
      throw new Error("Forbidden: Tento Google účet nemá přístup k aplikaci.");
    }
    return session;
  }

  // Fallback for local testing without OAuth keys configured yet
  const session = await getServerSession(authOptions);
  if (session?.user?.email) {
    if (session.user.email.toLowerCase() !== config.adminEmail.toLowerCase()) {
      throw new Error("Forbidden: Tento Google účet nemá přístup k aplikaci.");
    }
    return session;
  }

  return {
    user: {
      name: "Administrátor (Dev)",
      email: config.adminEmail || "admin@example.com",
    },
  };
}
