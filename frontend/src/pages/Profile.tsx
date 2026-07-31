import { Link } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";
import { API_ENDPOINTS } from "../utils/constants";
import { useAuth } from "../contexts/AuthContext";
import { Loading } from "../components/Loading";

interface Profile {
  id: string;
  username: string;
  email: string;
  bio: string | null;
  avatarUrl: string | null;
  stats: {
    reputationScore: number;
    upvotesReceived: number;
    contentCount: number;
    answerCount: number;
    currentStreak: number;
    longestStreak: number;
  };
}

const StatCard = ({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: string;
}) => (
  <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm text-center">
    <div className={`text-3xl font-bold ${accent || "text-blue-600"}`}>{value}</div>
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

  return (
    <div className="max-w-4xl mx-auto py-8">
      <Loading isLoading={isLoading}>
        {profile ? (
          <>
            <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm mb-6 flex items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-3xl font-bold shrink-0">
                {profile.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold">{profile.username}</h1>
                <p className="text-gray-500">{profile.email}</p>
                {profile.bio && <p className="text-gray-700 mt-2">{profile.bio}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <StatCard
                label="Reputation Score"
                value={profile.stats.reputationScore}
              />
              <StatCard
                label="Current Streak"
                value={`🔥 ${profile.stats.currentStreak} days`}
                accent="text-orange-500"
              />
              <StatCard
                label="Longest Streak"
                value={`${profile.stats.longestStreak} days`}
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
            </div>

            <div className="flex space-x-4">
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
