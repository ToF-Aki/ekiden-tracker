// 実行プロセスにENVが来ているか即時判定用エンドポイント
export const runtime = "nodejs";

export async function GET() {
  return new Response(
    JSON.stringify({
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      AUTH_SECRET: !!process.env.AUTH_SECRET,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      AUTH_URL: process.env.AUTH_URL,
      NODE_ENV: process.env.NODE_ENV,
    }),
    { headers: { "content-type": "application/json" } }
  );
}
