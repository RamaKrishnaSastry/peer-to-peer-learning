import { Link } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";
import { API_ENDPOINTS } from "../utils/constants";
import { useAuth } from "../contexts/AuthContext";
import { Avatar } from "../components/Avatar";
import { Loading } from "../components/Loading";
import { getLevelInfo, getTimeAgo } from "../utils/helpers";

interface Profile {
  id: string;
  username: string;
  email: string;
  bio: string | null;
  avatarUrl: string | null;
  domain?: string | null;
  createdAt: string;
  stats: {
    reputationScore: number;
    upvotesReceived: number;
    contentCount: number;
    answerCount: number;
    currentStreak: number;
    longestStreak: number;
  };
  badges: { id: string; name: string; slug: string; earnedAt: string }[];
}

interface ActivityEvent {
  kind: "content" | "discussion" | "answer" | "comment";
  id: string;
  title: string;
  meta: string | null;
  createdAt: string;
  href?: string;
}

const ACTIVITY_EMOJI: Record<string, string> = {
  content: "📄",
  discussion: "💬",
  answer: "✍️",
  comment: "💭",
};

const StatCard = ({
  label,
  value,
  accent,
  emoji,
}: {
  label: string;
  value: string | number;
  accent?: string;
  emoji?: string;
}) => (
  <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm text-center">
    <div className={`text-3xl font-bold ${accent || "text-blue-600"}`}>
      {emoji} {value}
    </div>
    <div className="text-sm text-gray-500 mt-1">{label}</div>
  </div>
);

export const ProfilePage = () => {
  const { isAuthenticated } = useAuth();
  const { data: profile, isLoading } = useFetch<Profile>(
    ["me"],
    API_ENDPOINTS.USERS.GET_ME,
    { enabled: isAuthenticated },
  );
  const { data: activity } = useFetch<ActivityEvent[]>(
    ["me", "activity"],
    profile?.username
      ? API_ENDPOINTS.USERS.GET_ACTIVITY(profile.username)
      : undefined,
    { enabled: isAuthenticated && !!profile?.username },
  );

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Your Profile</h1>
        <p className="text-gray-600 mb-6">
          Login to see your stats, streaks, and reputation.
        </p>
        <Link
          to="/login"
          className="inline-block bg-blue-600 text-white px-8 py-3 rounded font-bold hover:bg-blue-700"
        >
          Login
        </Link>
      </div>
    );
  }

  const level = profile ? getLevelInfo(profile.stats.reputationScore) : null;

  return (
    <div className="max-w-4xl mx-auto py-8">
      <Loading isLoading={isLoading}>
        {profile && level ? (
          <>
            <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm mb-6 flex items-start gap-6">
              <Avatar
                name={profile.username}
                avatarUrl={profile.avatarUrl}
                className="w-20 h-20 text-3xl"
              />
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-bold">{profile.username}</h1>
                  <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded uppercase">
                    Level {level.level} · {level.title}
                  </span>
                  {profile.domain && (
                    <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded uppercase">
                      🎯 {profile.domain}
                    </span>
                  )}
                </div>
                <p className="text-gray-500 text-sm mt-1">
                  {profile.email} · joined{" "}
                  {new Date(profile.createdAt).toLocaleDateString()}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <Link
                    to={`/users/${profile.username}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    View public profile ↗
                  </Link>
                  <Link
                    to="/settings"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Manage account &amp; settings
                  </Link>
                </div>
                {profile.bio && (
                  <p className="text-gray-700 mt-3 whitespace-pre-wrap">
                    {profile.bio}
                  </p>
                )}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-semibold">
                  Reputation · Level {level.level} · {level.title}
                </h2>
                <span className="text-sm text-gray-500">
                  {level.currentRep} / {level.next}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all"
                  style={{ width: `${level.progressPct}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Earn reputation by upvoted content, answers, and daily streaks.
              </p>
            </div>

            {profile.badges.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-6">
                <h2 className="font-semibold mb-3">
                  Badges ({profile.badges.length})
                </h2>
                <div className="flex flex-wrap gap-2">
                  {profile.badges.map((badge) => (
                    <span
                      key={badge.id}
                      className="bg-yellow-100 text-yellow-800 text-sm font-semibold px-3 py-1 rounded-full"
                    >
                      🏅 {badge.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <StatCard
                label="Current Streak"
                value={`🔥 ${profile.stats.currentStreak}`}
                accent="text-orange-500"
              />
              <StatCard
                label="Longest Streak"
                value={`${profile.stats.longestStreak}`}
              />
              <StatCard
                label="Content Shared"
                value={profile.stats.contentCount}
              />
              <StatCard label="Answers Given" value={profile.stats.answerCount} />
              <StatCard
                label="Upvotes Received"
                value={profile.stats.upvotesReceived}
                accent="text-green-600"
              />
              <StatCard
                label="Reputation Score"
                value={profile.stats.reputationScore}
              />
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-6">
              <h2 className="font-semibold mb-3">Recent activity</h2>
              {activity && activity.length > 0 ? (
                <ul className="space-y-2">
                  {activity.slice(0, 8).map((item) => (
                    <li key={`${item.kind}-${item.id}`}>
                      <Link
                        to={item.href || "#"}
                        className="flex items-start gap-3 p-2 rounded hover:bg-gray-50"
                      >
                        <span className="text-xl shrink-0">
                          {ACTIVITY_EMOJI[item.kind]}
                        </span>
                        <div className="min-w-0">
                          <span className="capitalize text-xs text-gray-500">
                            {item.kind}
                          </span>
                          <div className="font-medium text-gray-800 truncate">
                            {item.title}
                          </div>
                          {item.kind === "answer" && item.meta && (
                            <div className="text-sm text-gray-500 truncate">
                              {item.meta}
                            </div>
                          )}
                          <div className="text-xs text-gray-400">
                            {getTimeAgo(item.createdAt)}
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 py-2">
                  No activity yet. Start sharing content and answering questions!
                </p>
              )}
            </div>

            <div className="flex flex-wrap space-x-4">
              <Link
                to="/daily"
                className="bg-blue-600 text-white px-6 py-3 rounded font-bold hover:bg-blue-700"
              >
                Answer Today&apos;s Question
              </Link>
              <Link
                to="/content"
                className="border border-blue-600 text-blue-600 px-6 py-3 rounded font-bold hover:bg-blue-50"
              >
                Share Content
              </Link>
            </div>
          </>
        ) : (
          <p className="text-center text-gray-600 py-10">Profile not found.</p>
        )}
      </Loading>
    </div>
  );
};