import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

// 本番ドメインを固定（ENVが直るまでの暫定）
const BASE_URL = "https://www.ekiden-tracker.com";

const FALLBACK_SECRET = "TEMP-ONLY-change-me-0123456789"; // 後で必ず削除

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
  // 本番ENVがない間はフォールバックで必ず起動
  secret:
    process.env.NEXTAUTH_SECRET ||
    process.env.AUTH_SECRET ||
    FALLBACK_SECRET,

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