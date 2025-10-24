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
  link1Text: string | null;
  link1Url: string | null;
  link2Text: string | null;
  link2Url: string | null;
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
      <div className="sticky top-0 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700 z-10 shadow-lg">
        <div className="px-3 sm:px-4 py-3 sm:py-4">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-center mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            {event.name}
          </h1>
          <div className="text-center">
            <span className="text-xs sm:text-sm text-gray-300">約10秒間隔で自動更新されます</span>
          </div>

          {/* リンクボタン */}
          {(event.link1Text && event.link1Url) || (event.link2Text && event.link2Url) ? (
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mt-3 sm:mt-4">
              {event.link1Text && event.link1Url && (
                <a
                  href={event.link1Url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition text-xs sm:text-sm font-medium"
                >
                  {event.link1Text}
                </a>
              )}
              {event.link2Text && event.link2Url && (
                <a
                  href={event.link2Url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition text-xs sm:text-sm font-medium"
                >
                  {event.link2Text}
                </a>
              )}
            </div>
          ) : null}
        </div>

        {/* ゼッケン番号検索 */}
        <div className="border-t border-gray-700">
          <div className="px-3 sm:px-4 py-2 sm:py-3">
            <div className="text-xs sm:text-sm text-gray-300 mb-2">ゼッケン番号で絞り込み</div>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              <button
                onClick={() => setSearchRange('all')}
                className={`px-2.5 sm:px-3 py-1 rounded-full text-xs font-medium transition active:scale-95 ${
                  searchRange === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600 active:bg-gray-500'
                }`}
              >
                すべて ({event?.teams.length || 0})
              </button>
              {searchRanges.map((range) => (
                <button
                  key={range}
                  onClick={() => setSearchRange(range)}
                  className={`px-2.5 sm:px-3 py-1 rounded-full text-xs font-medium transition active:scale-95 ${
                    searchRange === range
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600 active:bg-gray-500'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="px-3 sm:px-4 py-3 sm:py-4">
        {/* 4km地点通過情報 */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-base sm:text-lg font-bold text-center mb-3 sm:mb-4 text-yellow-400">
            🏁 4km地点通過情報
          </h2>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-3 sm:p-4 shadow-lg">
            {(() => {
              // 4km地点の記録を抽出
              const goalRecords = records
                .filter((record) => record.checkpoint.distance === 4)
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .slice(0, 10); // 最新10件

              if (goalRecords.length === 0) {
                return (
                  <div className="text-center text-gray-400 py-4 text-sm">
                    まだ4km地点通過チームはありません
                  </div>
                );
              }

              return (
                <div className="space-y-2">
                  {goalRecords.map((record, index) => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between p-2 sm:p-3 bg-white/10 rounded-lg"
                    >
                      <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-yellow-500 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold text-gray-900 flex-shrink-0">
                          {index + 1}
                        </div>
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-full flex items-center justify-center text-sm sm:text-base font-bold flex-shrink-0">
                          {record.team.teamNumber}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-xs sm:text-sm truncate">
                            {record.team.teamName}
                          </div>
                          <div className="text-xs text-gray-400">
                            {record.runnerNumber}走目
                          </div>
                        </div>
                      </div>
                      <div className="text-xs sm:text-sm text-gray-300 flex-shrink-0 ml-2">
                        {format(new Date(record.timestamp), 'HH:mm:ss')}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>

        {/* チーム一覧 */}
        <div className="space-y-3 sm:space-y-4">
          <h2 className="text-base sm:text-lg font-bold text-center mb-3 sm:mb-4">
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
                className="bg-white/10 backdrop-blur-lg rounded-xl p-3 sm:p-4 shadow-lg"
              >
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-full flex items-center justify-center text-base sm:text-lg font-bold flex-shrink-0">
                      {progress.team.teamNumber}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-sm sm:text-lg truncate">
                        {progress.team.teamName}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-300">
                        現在: {progress.latestCheckpoint > 0
                          ? `${progress.latestCheckpoint}km地点`
                          : 'スタート前'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <div className="text-xs sm:text-sm text-gray-300">
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
                <div className="space-y-1.5 sm:space-y-2">
                  {[
                    { name: progress.team.member1, runner: 1 },
                    { name: progress.team.member2, runner: 2 },
                    { name: progress.team.member3, runner: 3 },
                    { name: progress.team.member4, runner: 4 },
                    { name: progress.team.member5, runner: 5 },
                  ].map((member, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center p-2 sm:p-3 rounded-lg ${
                        member.runner === progress.latestRunner
                          ? 'bg-green-500/80'
                          : progress.records.some(r => r.runnerNumber === member.runner)
                          ? 'bg-blue-500/50'
                          : 'bg-white/10'
                      }`}
                    >
                      <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-700 rounded-full flex items-center justify-center text-xs font-bold mr-2 sm:mr-3 flex-shrink-0">
                        {member.runner}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs sm:text-sm font-medium truncate">
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