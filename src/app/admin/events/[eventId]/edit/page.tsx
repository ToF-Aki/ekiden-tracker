'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface Event {
  id: string;
  name: string;
  date: string;
  status: string;
  link1Text: string | null;
  link1Url: string | null;
  link2Text: string | null;
  link2Url: string | null;
}

export default function EventEditPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [link1Text, setLink1Text] = useState('');
  const [link1Url, setLink1Url] = useState('');
  const [link2Text, setLink2Text] = useState('');
  const [link2Url, setLink2Url] = useState('');

  useEffect(() => {
    fetchEvent();
  }, [eventId]);

  const fetchEvent = async () => {
    try {
      const res = await fetch(`/api/events/${eventId}`);
      const data = await res.json();
      setEvent(data);
      setEventName(data.name);
      // ISO形式の日時をyyyy-MM-dd形式に変換
      const dateObj = new Date(data.date);
      const formattedDate = dateObj.toISOString().split('T')[0];
      setEventDate(formattedDate);
      setLink1Text(data.link1Text || '');
      setLink1Url(data.link1Url || '');
      setLink2Text(data.link2Text || '');
      setLink2Url(data.link2Url || '');
    } catch (error) {
      toast.error('イベントの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: eventName,
          date: new Date(eventDate).toISOString(),
          link1Text: link1Text || null,
          link1Url: link1Url || null,
          link2Text: link2Text || null,
          link2Url: link2Url || null,
        }),
      });

      if (!res.ok) {
        throw new Error('更新に失敗しました');
      }

      toast.success('イベントを更新しました');
      router.push('/admin/dashboard');
    } catch (error) {
      toast.error('イベントの更新に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setResetting(true);
    try {
      const res = await fetch(`/api/events/${eventId}/reset`, {
        method: 'POST',
      });

      if (!res.ok) {
        throw new Error('初期化に失敗しました');
      }

      const data = await res.json();
      toast.success(data.message);
      setShowResetConfirm(false);
    } catch (error) {
      toast.error('記録の初期化に失敗しました');
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-600">読み込み中...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-600">イベントが見つかりません</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-6">
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="text-blue-600 hover:text-blue-700 flex items-center space-x-1"
          >
            <span>←</span>
            <span>ダッシュボードに戻る</span>
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-6">イベント編集</h1>

          {/* イベントタイトル */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              イベントタイトル
            </label>
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="イベント名を入力"
            />
          </div>

          {/* イベント日時 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              開催日
            </label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
          </div>

          {/* リンク1 */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">リンク1</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  リンクテキスト
                </label>
                <input
                  type="text"
                  value={link1Text}
                  onChange={(e) => setLink1Text(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="例: 大会公式サイト"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  リンクURL
                </label>
                <input
                  type="url"
                  value={link1Url}
                  onChange={(e) => setLink1Url(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="https://example.com"
                />
              </div>
            </div>
          </div>

          {/* リンク2 */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">リンク2</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  リンクテキスト
                </label>
                <input
                  type="text"
                  value={link2Text}
                  onChange={(e) => setLink2Text(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="例: コース地図"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  リンクURL
                </label>
                <input
                  type="url"
                  value={link2Url}
                  onChange={(e) => setLink2Url(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="https://example.com"
                />
              </div>
            </div>
          </div>

          {/* 保存ボタン */}
          <div className="mb-6">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {saving ? '保存中...' : '保存'}
            </button>
          </div>

          {/* 記録初期化 */}
          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold mb-3 text-red-600">危険な操作</h2>
            <p className="text-sm text-gray-600 mb-3">
              すべてのチームをスタート前の状態に戻します。この操作は取り消せません。
            </p>
            {!showResetConfirm ? (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                記録を初期化
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-medium text-red-600">
                  本当に初期化しますか？すべての記録が削除されます。
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={handleReset}
                    disabled={resetting}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:bg-gray-400"
                  >
                    {resetting ? '初期化中...' : 'はい、初期化します'}
                  </button>
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    disabled={resetting}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 disabled:bg-gray-200"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
