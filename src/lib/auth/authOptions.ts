import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

/**
 * NextAuth configuration options
 * Uses the backend JWT authentication system
 */
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          // Login to backend and get JWT
          const backendUrl =
            process.env.BACKEND_AUTH_URL ||
            `${process.env.NEXT_PUBLIC_API_URL}/api/auth`;

          const res = await fetch(`${backendUrl}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: credentials?.username,
              password: credentials?.password,
            }),
          });

          const data = await res.json();

          if (res.ok && data.ok && data.token) {
            // Return user with JWT token
            return {
              id: data.user?.id || credentials?.username || "user",
              name: data.user?.username || credentials?.username,
              email: `${data.user?.username || credentials?.username}@sarislabs.com`,
              role: data.user?.role || "user",
              accessToken: data.token,
            };
          }

          // Authentication failed
          console.error("Auth failed:", data.error || "Unknown error");
          return null;
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours (matches backend JWT expiry)
  },
  callbacks: {
    async jwt({ token, user }) {
      // Persist backend JWT in the NextAuth token
      if (user) {
        token.role = user.role;
        token.accessToken = user.accessToken;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      // Make JWT available in session for API calls
      if (session.user) {
        session.user.role = token.role as string;
        (session.user as { id?: string }).id = token.id as string;
      }
      session.accessToken = token.accessToken as string;
      return session;
    },
  },
  debug: process.env.NODE_ENV === "development",
};
