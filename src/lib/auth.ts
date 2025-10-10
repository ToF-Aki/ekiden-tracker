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
  // 緊急対応：環境変数が読み込めない場合のフォールバック
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET ?? 'Zi1rJjyrFz8eXthbtzJa696Cky3yplVvfzn3W0RjgCM=',

  pages: {
    signIn: '/admin/login',
  },
  session: { strategy: 'jwt' },

  // v4では未定義でも害なし（v5相当）
  // @ts-expect-error
  trustHost: true,
};