import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-gray-800 mb-8">
          駅伝速報システム
        </h1>
        <p className="text-xl text-gray-600 mb-12">
          リアルタイムで駅伝大会の進行状況を配信
        </p>
        <div className="space-x-4">
          <Link
            href="/admin/login"
            className="inline-block bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition"
          >
            管理画面
          </Link>
        </div>
      </div>
    </div>
  );
}




