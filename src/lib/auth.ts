import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'ユーザー名', type: 'text' },
        password: { label: 'パスワード', type: 'password' },
      },
      async authorize(credentials) {
        // ひとまずadmin/admin123で通す（デバッグ用）
        if (credentials?.username === "admin" && credentials?.password === "admin123") {
          return { id: "1", name: "Admin" };
        }
        return null;
      },
    }),
  ],

  // ← ここが重要: 明示的にsecretを渡す（v4はNEXTAUTH_*が正）
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,

  pages: {
    signIn: '/admin/login',
  },
  session: { strategy: 'jwt' },

  // v4では未定義でも害なし（v5相当）
  // @ts-expect-error
  trustHost: true,
};