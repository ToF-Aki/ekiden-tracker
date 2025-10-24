'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface Record {
  id: string;
  timestamp: string;
  runnerNumber: number;
  team: {
    teamNumber: number;
    teamName: string;
  };
  checkpoint: {
    name: string;
    distance: number;
  };
}

interface Event {
  id: string;
  name: string;
}

export default function RecordsManagePage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;
  const [event, setEvent] = useState<Event | null>(null);
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [eventId]);

  const fetchData = async () => {
    try {
      const [eventRes, recordsRes] = await Promise.all([
        fetch(`/api/events/${eventId}`),
        fetch(`/api/events/${eventId}/records`),
      ]);

      const eventData = await eventRes.json();
      const recordsData = await recordsRes.json();

      setEvent(eventData);
      setRecords(recordsData);
    } catch (error) {
      toast.error('データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRecord = async (recordId: string) => {
    if (!confirm('この記録を削除してもよろしいですか？')) return;

    try {
      const res = await fetch(`/api/events/${eventId}/records/${recordId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('記録を削除しました');
        fetchData();
      } else {
        toast.error('記録の削除に失敗しました');
      }
    } catch (error) {
      toast.error('エラーが発生しました');
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
                href={`/admin/events/${eventId}`}
                className="text-blue-600 hover:text-blue-700 mb-2 inline-block"
              >
                ← チーム管理に戻る
              </Link>
              <h1 className="text-2xl font-bold text-gray-800">{event.name}</h1>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">
            記録一覧 ({records.length}件)
          </h2>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    時刻
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    ゼッケン
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    チーム名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    地点
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    走者
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      記録がありません
                    </td>
                  </tr>
                ) : (
                  records.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {format(new Date(record.timestamp), 'HH:mm:ss')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {record.team.teamNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.team.teamName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.checkpoint.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.runnerNumber}走目
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleDeleteRecord(record.id)}
                          className="text-red-600 hover:text-red-700 font-medium"
                        >
                          削除
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
