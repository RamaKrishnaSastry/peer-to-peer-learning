import { useState } from "react";
import { Link } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";
import { API_ENDPOINTS } from "../utils/constants";
import { useAuth } from "../contexts/AuthContext";
import { Loading } from "../components/Loading";
import { Avatar } from "../components/Avatar";

interface LeaderboardEntry {
  id: string;
  username: string;
  bio?: string;
  avatarUrl?: string;
  domain?: string;
  verified: boolean;
  stats: {
    reputationScore: number;
    upvotesReceived: number;
    contentCount: number;
    answerCount: number;
    currentStreak: number;
    longestStreak: number;
  };
}

const RANK_STYLES = ["text-yellow-500", "text-gray-400", "text-amber-700"];

const TABS = [
  { id: "reputation", label: "Reputation" },
  { id: "streak", label: "Streaks" },
] as const;

const rankBadge = (index: number) =>
  index < 3 ? (
    <span className={`text-2xl font-bold w-10 text-center ${RANK_STYLES[index]}`}>
      {["🥇", "🥈", "🥉"][index]}
    </span>
  ) : (
    <span className="text-gray-500 font-semibold w-10 text-center">{index + 1}</span>
  );

export const LeaderboardPage = () => {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("reputation");
  const { user, isAuthenticated } = useAuth();

  const { data, isLoading } = useFetch<LeaderboardEntry[]>(
    ["leaderboard", tab],
    `${API_ENDPOINTS.LEADERBOARD}?type=${tab}&limit=50`,
  );

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-2">Leaderboard</h1>
      <p className="text-gray-500 mb-6">
        Top contributors by reputation and daily streaks across all exam domains.
      </p>

      <div className="flex gap-2 mb-6">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              tab === t.id
                ? "bg-blue-600 text-white"
                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Loading isLoading={isLoading}>
        {data && data.length === 0 ? (
          <div className="text-center text-gray-600 py-16 bg-white border border-gray-200 rounded-lg">
            No contributors yet. Start answering and earning reputation!
          </div>
        ) : (
          <div className="space-y-2">
            {data?.map((entry, index) => {
              const isMe = isAuthenticated && entry.id === user?.id;
              return (
                <Link
                  key={entry.id}
                  to={`/users/${entry.username}`}
                  className={`flex items-center gap-4 border rounded-lg p-4 transition hover:shadow-md ${
                    isMe ? "bg-blue-50 border-blue-300" : "bg-white border-gray-200"
                  }`}
                >
                  {rankBadge(index)}
                  <Avatar name={entry.username} className="w-10 h-10" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-800 truncate">
                        {entry.username}
                      </span>
                      {entry.verified && <span title="Verified">✅</span>}
                      {isMe && (
                        <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded">
                          You
                        </span>
                      )}
                      {entry.domain && (
                        <span className="bg-gray-100 text-gray-500 text-xs font-medium px-2 py-0.5 rounded">
                          {entry.domain}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {tab === "reputation"
                        ? `⭐ ${entry.stats.reputationScore} rep · 👍 ${entry.stats.upvotesReceived} upvotes · 📄 ${entry.stats.contentCount} content · 💬 ${entry.stats.answerCount} answers`
                        : `🔥 ${entry.stats.currentStreak} day streak · 🏆 best ${entry.stats.longestStreak}`}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-lg text-gray-800">
                      {tab === "reputation"
                        ? entry.stats.reputationScore
                        : entry.stats.currentStreak}
                    </div>
                    <div className="text-xs text-gray-400">
                      {tab === "reputation" ? "reputation" : "days"}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </Loading>
    </div>
  );
};
