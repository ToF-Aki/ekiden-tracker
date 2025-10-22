'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { useSocket } from '@/hooks/useSocket';
import { format } from 'date-fns';

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

interface Record {
  id: string;
  teamId: string;
  runnerNumber: number;
  timestamp: string;
  team: Team;
  checkpoint: {
    id: string;
    distance: number;
    name: string;
  };
}

interface Event {
  id: string;
  name: string;
  date: string;
  teams: Team[];
}

interface TeamProgress {
  team: Team;
  latestCheckpoint: number;
  latestRunner: number;
  latestTime: string;
  records: Record[];
}

export default function LivePage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const [event, setEvent] = useState<Event | null>(null);
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchRange, setSearchRange] = useState<string>('all');
  const { socket, isConnected } = useSocket(eventId);

  useEffect(() => {
    fetchData();

    // 自動ポーリング: 10秒ごとにデータを再取得
    const interval = setInterval(() => {
      fetchData();
    }, 10000); // 10秒

    return () => {
      clearInterval(interval);
    };
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

  const getTeamProgress = (): TeamProgress[] => {
    if (!event) return [];

    return event.teams.map((team) => {
      const teamRecords = records.filter((r) => r.teamId === team.id);
      const sortedRecords = teamRecords.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      const latest = sortedRecords[0];

      return {
        team,
        latestCheckpoint: latest?.checkpoint.distance || 0,
        latestRunner: latest?.runnerNumber || 0,
        latestTime: latest?.timestamp || '',
        records: teamRecords.sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        ),
      };
    });
  };

  const teamProgress = getTeamProgress();
  
  // ゼッケン順にソート
  const teamsByNumber = [...teamProgress].sort((a, b) => a.team.teamNumber - b.team.teamNumber);
  
  // 検索範囲でフィルタリング
  const filteredTeams = teamsByNumber.filter((progress) => {
    if (searchRange === 'all') return true;
    const [min, max] = searchRange.split('-').map(Number);
    return progress.team.teamNumber >= min && progress.team.teamNumber <= max;
  });

  // チーム数に基づいて検索範囲を動的に生成
  const generateSearchRanges = () => {
    if (!event || event.teams.length === 0) return [];
    
    const maxTeamNumber = Math.max(...event.teams.map(t => t.teamNumber));
    const ranges = [];
    
    // 10チームごとに範囲を作成
    for (let i = 1; i <= maxTeamNumber; i += 10) {
      const end = Math.min(i + 9, maxTeamNumber);
      ranges.push(`${i}-${end}`);
    }
    
    return ranges;
  };

  const searchRanges = generateSearchRanges();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-2xl text-white">読み込み中...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-2xl text-white">イベントが見つかりません</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white">
      {/* ヘッダー */}
      <div className="sticky top-0 bg-gray-900/90 backdrop-blur-sm border-b border-gray-700 z-10">
        <div className="px-4 py-4">
          <h1 className="text-xl font-bold text-center mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            {event.name}
          </h1>
          <div className="flex items-center justify-center space-x-4">
            <span className="text-sm text-gray-300">リアルタイム速報</span>
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                isConnected
                  ? 'bg-green-500 text-white'
                  : 'bg-red-500 text-white'
              }`}
            >
              {isConnected ? '🟢 LIVE' : '🔴 接続待機中'}
            </span>
          </div>
        </div>
        
        {/* ゼッケン番号検索 */}
        <div className="border-t border-gray-700">
          <div className="px-4 py-3">
            <div className="text-sm text-gray-300 mb-2">ゼッケン番号で絞り込み</div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSearchRange('all')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                  searchRange === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                すべて ({event?.teams.length || 0}チーム)
              </button>
              {searchRanges.map((range) => (
                <button
                  key={range}
                  onClick={() => setSearchRange(range)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                    searchRange === range
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4">
        {/* チーム一覧 */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-center mb-4">
            📋 チーム一覧（ゼッケン順）
          </h2>
          {filteredTeams.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              該当するチームがありません
            </div>
          ) : (
            filteredTeams.map((progress) => (
              <div
                key={progress.team.id}
                className="bg-white/10 backdrop-blur-lg rounded-xl p-4 shadow-lg"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-lg font-bold">
                      {progress.team.teamNumber}
                    </div>
                    <div>
                      <div className="font-bold text-lg">
                        {progress.team.teamName}
                      </div>
                      <div className="text-sm text-gray-300">
                        現在: {progress.latestCheckpoint > 0
                          ? `${progress.latestCheckpoint}km地点`
                          : 'スタート前'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-300">
                      {progress.latestRunner > 0
                        ? `${progress.latestRunner}走目`
                        : ''}
                    </div>
                    {progress.latestTime && (
                      <div className="text-xs text-gray-400">
                        {format(new Date(progress.latestTime), 'HH:mm:ss')}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* メンバー表示 - 長いニックネーム対応 */}
                <div className="space-y-2">
                  {[
                    { name: progress.team.member1, runner: 1 },
                    { name: progress.team.member2, runner: 2 },
                    { name: progress.team.member3, runner: 3 },
                    { name: progress.team.member4, runner: 4 },
                    { name: progress.team.member5, runner: 5 },
                  ].map((member, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center p-3 rounded-lg ${
                        member.runner === progress.latestRunner
                          ? 'bg-green-500/80'
                          : progress.records.some(r => r.runnerNumber === member.runner)
                          ? 'bg-blue-500/50'
                          : 'bg-white/10'
                      }`}
                    >
                      <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-xs font-bold mr-3 flex-shrink-0">
                        {member.runner}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {member.name}
                        </div>
                        <div className="text-xs text-gray-400">
                          {member.runner}走目
                        </div>
                      </div>
                      <div className="flex-shrink-0 ml-2">
                        {member.runner === progress.latestRunner && (
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}