import { Link, useParams } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";
import { API_ENDPOINTS } from "../utils/constants";
import { useAuth } from "../contexts/AuthContext";
import { Avatar } from "../components/Avatar";
import { Loading } from "../components/Loading";
import { formatDate, getTimeAgo, getLevelInfo } from "../utils/helpers";

interface UserProfile {
  id: string;
  username: string;
  bio: string | null;
  avatarUrl: string | null;
  verified: boolean;
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

interface UserContent {
  id: string;
  title: string;
  type: string;
  avgRating: number;
  ratingCount: number;
  createdAt: string;
  category: { id: number; name: string };
}

interface UserAnswer {
  id: string;
  text: string;
  upvoteCount: number;
  createdAt: string;
  discussion: { id: string; title: string };
}

const StatCard = ({ label, value }: { label: string; value: string | number }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm text-center">
    <div className="text-2xl font-bold text-blue-600">{value}</div>
    <div className="text-sm text-gray-500 mt-1">{label}</div>
  </div>
);

export const UserProfilePage = () => {
  const { username = "" } = useParams();
  const { user: me } = useAuth();

  const { data: profile, isLoading } = useFetch<UserProfile>(
    ["user", username],
    API_ENDPOINTS.USERS.GET_PROFILE(username),
  );
  const { data: content } = useFetch<UserContent[]>(
    ["user", username, "content"],
    API_ENDPOINTS.USERS.GET_CONTENT(username),
  );
  const { data: answers } = useFetch<UserAnswer[]>(
    ["user", username, "answers"],
    API_ENDPOINTS.USERS.GET_ANSWERS(username),
  );

  const isMe = me?.username === username;
  const level = profile ? getLevelInfo(profile.stats.reputationScore) : null;

  return (
    <div className="max-w-4xl mx-auto py-8">
      <Loading isLoading={isLoading}>
        {profile && level ? (
          <>
            <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm mb-6">
              <div className="flex items-start gap-6">
                <Avatar
                  name={profile.username}
                  avatarUrl={profile.avatarUrl}
                  className="w-20 h-20 text-3xl"
                />
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-bold">{profile.username}</h1>
                    {profile.verified && (
                      <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded uppercase">
                        Verified
                      </span>
                    )}
                    <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded uppercase">
                      Level {level.level} · {level.title}
                    </span>
                    {profile.domain && (
                      <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded uppercase">
                        🎯 {profile.domain}
                      </span>
                    )}
                    {isMe && (
                      <Link
                        to="/profile"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        (edit)
                      </Link>
                    )}
                  </div>
                  <p className="text-gray-500 text-sm mb-2">
                    Member since {formatDate(profile.createdAt)}
                  </p>
                  {profile.bio && (
                    <p className="text-gray-700 whitespace-pre-wrap">{profile.bio}</p>
                  )}
                </div>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2 mt-5">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                  style={{ width: `${level.progressPct}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Reputation {level.currentRep} / {level.next} (Level {level.level})
              </p>

              {profile.badges.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-6">
                  {profile.badges.map((badge) => (
                    <span
                      key={badge.id}
                      className="bg-yellow-100 text-yellow-800 text-sm font-semibold px-3 py-1 rounded-full"
                      title={`Earned ${formatDate(badge.earnedAt)}`}
                    >
                      🏅 {badge.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              <StatCard label="Reputation" value={profile.stats.reputationScore} />
              <StatCard
                label="Current Streak"
                value={`🔥 ${profile.stats.currentStreak}`}
              />
              <StatCard label="Longest Streak" value={profile.stats.longestStreak} />
              <StatCard label="Content Shared" value={profile.stats.contentCount} />
              <StatCard label="Answers Given" value={profile.stats.answerCount} />
              <StatCard label="Upvotes Received" value={profile.stats.upvotesReceived} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <section>
                <h2 className="text-xl font-bold mb-3">
                  Content ({content?.length ?? 0})
                </h2>
                {content && content.length > 0 ? (
                  <div className="space-y-3">
                    {content.map((item) => (
                      <Link
                        key={item.id}
                        to={`/content/${item.id}`}
                        className="block bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition"
                      >
                        <div className="font-semibold text-blue-700">{item.title}</div>
                        <div className="text-sm text-gray-500 mt-1">
                          <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded uppercase text-xs font-bold mr-2">
                            {item.type}
                          </span>
                          ⭐ {item.avgRating.toFixed(1)} ({item.ratingCount}) ·{" "}
                          {getTimeAgo(item.createdAt)}
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 py-4 text-center bg-white border border-gray-200 rounded-lg">
                    No content shared yet.
                  </p>
                )}
              </section>

              <section>
                <h2 className="text-xl font-bold mb-3">
                  Answers ({answers?.length ?? 0})
                </h2>
                {answers && answers.length > 0 ? (
                  <div className="space-y-3">
                    {answers.map((answer) => (
                      <Link
                        key={answer.id}
                        to={`/discussions/${answer.discussion.id}`}
                        className="block bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition"
                      >
                        <p className="text-gray-800 line-clamp-2 mb-1">{answer.text}</p>
                        <div className="text-sm text-gray-500">
                          in{" "}
                          <span className="text-blue-600">
                            {answer.discussion.title}
                          </span>{" "}
                          · 👍 {answer.upvoteCount} · {getTimeAgo(answer.createdAt)}
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 py-4 text-center bg-white border border-gray-200 rounded-lg">
                    No answers given yet.
                  </p>
                )}
              </section>
            </div>
          </>
        ) : (
          <div className="text-center text-gray-600 py-16">
            <h1 className="text-3xl font-bold mb-2">User not found</h1>
            <Link to="/discussions" className="text-blue-600 hover:underline">
              ← Back to discussions
            </Link>
          </div>
        )}
      </Loading>
    </div>
  );
};
