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
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<number | null>(null);
  const [selectedTeamNumbers, setSelectedTeamNumbers] = useState<number[]>([]);
  const [manualInput, setManualInput] = useState('');
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

  // チーム番号を追加
  const addTeamNumber = (num: number) => {
    if (!selectedTeamNumbers.includes(num)) {
      setSelectedTeamNumbers([...selectedTeamNumbers, num]);
    }
  };

  // チーム番号を削除
  const removeTeamNumber = (num: number) => {
    setSelectedTeamNumbers(selectedTeamNumbers.filter(n => n !== num));
  };

  // 手動入力から追加
  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(manualInput);
    if (!isNaN(num) && num > 0) {
      addTeamNumber(num);
      setManualInput('');
    }
  };

  // 一括記録（バッチAPI使用で高速化）
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedTeamNumbers.length === 0) {
      toast.error('ゼッケン番号を選択してください');
      return;
    }

    setSubmitting(true);

    try {
      // 1回のリクエストで全チームを記録（超高速！）
      const res = await fetch(`/api/events/${eventId}/records/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamNumbers: selectedTeamNumbers,
          checkpointDistance: selectedCheckpoint,
        }),
      });

      if (res.ok) {
        const data = await res.json();

        // 成功した記録をWebSocketで通知
        if (socket && data.results) {
          data.results.forEach((result: any) => {
            if (result.success) {
              socket.emit('record-created', { eventId, record: result.record });
            }
          });
        }

        // 結果を表示
        if (data.success > 0) {
          toast.success(`${data.success}チームを記録しました`, { duration: 3000 });
        }
        if (data.failed > 0) {
          data.errors.forEach((err: any) => {
            toast.error(`ゼッケン${err.teamNumber}: ${err.error}`, { duration: 5000 });
          });
        }

        // 成功したチームをリストから削除
        if (data.success > 0) {
          setSelectedTeamNumbers([]);
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

  // 担当地点が未選択の場合は、選択画面を表示
  if (selectedCheckpoint === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4 sm:p-6 md:p-8 flex items-center justify-center">
        <div className="max-w-4xl w-full">
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 md:p-10">
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-2">
                {event.name}
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 mb-3 sm:mb-4">通過記録入力</p>
              <p className="text-base sm:text-lg font-semibold text-blue-600">担当地点を選択してください</p>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:gap-6 md:gap-8">
              {event.checkpoints.map((checkpoint) => (
                <button
                  key={checkpoint.id}
                  onClick={() => setSelectedCheckpoint(checkpoint.distance)}
                  className="p-8 sm:p-10 md:p-12 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-2xl text-2xl sm:text-3xl md:text-4xl font-bold transition-all hover:scale-105 shadow-lg active:scale-95"
                >
                  {checkpoint.name}
                  <div className="text-xs sm:text-sm font-normal mt-2 opacity-90">担当</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 担当地点が選択済みの場合は、入力画面を表示
  const selectedCheckpointName = event.checkpoints.find(
    (cp) => cp.distance === selectedCheckpoint
  )?.name || '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-3 sm:p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 md:p-8">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-3 sm:mb-4">
              {event.name}
            </h1>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
              <div className="bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl text-lg sm:text-xl font-bold">
                {selectedCheckpointName} 担当
              </div>
              <button
                onClick={() => {
                  setSelectedCheckpoint(null);
                  setSelectedTeamNumbers([]);
                  setManualInput('');
                }}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition active:bg-gray-400"
              >
                地点変更
              </button>
            </div>
          </div>

          {/* 選択されたゼッケン番号表示 */}
          {selectedTeamNumbers.length > 0 && (
            <div className="mb-6">
              <label className="block text-lg font-semibold text-gray-700 mb-3">
                選択中のゼッケン番号 ({selectedTeamNumbers.length}チーム)
              </label>
              <div className="flex flex-wrap gap-2">
                {selectedTeamNumbers.map((num) => (
                  <div
                    key={num}
                    className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg font-bold text-lg flex items-center gap-2"
                  >
                    <span>{num}</span>
                    <button
                      onClick={() => removeTeamNumber(num)}
                      className="text-red-600 hover:text-red-800 font-bold"
                      type="button"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setSelectedTeamNumbers([])}
                className="mt-3 text-sm text-red-600 hover:text-red-800 font-medium"
                type="button"
              >
                すべてクリア
              </button>
            </div>
          )}

          {/* 手動入力フォーム */}
          <form onSubmit={handleManualAdd} className="mb-4 sm:mb-6">
            <label className="block text-base sm:text-lg font-semibold text-gray-700 mb-3 sm:mb-4">
              ゼッケン番号を手動入力
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="番号を入力"
                className="flex-1 px-4 sm:px-6 py-3 sm:py-4 text-2xl sm:text-3xl text-center border-4 border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-bold"
                autoFocus
              />
              <button
                type="submit"
                className="px-4 sm:px-6 bg-blue-600 text-white rounded-xl text-lg sm:text-xl font-bold hover:bg-blue-700 transition active:bg-blue-800"
              >
                追加
              </button>
            </div>
          </form>

          {/* 一括記録ボタン */}
          <button
            onClick={handleSubmit}
            disabled={submitting || selectedTeamNumbers.length === 0}
            className="w-full bg-green-600 text-white py-4 sm:py-6 rounded-xl text-xl sm:text-2xl font-bold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg active:bg-green-800"
          >
            {submitting
              ? '記録中...'
              : selectedTeamNumbers.length > 0
                ? `${selectedTeamNumbers.length}チームを記録`
                : '通過記録'}
          </button>

          <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-200">
            <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-3 sm:mb-4">
              参加チーム一覧（クリックで追加）
            </h3>
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2 max-h-64 sm:max-h-80 overflow-y-auto">
              {event.teams.map((team) => {
                const isSelected = selectedTeamNumbers.includes(team.teamNumber);
                return (
                  <button
                    key={team.id}
                    onClick={() => {
                      if (isSelected) {
                        removeTeamNumber(team.teamNumber);
                      } else {
                        addTeamNumber(team.teamNumber);
                      }
                    }}
                    className={`p-2 sm:p-3 rounded-lg text-center transition active:scale-95 ${
                      isSelected
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 hover:bg-blue-100 text-gray-800 active:bg-blue-200'
                    }`}
                  >
                    <div className="text-xl sm:text-2xl font-bold">
                      {team.teamNumber}
                    </div>
                    <div className="text-xs truncate">
                      {team.teamName}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}




