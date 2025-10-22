import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        username: { label: "ユーザー名", type: "text" },
        password: { label: "パスワード", type: "password" },
      },
      async authorize(cred) {
        if (cred?.username === "admin" && cred?.password === "admin123") {
          return { id: "1", name: "Admin", email: "admin@example.com" };
        }
        return null;
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,

  pages: {
    signIn: '/admin/login',
  },
  session: { strategy: 'jwt' },

  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = (user as any).id ?? "1"; // Credentialsの固定ユーザなら "1"
      return token;
    },
    async session({ session, token }) {
      if (session.user && token?.id) {
        (session.user as any).id = token.id;
      }
      return session;
    },
  },

  // v4では未定義でも害なし（v5相当）
  // @ts-expect-error
  trustHost: true,
};