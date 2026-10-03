import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
const DEFAULT_AVATAR = "/default_48x48.png";
import { apiFetch } from "../utils/apiFetch";
import { getAuthUser } from "../utils/auth";

export interface LeaderboardEntry {
  rank: number;
  user_id: number;
  username: string;
  avatar_url: string | null;
  games_played: number;
  wins: number;
  losses: number;
  win_rate: number;
  total_xp: number;
  level: number;
  rank_title: string;
}

type SortOption = "wins" | "win_rate" | "xp";

const DEMO_LEADERBOARD_ENTRIES: LeaderboardEntry[] = [
  {
    rank: 1,
    user_id: 101,
    username: "paavo",
    avatar_url: null,
    games_played: 24,
    wins: 21,
    losses: 3,
    win_rate: 88,
    total_xp: 3250,
    level: 7,
    rank_title: "Grandmaster",
  },
  {
    rank: 2,
    user_id: 102,
    username: "niklas",
    avatar_url: null,
    games_played: 18,
    wins: 14,
    losses: 4,
    win_rate: 78,
    total_xp: 2200,
    level: 5,
    rank_title: "Veteran",
  },
  {
    rank: 3,
    user_id: 103,
    username: "miika",
    avatar_url: null,
    games_played: 15,
    wins: 11,
    losses: 4,
    win_rate: 73,
    total_xp: 1750,
    level: 4,
    rank_title: "Veteran",
  },
  {
    rank: 4,
    user_id: 104,
    username: "usva",
    avatar_url: null,
    games_played: 10,
    wins: 7,
    losses: 3,
    win_rate: 70,
    total_xp: 1100,
    level: 3,
    rank_title: "Contender",
  },
  {
    rank: 5,
    user_id: 105,
    username: "cyber_gladiator",
    avatar_url: null,
    games_played: 8,
    wins: 4,
    losses: 4,
    win_rate: 50,
    total_xp: 650,
    level: 2,
    rank_title: "Contender",
  },
];

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("wins");
  const [isLoading, setIsLoading] = useState(true);
  const [isDemoData, setIsDemoData] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const authUser = getAuthUser();

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    setNotice(null);
    try {
      const response = await apiFetch(`/api/leaderboard?limit=100&offset=0`);
      if (response.ok) {
        const data: LeaderboardEntry[] = await response.json();
        setEntries(data);
        setIsDemoData(false);
      } else {
        setEntries(DEMO_LEADERBOARD_ENTRIES);
        setIsDemoData(true);
        if (response.status === 404) {
          setNotice("Backend endpoint (GET /api/leaderboard) is pending deployment. Displaying preview data below.");
        } else {
          setNotice("Could not reach backend leaderboard service. Displaying preview data.");
        }
      }
    } catch {
      setEntries(DEMO_LEADERBOARD_ENTRIES);
      setIsDemoData(true);
      setNotice("Offline preview mode: live leaderboard data will synchronize once the backend service is deployed.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  // Multi-tier sorting: Wins (main), Win Rate (factoring in matches), and XP
  const sortedEntries = [...entries].sort((a, b) => {
    if (sortBy === "wins") {
      // Main: Match Wins, tie-broken by win rate, games played, and xp
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.win_rate !== a.win_rate) return b.win_rate - a.win_rate;
      if (b.games_played !== a.games_played) return b.games_played - a.games_played;
      return b.total_xp - a.total_xp;
    } else if (sortBy === "win_rate") {
      // Win Rate: factored with match count as tie-breaker
      if (b.win_rate !== a.win_rate) return b.win_rate - a.win_rate;
      if (b.games_played !== a.games_played) return b.games_played - a.games_played;
      if (b.wins !== a.wins) return b.wins - a.wins;
      return b.total_xp - a.total_xp;
    } else {
      // Total XP
      if (b.total_xp !== a.total_xp) return b.total_xp - a.total_xp;
      if (b.wins !== a.wins) return b.wins - a.wins;
      return b.win_rate - a.win_rate;
    }
  }).map((player, index) => ({
    ...player,
    rank: index + 1,
  }));

  const topThree = sortedEntries.slice(0, 3);

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-zinc-900 text-white min-h-screen font-sans">
      <div className="max-w-[1200px] mx-auto space-y-8">

        {/* Header Banner */}
        <div className="bg-zinc-800 border-4 border-black p-5 sm:p-8 shadow-[6px_6px_0_0_#000000] sm:shadow-[8px_8px_0_0_#000000] flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-block bg-lime-500 text-black font-black text-xs px-2.5 py-1 border-2 border-black uppercase tracking-widest">
              Global Rankings
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-wider text-zinc-100">
              Leaderboard
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 font-bold tracking-wide uppercase">
              Hall of Fame • Top ranked gladiators across the arena
            </p>
          </div>

          {/* Sort Control Tabs */}
          <div className="flex flex-wrap sm:flex-nowrap bg-zinc-900 border-4 border-black p-1 sm:p-1.5 shadow-[4px_4px_0_0_#000000] w-full md:w-auto self-start md:self-center shrink-0">
            <button
              onClick={() => setSortBy("wins")}
              className={`flex-1 sm:flex-none text-center px-3 sm:px-4 py-2 text-[11px] sm:text-xs font-black uppercase tracking-widest transition-all ${
                sortBy === "wins"
                  ? "bg-lime-500 text-black shadow-[2px_2px_0_0_#000000] border-2 border-black"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Match Wins
            </button>
            <button
              onClick={() => setSortBy("win_rate")}
              className={`flex-1 sm:flex-none text-center px-3 sm:px-4 py-2 text-[11px] sm:text-xs font-black uppercase tracking-widest transition-all ${
                sortBy === "win_rate"
                  ? "bg-lime-500 text-black shadow-[2px_2px_0_0_#000000] border-2 border-black"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Win Rate
            </button>
            <button
              onClick={() => setSortBy("xp")}
              className={`flex-1 sm:flex-none text-center px-3 sm:px-4 py-2 text-[11px] sm:text-xs font-black uppercase tracking-widest transition-all ${
                sortBy === "xp"
                  ? "bg-lime-500 text-black shadow-[2px_2px_0_0_#000000] border-2 border-black"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Total XP
            </button>
          </div>
        </div>

        {/* Notice / Offline Alert */}
        {notice && (
          <div className="bg-amber-950/80 border-4 border-amber-600 p-4 text-amber-200 text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center justify-between gap-4 shadow-[4px_4px_0_0_#000000]">
            <span>{notice}</span>
            <button
              onClick={() => fetchLeaderboard()}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-black font-black uppercase text-xs border-2 border-black transition-colors shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="bg-zinc-800 border-4 border-black p-12 text-center shadow-[6px_6px_0_0_#000000]">
            <div className="inline-block animate-pulse text-lime-400 font-black tracking-widest text-sm uppercase">
              Loading Arena Rankings...
            </div>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && sortedEntries.length === 0 && (
          <div className="bg-zinc-800 border-4 border-black p-12 text-center shadow-[6px_6px_0_0_#000000] space-y-4">
            <h3 className="text-xl font-black uppercase tracking-wider text-zinc-100">
              No Combat Records Yet
            </h3>
            <p className="text-xs text-zinc-400 uppercase tracking-wide">
              Jump into the arena and play a match to claim the #1 spot!
            </p>
            <Link
              to="/game"
              className="inline-block px-6 py-3 bg-lime-600 hover:bg-lime-500 text-black font-black uppercase tracking-widest text-xs border-4 border-black shadow-[4px_4px_0_0_#000000] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all"
            >
              Play Now
            </Link>
          </div>
        )}

        {/* Top 3 Podium Cards */}
        {!isLoading && sortedEntries.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            {/* 2nd Place (Silver) */}
            {topThree[1] && (
              <div className="bg-zinc-800 border-4 border-zinc-400 p-6 shadow-[6px_6px_0_0_#000000] flex flex-col items-center text-center relative order-2 md:order-1">
                <div className="absolute -top-4 bg-zinc-300 text-black font-black text-xs px-3 py-1 border-2 border-black uppercase tracking-widest shadow-[2px_2px_0_0_#000000]">
                  #2 Runner-Up
                </div>
                <img
                  src={topThree[1].avatar_url || DEFAULT_AVATAR}
                  alt={topThree[1].username}
                  className="w-20 h-20 border-4 border-black bg-zinc-900 object-cover mt-2 shadow-[3px_3px_0_0_#000000]"
                />
                <Link
                  to={`/profile/${topThree[1].username}`}
                  className="text-lg font-black uppercase text-zinc-100 hover:text-lime-400 transition-colors mt-3 tracking-wider"
                >
                  {topThree[1].username}
                </Link>
                <span className="text-[11px] font-bold text-zinc-400 uppercase mt-0.5">
                  LVL {topThree[1].level} • {topThree[1].rank_title}
                </span>
                <div className="w-full grid grid-cols-3 gap-1 mt-4 pt-4 border-t-2 border-zinc-700 text-xs">
                  <div>
                    <span className="text-zinc-500 uppercase font-bold text-[9px] block">Wins</span>
                    <span className="font-mono font-bold text-zinc-200">{topThree[1].wins}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 uppercase font-bold text-[9px] block">Win Rate</span>
                    <span className="font-mono font-bold text-lime-400">{topThree[1].win_rate}%</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 uppercase font-bold text-[9px] block">Total XP</span>
                    <span className="font-mono font-bold text-zinc-300">{topThree[1].total_xp}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 1st Place (Gold Champion) */}
            {topThree[0] && (
              <div className="bg-zinc-800 border-4 border-amber-400 p-6 shadow-[8px_8px_0_0_#000000] flex flex-col items-center text-center relative order-1 md:order-2 md:-translate-y-2">
                <div className="absolute -top-4 bg-amber-400 text-black font-black text-xs px-4 py-1 border-2 border-black uppercase tracking-widest shadow-[2px_2px_0_0_#000000] animate-pulse">
                  👑 #1 Champion
                </div>
                <img
                  src={topThree[0].avatar_url || DEFAULT_AVATAR}
                  alt={topThree[0].username}
                  className="w-24 h-24 border-4 border-black bg-zinc-900 object-cover mt-2 shadow-[4px_4px_0_0_#000000]"
                />
                <Link
                  to={`/profile/${topThree[0].username}`}
                  className="text-xl font-black uppercase text-amber-300 hover:text-amber-200 transition-colors mt-3 tracking-wider"
                >
                  {topThree[0].username}
                </Link>
                <span className="text-xs font-black text-amber-400 uppercase mt-0.5">
                  LVL {topThree[0].level} • {topThree[0].rank_title}
                </span>
                <div className="w-full grid grid-cols-3 gap-1 mt-4 pt-4 border-t-2 border-zinc-700 text-xs">
                  <div>
                    <span className="text-zinc-500 uppercase font-bold text-[9px] block">Wins</span>
                    <span className="font-mono font-black text-amber-300 text-sm">{topThree[0].wins}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 uppercase font-bold text-[9px] block">Win Rate</span>
                    <span className="font-mono font-black text-lime-400 text-sm">{topThree[0].win_rate}%</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 uppercase font-bold text-[9px] block">Total XP</span>
                    <span className="font-mono font-bold text-zinc-300 text-sm">{topThree[0].total_xp}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 3rd Place (Bronze) */}
            {topThree[2] && (
              <div className="bg-zinc-800 border-4 border-amber-700 p-6 shadow-[6px_6px_0_0_#000000] flex flex-col items-center text-center relative order-3">
                <div className="absolute -top-4 bg-amber-700 text-white font-black text-xs px-3 py-1 border-2 border-black uppercase tracking-widest shadow-[2px_2px_0_0_#000000]">
                  #3 Third
                </div>
                <img
                  src={topThree[2].avatar_url || DEFAULT_AVATAR}
                  alt={topThree[2].username}
                  className="w-20 h-20 border-4 border-black bg-zinc-900 object-cover mt-2 shadow-[3px_3px_0_0_#000000]"
                />
                <Link
                  to={`/profile/${topThree[2].username}`}
                  className="text-lg font-black uppercase text-zinc-100 hover:text-lime-400 transition-colors mt-3 tracking-wider"
                >
                  {topThree[2].username}
                </Link>
                <span className="text-[11px] font-bold text-zinc-400 uppercase mt-0.5">
                  LVL {topThree[2].level} • {topThree[2].rank_title}
                </span>
                <div className="w-full grid grid-cols-3 gap-1 mt-4 pt-4 border-t-2 border-zinc-700 text-xs">
                  <div>
                    <span className="text-zinc-500 uppercase font-bold text-[9px] block">Wins</span>
                    <span className="font-mono font-bold text-zinc-200">{topThree[2].wins}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 uppercase font-bold text-[9px] block">Win Rate</span>
                    <span className="font-mono font-bold text-lime-400">{topThree[2].win_rate}%</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 uppercase font-bold text-[9px] block">Total XP</span>
                    <span className="font-mono font-bold text-zinc-300">{topThree[2].total_xp}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Full Rankings Table */}
        {!isLoading && sortedEntries.length > 0 && (
          <div className="bg-zinc-800 border-4 border-black p-4 sm:p-6 shadow-[8px_8px_0_0_#000000] space-y-4">
            <h2 className="text-xl font-black uppercase tracking-wider text-zinc-100">
              Combat Standings
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left border-collapse">
                <thead>
                  <tr className="border-b-4 border-black text-[11px] font-black uppercase tracking-widest text-zinc-400">
                    <th className="py-3 px-3">Rank</th>
                    <th className="py-3 px-3">Player</th>
                    <th className="py-3 px-3">Level / Title</th>
                    <th className="py-3 px-3">Total XP</th>
                    <th className="py-3 px-3">Matches (W / L)</th>
                    <th className="py-3 px-3">Win Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-zinc-900 text-xs font-bold">
                  {sortedEntries.map((player) => {
                    const isSelf = authUser?.username && authUser.username.toLowerCase() === player.username.toLowerCase();
                    return (
                      <tr
                        key={player.user_id}
                        className={`hover:bg-zinc-700/50 transition-colors ${
                          isSelf ? "bg-lime-950/30 border-l-4 border-lime-500" : ""
                        }`}
                      >
                        {/* Rank */}
                        <td className="py-3 px-3">
                          <span
                            className={`inline-block font-mono font-black text-xs px-2 py-0.5 border border-black ${
                              player.rank === 1
                                ? "bg-amber-400 text-black shadow-[2px_2px_0_0_#000]"
                                : player.rank === 2
                                ? "bg-zinc-300 text-black shadow-[2px_2px_0_0_#000]"
                                : player.rank === 3
                                ? "bg-amber-700 text-white shadow-[2px_2px_0_0_#000]"
                                : "bg-zinc-900 text-zinc-400"
                            }`}
                          >
                            #{player.rank}
                          </span>
                        </td>

                        {/* Player Info */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={player.avatar_url || DEFAULT_AVATAR}
                              alt={player.username}
                              className="w-8 h-8 border-2 border-black bg-zinc-900 object-cover shrink-0 shadow-[1px_1px_0_0_#000]"
                            />
                            <div className="flex items-center gap-1.5 min-w-0">
                              <Link
                                to={`/profile/${player.username}`}
                                className="font-bold text-zinc-100 hover:text-lime-400 transition-colors uppercase tracking-wider truncate"
                              >
                                {player.username}
                              </Link>
                              {isSelf && (
                                <span className="bg-lime-600 text-black text-[9px] font-black px-1.5 py-0.2 border border-black uppercase tracking-widest shrink-0">
                                  YOU
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Level & Rank Title */}
                        <td className="py-3 px-3">
                          <span className="bg-zinc-900 text-zinc-300 border border-black px-2 py-1 text-[11px] font-bold uppercase tracking-wider">
                            LVL {player.level} • {player.rank_title}
                          </span>
                        </td>

                        {/* Total XP */}
                        <td className="py-3 px-3 font-mono text-zinc-200">
                          {player.total_xp.toLocaleString()} XP
                        </td>

                        {/* Matches */}
                        <td className="py-3 px-3 text-zinc-300">
                          <span>{player.games_played}</span>
                          <span className="text-zinc-500 font-normal ml-1">
                            (<span className="text-lime-400">{player.wins}W</span> /{" "}
                            <span className="text-rose-400">{player.losses}L</span>)
                          </span>
                        </td>

                        {/* Win Rate */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-lime-400 w-12">
                              {player.win_rate}%
                            </span>
                            <div className="w-16 h-2 bg-zinc-900 border border-black overflow-hidden hidden sm:block">
                              <div
                                className="h-full bg-lime-500"
                                style={{ width: `${player.win_rate}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
