'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { useSocket } from '@/hooks/useSocket';

interface Event {
  id: string;
  name: string;
  teams: Array<{
    id: string;
    teamNumber: number;
    teamName: string;
  }>;
  checkpoints: Array<{
    id: string;
    distance: number;
    name: string;
  }>;
}

export default function CheckpointPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const [event, setEvent] = useState<Event | null>(null);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<number>(1);
  const [teamNumber, setTeamNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { socket, isConnected } = useSocket(eventId);

  useEffect(() => {
    fetchEvent();

    // 自動ポーリング: 15秒ごとにイベントデータを再取得
    const interval = setInterval(() => {
      fetchEvent();
    }, 15000); // 15秒

    return () => {
      clearInterval(interval);
    };
  }, [eventId]);

  const fetchEvent = async () => {
    try {
      const res = await fetch(`/api/events/${eventId}`);
      const data = await res.json();
      setEvent(data);
    } catch (error) {
      toast.error('イベントの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch(`/api/events/${eventId}/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamNumber,
          checkpointDistance: selectedCheckpoint,
        }),
      });

      if (res.ok) {
        const data = await res.json();

        // 自動補完された記録がある場合はメッセージを表示
        if (data.autoCompleted > 0) {
          toast.success(
            `ゼッケン${teamNumber}番を記録しました\n前の地点${data.autoCompleted}箇所も自動補完しました`,
            { duration: 4000 }
          );
        } else {
          toast.success(`ゼッケン${teamNumber}番を記録しました`);
        }

        setTeamNumber('');

        // WebSocketで通知
        if (socket) {
          socket.emit('record-created', { eventId, record: data });
        }
      } else {
        const error = await res.json();
        toast.error(error.error || '記録の登録に失敗しました');
      }
    } catch (error) {
      toast.error('エラーが発生しました');
    } finally {
      setSubmitting(false);
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {event.name}
            </h1>
            <p className="text-lg text-gray-600">通過記録入力</p>
            <div className="mt-4">
              <span
                className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
                  isConnected
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {isConnected ? '接続中' : '未接続'}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-4">
                チェックポイント選択
              </label>
              <div className="grid grid-cols-2 gap-4">
                {event.checkpoints.map((checkpoint) => (
                  <button
                    key={checkpoint.id}
                    type="button"
                    onClick={() => setSelectedCheckpoint(checkpoint.distance)}
                    className={`p-6 rounded-xl text-xl font-bold transition-all ${
                      selectedCheckpoint === checkpoint.distance
                        ? 'bg-blue-600 text-white shadow-lg scale-105'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {checkpoint.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-4">
                ゼッケン番号入力
              </label>
              <input
                type="number"
                value={teamNumber}
                onChange={(e) => setTeamNumber(e.target.value)}
                placeholder="ゼッケン番号"
                className="w-full px-6 py-4 text-3xl text-center border-4 border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-bold"
                required
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-green-600 text-white py-6 rounded-xl text-2xl font-bold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {submitting ? '記録中...' : '通過記録'}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">
              参加チーム一覧
            </h3>
            <div className="grid grid-cols-5 gap-2 max-h-64 overflow-y-auto">
              {event.teams.map((team) => (
                <button
                  key={team.id}
                  onClick={() => setTeamNumber(team.teamNumber.toString())}
                  className="p-3 bg-gray-100 hover:bg-blue-100 rounded-lg text-center transition"
                >
                  <div className="text-2xl font-bold text-gray-800">
                    {team.teamNumber}
                  </div>
                  <div className="text-xs text-gray-600 truncate">
                    {team.teamName}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}




