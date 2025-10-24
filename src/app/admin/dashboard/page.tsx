'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface Event {
  id: string;
  name: string;
  date: string;
  status: string;
  teams: any[];
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEventName, setNewEventName] = useState('');
  const [newEventDate, setNewEventDate] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchEvents();
    }
  }, [status]);

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/events');

      if (!res.ok) {
        throw new Error('Failed to fetch events');
      }

      const data = await res.json();

      // データが配列であることを確認
      if (Array.isArray(data)) {
        setEvents(data);
      } else {
        console.error('Invalid data format:', data);
        setEvents([]);
        toast.error('データの形式が正しくありません');
      }
    } catch (error) {
      console.error('Fetch events error:', error);
      setEvents([]);
      toast.error('イベントの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newEventName,
          date: newEventDate,
        }),
      });

      if (res.ok) {
        toast.success('イベントを作成しました');
        setShowCreateModal(false);
        setNewEventName('');
        setNewEventDate('');
        fetchEvents();
      } else {
        toast.error('イベントの作成に失敗しました');
      }
    } catch (error) {
      toast.error('エラーが発生しました');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('このイベントを削除してもよろしいですか?')) return;

    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('イベントを削除しました');
        fetchEvents();
      } else {
        toast.error('イベントの削除に失敗しました');
      }
    } catch (error) {
      toast.error('エラーが発生しました');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">管理画面</h1>
            <div className="text-gray-600">
              ようこそ、{session?.user?.name}さん
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">イベント一覧</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            新規イベント作成
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <div key={event.id} className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {event.name}
              </h3>
              <p className="text-gray-600 mb-2">
                日時: {format(new Date(event.date), 'yyyy/MM/dd')}
              </p>
              <p className="text-gray-600 mb-4">
                チーム数: {event.teams.length}
              </p>
              <div className="space-y-2">
                <Link
                  href={`/admin/events/${event.id}`}
                  className="block w-full text-center bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                >
                  チーム管理
                </Link>
                <Link
                  href={`/admin/events/${event.id}/records`}
                  className="block w-full text-center bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
                >
                  記録管理
                </Link>
                <Link
                  href={`/admin/events/${event.id}/edit`}
                  className="block w-full text-center bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 transition"
                >
                  イベント編集
                </Link>
                <Link
                  href={`/checkpoint/${event.id}`}
                  className="block w-full text-center bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
                >
                  入力画面
                </Link>
                <Link
                  href={`/live/${event.id}`}
                  className="block w-full text-center bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition"
                >
                  速報画面
                </Link>
                <button
                  onClick={() => handleDeleteEvent(event.id)}
                  className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
                >
                  削除
                </button>
              </div>
            </div>
          ))}
        </div>

        {events.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            イベントがありません。新規作成してください。
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">
              新規イベント作成
            </h2>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  イベント名
                </label>
                <input
                  type="text"
                  value={newEventName}
                  onChange={(e) => setNewEventName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  開催日
                </label>
                <input
                  type="date"
                  value={newEventDate}
                  onChange={(e) => setNewEventDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                  required
                />
              </div>
              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  作成
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition"
                >
                  キャンセル
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}




