import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';

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
        if (!cred?.username || !cred?.password) {
          return null;
        }

        // データベースからユーザーを検索
        const user = await prisma.user.findUnique({
          where: { username: cred.username },
        });

        // ユーザーが存在しない場合は作成（初回ログイン時）
        if (!user && cred.username === "admin" && cred.password === "admin123") {
          const hashedPassword = await bcrypt.hash(cred.password, 10);
          const newUser = await prisma.user.create({
            data: {
              username: cred.username,
              password: hashedPassword,
              name: '管理者',
            },
          });
          return { id: newUser.id, name: newUser.name, email: "admin@example.com" };
        }

        // パスワード検証
        if (user && await bcrypt.compare(cred.password, user.password)) {
          return { id: user.id, name: user.name, email: "admin@example.com" };
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