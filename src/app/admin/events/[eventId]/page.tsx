'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Team {
  id: string;
  teamNumber: number;
  teamName: string;
  member1: string;
  member2: string;
  member3: string;
  member4: string;
  member5: string;
}

interface Event {
  id: string;
  name: string;
  date: string;
  status: string;
  teams: Team[];
}

export default function EventManagePage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [newTeam, setNewTeam] = useState({
    teamNumber: 1,
    teamName: '',
    member1: '',
    member2: '',
    member3: '',
    member4: '',
    member5: '',
  });

  useEffect(() => {
    fetchEvent();
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

  const handleAddTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/events/${eventId}/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTeam),
      });

      if (res.ok) {
        toast.success('チームを追加しました');
        setShowAddModal(false);
        setNewTeam({
          teamNumber: (event?.teams.length || 0) + 1,
          teamName: '',
          member1: '',
          member2: '',
          member3: '',
          member4: '',
          member5: '',
        });
        fetchEvent();
      } else {
        toast.error('チームの追加に失敗しました');
      }
    } catch (error) {
      toast.error('エラーが発生しました');
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm('このチームを削除してもよろしいですか?')) return;

    try {
      const res = await fetch(`/api/events/${eventId}/teams/${teamId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('チームを削除しました');
        fetchEvent();
      } else {
        toast.error('チームの削除に失敗しました');
      }
    } catch (error) {
      toast.error('エラーが発生しました');
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = 'ゼッケン番号,チーム名,1走目,2走目,3走目,4走目,5走目\n1,チームA,田中太郎,佐藤花子,鈴木一郎,高橋美咲,渡辺健太\n2,チームB,山田次郎,中村由美,小林三郎,加藤愛,吉田大輔\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'チーム登録フォーマット.csv';
    link.click();
    toast.success('フォーマットをダウンロードしました');
  };

  const handleCsvUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) {
      toast.error('CSVファイルを選択してください');
      return;
    }

    setUploading(true);
    try {
      const text = await csvFile.text();
      const lines = text.split('\n').filter(line => line.trim());

      // ヘッダー行をスキップ
      const dataLines = lines.slice(1);

      let successCount = 0;
      let errorCount = 0;

      for (const line of dataLines) {
        const values = line.split(',').map(v => v.trim());
        if (values.length < 7) continue;

        const teamData = {
          teamNumber: parseInt(values[0]),
          teamName: values[1],
          member1: values[2],
          member2: values[3],
          member3: values[4],
          member4: values[5],
          member5: values[6],
        };

        try {
          const res = await fetch(`/api/events/${eventId}/teams`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(teamData),
          });

          if (res.ok) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          errorCount++;
        }
      }

      toast.success(`${successCount}チームを登録しました${errorCount > 0 ? ` (${errorCount}件失敗)` : ''}`);
      setShowCsvModal(false);
      setCsvFile(null);
      fetchEvent();
    } catch (error) {
      toast.error('CSVファイルの読み込みに失敗しました');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">読み込み中...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">イベントが見つかりません</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <Link
                href="/admin/dashboard"
                className="text-blue-600 hover:text-blue-700 mb-2 inline-block"
              >
                ← ダッシュボードに戻る
              </Link>
              <h1 className="text-2xl font-bold text-gray-800">{event.name}</h1>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">
            チーム一覧 ({event.teams.length}チーム)
          </h2>
          <div className="flex gap-2">
            <button
              onClick={handleDownloadTemplate}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
            >
              CSVテンプレート
            </button>
            <button
              onClick={() => setShowCsvModal(true)}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition"
            >
              CSV一括登録
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              チーム追加
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  ゼッケン
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  チーム名
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  メンバー
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {event.teams.map((team) => (
                <tr key={team.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {team.teamNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {team.teamName}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {[team.member1, team.member2, team.member3, team.member4, team.member5].join(', ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleDeleteTeam(team.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      削除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {event.teams.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            チームがありません。追加してください。
          </div>
        )}
      </div>

      {showCsvModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full m-4">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">
              CSV一括登録
            </h2>
            <form onSubmit={handleCsvUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CSVファイル選択
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-900"
                  required
                />
                <p className="text-sm text-gray-500 mt-2">
                  ※先に「CSVテンプレート」ボタンでフォーマットをダウンロードしてください
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-sm text-gray-700 mb-2">
                  CSVフォーマット
                </h3>
                <p className="text-xs text-gray-600">
                  ゼッケン番号,チーム名,1走目,2走目,3走目,4走目,5走目
                </p>
              </div>
              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
                >
                  {uploading ? 'アップロード中...' : 'アップロード'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCsvModal(false);
                    setCsvFile(null);
                  }}
                  disabled={uploading}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition disabled:opacity-50"
                >
                  キャンセル
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full m-4">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">
              チーム追加
            </h2>
            <form onSubmit={handleAddTeam} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ゼッケン番号
                  </label>
                  <input
                    type="number"
                    value={newTeam.teamNumber}
                    onChange={(e) =>
                      setNewTeam({ ...newTeam, teamNumber: parseInt(e.target.value) })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    チーム名
                  </label>
                  <input
                    type="text"
                    value={newTeam.teamName}
                    onChange={(e) =>
                      setNewTeam({ ...newTeam, teamName: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  メンバー（5名）
                </label>
                {[1, 2, 3, 4, 5].map((num) => (
                  <input
                    key={num}
                    type="text"
                    placeholder={`${num}走目`}
                    value={newTeam[`member${num}` as keyof typeof newTeam]}
                    onChange={(e) =>
                      setNewTeam({
                        ...newTeam,
                        [`member${num}`]: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                    required
                  />
                ))}
              </div>
              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  追加
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
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




