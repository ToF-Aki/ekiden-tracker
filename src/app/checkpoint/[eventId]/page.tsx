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

  // 一括記録
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedTeamNumbers.length === 0) {
      toast.error('ゼッケン番号を選択してください');
      return;
    }

    setSubmitting(true);
    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    try {
      // 各チーム番号を並列で記録（高速化）
      const recordPromises = selectedTeamNumbers.map(async (teamNumber) => {
        try {
          const res = await fetch(`/api/events/${eventId}/records`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              teamNumber: teamNumber.toString(),
              checkpointDistance: selectedCheckpoint,
            }),
          });

          if (res.ok) {
            const data = await res.json();

            // WebSocketで通知
            if (socket) {
              socket.emit('record-created', { eventId, record: data });
            }

            return { success: true, teamNumber };
          } else {
            const error = await res.json();
            return {
              success: false,
              teamNumber,
              error: error.error || '記録の登録に失敗しました'
            };
          }
        } catch (error) {
          return {
            success: false,
            teamNumber,
            error: 'エラーが発生しました'
          };
        }
      });

      // すべての記録が完了するまで待つ
      const results = await Promise.all(recordPromises);

      // 結果を集計
      results.forEach(result => {
        if (result.success) {
          successCount++;
        } else {
          failCount++;
          errors.push(`ゼッケン${result.teamNumber}: ${result.error}`);
        }
      });

      // 結果を表示
      if (successCount > 0) {
        toast.success(`${successCount}チームを記録しました`, { duration: 3000 });
      }
      if (failCount > 0) {
        errors.forEach(err => toast.error(err, { duration: 5000 }));
      }

      // 成功したチームをリストから削除
      if (successCount > 0) {
        setSelectedTeamNumbers([]);
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
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4 flex items-center justify-center">
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                {event.name}
              </h1>
              <p className="text-xl text-gray-600 mb-4">通過記録入力</p>
              <p className="text-lg font-semibold text-blue-600">担当地点を選択してください</p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {event.checkpoints.map((checkpoint) => (
                <button
                  key={checkpoint.id}
                  onClick={() => setSelectedCheckpoint(checkpoint.distance)}
                  className="p-10 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-2xl text-3xl font-bold transition-all hover:scale-105 shadow-lg"
                >
                  {checkpoint.name}
                  <div className="text-sm font-normal mt-2 opacity-90">担当</div>
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {event.name}
            </h1>
            <div className="flex items-center justify-center gap-4">
              <div className="bg-blue-600 text-white px-6 py-3 rounded-xl text-xl font-bold">
                {selectedCheckpointName} 担当
              </div>
              <button
                onClick={() => {
                  setSelectedCheckpoint(null);
                  setSelectedTeamNumbers([]);
                  setManualInput('');
                }}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition"
              >
                地点変更
              </button>
            </div>
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
          <form onSubmit={handleManualAdd} className="mb-6">
            <label className="block text-lg font-semibold text-gray-700 mb-4">
              ゼッケン番号を手動入力
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="番号を入力"
                className="flex-1 px-6 py-4 text-3xl text-center border-4 border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-bold"
                autoFocus
              />
              <button
                type="submit"
                className="px-6 bg-blue-600 text-white rounded-xl text-xl font-bold hover:bg-blue-700 transition"
              >
                追加
              </button>
            </div>
          </form>

          {/* 一括記録ボタン */}
          <button
            onClick={handleSubmit}
            disabled={submitting || selectedTeamNumbers.length === 0}
            className="w-full bg-green-600 text-white py-6 rounded-xl text-2xl font-bold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {submitting
              ? '記録中...'
              : selectedTeamNumbers.length > 0
                ? `${selectedTeamNumbers.length}チームを記録`
                : '通過記録'}
          </button>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">
              参加チーム一覧（クリックで追加）
            </h3>
            <div className="grid grid-cols-5 gap-2 max-h-64 overflow-y-auto">
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
                    className={`p-3 rounded-lg text-center transition ${
                      isSelected
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 hover:bg-blue-100 text-gray-800'
                    }`}
                  >
                    <div className="text-2xl font-bold">
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




