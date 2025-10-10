import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

// デバッグ用：環境変数の確認
console.log('NextAuth Environment Variables:');
console.log('NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT SET');
console.log('AUTH_SECRET:', process.env.AUTH_SECRET ? 'SET' : 'NOT SET');
console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
console.log('AUTH_URL:', process.env.AUTH_URL);

export const authOptions: NextAuthOptions = {
  debug: process.env.NODE_ENV === 'development',
  // 複数の方法でsecretを設定
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || 'Zi1rJjyrFz8eXthbtzJa696Cky3yplVvfzn3W0RjgCM=',
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'ユーザー名', type: 'text' },
        password: { label: 'パスワード', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { username: credentials.username },
        });

        if (!user) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          username: user.username,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = (user as any).username;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).username = token.username;
      }
      return session;
    },
  },
  pages: {
    signIn: '/admin/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || 'Zi1rJjyrFz8eXthbtzJa696Cky3yplVvfzn3W0RjgCM=',
};
