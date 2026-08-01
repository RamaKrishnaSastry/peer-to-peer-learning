import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useFetch } from "../hooks/useFetch";
import { API_ENDPOINTS } from "../utils/constants";
import { Avatar } from "../components/Avatar";
import { Loading } from "../components/Loading";
import { getTimeAgo } from "../utils/helpers";

interface Me {
  username: string;
  bio: string | null;
  stats: {
    reputationScore: number;
    upvotesReceived: number;
    contentCount: number;
    answerCount: number;
    currentStreak: number;
    longestStreak: number;
  };
  badges: { id: string; name: string; slug: string }[];
}

interface TodayQuestion {
  id: string;
  question: string;
  source: string | null;
  attempted: boolean;
}

interface DiscussionSummary {
  id: string;
  title: string;
  answerCount: number;
  isClosed: boolean;
  createdAt: string;
  category: { name: string };
  creator: { username: string };
}

interface ContentSummary {
  id: string;
  title: string;
  type: string;
  avgRating: number;
  upvoteCount: number;
  createdAt: string;
  creator: { username: string };
}

const StatCard = ({
  label,
  value,
  accent = "text-blue-600",
}: {
  label: string;
  value: string | number;
  accent?: string;
}) => (
  <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm text-center">
    <div className={`text-2xl font-bold ${accent}`}>{value}</div>
    <div className="text-xs text-gray-500 mt-1">{label}</div>
  </div>
);

const QuickAction = ({
  to,
  emoji,
  label,
  desc,
}: {
  to: string;
  emoji: string;
  label: string;
  desc: string;
}) => (
  <Link
    to={to}
    className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md hover:border-blue-300 transition text-center"
  >
    <div className="text-3xl mb-2">{emoji}</div>
    <div className="font-bold text-blue-700">{label}</div>
    <div className="text-sm text-gray-500 mt-1">{desc}</div>
  </Link>
);

const SignedInHome = () => {
  const { user } = useAuth();
  const { data: profile } = useFetch<Me>(["me"], API_ENDPOINTS.USERS.GET_ME);
  const domain = user?.domain;

  const upsc = useFetch<TodayQuestion>(
    ["daily-question", "UPSC"],
    API_ENDPOINTS.DAILY_QUESTIONS.TODAY("UPSC"),
    { enabled: !domain },
  );
  const jee = useFetch<TodayQuestion>(
    ["daily-question", "JEE"],
    API_ENDPOINTS.DAILY_QUESTIONS.TODAY("JEE"),
    { enabled: !domain },
  );
  const finance = useFetch<TodayQuestion>(
    ["daily-question", "Finance"],
    API_ENDPOINTS.DAILY_QUESTIONS.TODAY("Finance"),
    { enabled: !domain },
  );
  const scoped = useFetch<TodayQuestion>(
    ["daily-question", domain ?? "none"],
    API_ENDPOINTS.DAILY_QUESTIONS.TODAY(domain ?? ""),
    { enabled: !!domain },
  );

  const todaysQuestions = domain
    ? [{ type: domain, ...scoped }]
    : [
        { type: "UPSC", ...upsc },
        { type: "JEE", ...jee },
        { type: "Finance", ...finance },
      ];

  const { data: discussions } = useFetch<DiscussionSummary[]>(
    ["discussions", "home", domain ?? "all"],
    `${API_ENDPOINTS.DISCUSSIONS.LIST}?sort=newest&limit=4${domain ? `&domain=${domain}` : ""}`,
  );
  const { data: content } = useFetch<ContentSummary[]>(
    ["content", "home", domain ?? "all"],
    `${API_ENDPOINTS.CONTENT.LIST}?sort=newest&limit=4${domain ? `&domain=${domain}` : ""}`,
  );

  const username = profile?.username ?? user?.username ?? "Learner";
  const streak = profile?.stats.currentStreak ?? 0;

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg p-8 shadow-md mb-8 flex items-center gap-6">
        <Avatar name={username} className="w-16 h-16 text-2xl" />
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-1">Welcome back, {username}!</h1>
          <p className="text-blue-100">
            {profile?.bio || "Keep your streak alive and help your peers learn."}
          </p>
        </div>
        <Link
          to="/daily"
          className="shrink-0 bg-white text-blue-700 px-6 py-3 rounded-lg font-bold hover:bg-blue-50"
        >
          {streak > 0 ? `🔥 ${streak} day streak` : "Answer today's question"}
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <QuickAction to="/daily" emoji="🎯" label="Daily Question" desc="Answer & keep your streak" />
        <QuickAction to="/categories" emoji="📚" label="Browse" desc="Explore the curriculum" />
        <QuickAction to="/discussions" emoji="💬" label="Discussions" desc="Ask, answer, debate" />
        <QuickAction to="/content" emoji="📤" label="Share Content" desc="Post notes or videos" />
      </div>

      <h2 className="text-xl font-bold mb-4">
        Today&apos;s Questions{domain ? ` · ${domain}` : ""}
      </h2>
      <Loading isLoading={todaysQuestions.some((q) => q.isLoading)}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {todaysQuestions.map(({ type, data: q }) => (
            <Link
              key={type}
              to="/daily"
              className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-blue-700">{type}</span>
                {q?.attempted ? (
                  <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded">
                    Done ✓
                  </span>
                ) : (
                  <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-0.5 rounded">
                    New
                  </span>
                )}
              </div>
              <p className="text-gray-800 line-clamp-2 mb-2">
                {q?.question || "No question scheduled for today."}
              </p>
              {q?.source && <p className="text-xs text-gray-500 truncate">{q.source}</p>}
            </Link>
          ))}
        </div>
      </Loading>

      <h2 className="text-xl font-bold mb-4">Your Stats</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <StatCard label="Reputation" value={profile?.stats.reputationScore ?? 0} />
        <StatCard
          label="Current Streak"
          value={`🔥 ${profile?.stats.currentStreak ?? 0}`}
          accent="text-orange-500"
        />
        <StatCard label="Longest Streak" value={profile?.stats.longestStreak ?? 0} />
        <StatCard label="Content Shared" value={profile?.stats.contentCount ?? 0} />
        <StatCard label="Answers Given" value={profile?.stats.answerCount ?? 0} />
        <StatCard
          label="Upvotes Received"
          value={profile?.stats.upvotesReceived ?? 0}
          accent="text-green-600"
        />
      </div>

      {profile && profile.badges.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {profile.badges.map((badge) => (
            <span
              key={badge.id}
              className="bg-yellow-100 text-yellow-800 text-sm font-semibold px-3 py-1 rounded-full"
            >
              🏅 {badge.name}
            </span>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold">Latest Discussions</h2>
            <Link to="/discussions" className="text-sm text-blue-600 hover:underline">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {discussions?.map((d) => (
              <Link
                key={d.id}
                to={`/discussions/${d.id}`}
                className="block bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition"
              >
                <div className="font-semibold text-blue-700">{d.title}</div>
                <div className="text-sm text-gray-500 mt-1">
                  {d.category.name} · {d.answerCount} answers · {getTimeAgo(d.createdAt)}
                </div>
              </Link>
            ))}
            {discussions?.length === 0 && (
              <p className="text-gray-500 text-center py-6 bg-white border border-gray-200 rounded-lg">
                No discussions yet.{" "}
                <Link to="/discussions" className="text-blue-600 hover:underline">
                  Start one!
                </Link>
              </p>
            )}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold">Latest Content</h2>
            <Link to="/content" className="text-sm text-blue-600 hover:underline">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {content?.map((c) => (
              <Link
                key={c.id}
                to={`/content/${c.id}`}
                className="block bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition"
              >
                <div className="font-semibold text-blue-700">{c.title}</div>
                <div className="text-sm text-gray-500 mt-1">
                  <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded uppercase text-xs font-bold mr-2">
                    {c.type}
                  </span>
                  ⭐ {c.avgRating.toFixed(1)} · 👍 {c.upvoteCount} · {getTimeAgo(c.createdAt)}
                </div>
              </Link>
            ))}
            {content?.length === 0 && (
              <p className="text-gray-500 text-center py-6 bg-white border border-gray-200 rounded-lg">
                No content yet.{" "}
                <Link to="/content" className="text-blue-600 hover:underline">
                  Share something!
                </Link>
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

const SignedOutHome = () => {
  return (
    <>
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">
            Learn Together, Grow Together
          </h1>
          <p className="text-xl mb-8">
            A community-driven peer learning platform for UPSC, JEE, and
            Finance
          </p>
          <div className="space-x-4">
            <Link
              to="/signup"
              className="inline-block bg-white text-blue-600 px-8 py-3 rounded font-bold hover:bg-gray-100"
            >
              Get Started
            </Link>
            <Link
              to="/categories"
              className="inline-block border-2 border-white text-white px-8 py-3 rounded font-bold hover:bg-white hover:text-blue-600"
            >
              Browse
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-4xl mb-4" role="img" aria-label="Books">
              📚
            </div>
            <h2 className="text-2xl font-bold mb-2">Organized Content</h2>
            <p className="text-gray-600">
              Browse organized content by curriculum, not algorithm
            </p>
          </div>

          <div className="text-center">
            <div className="text-4xl mb-4" role="img" aria-label="People">
              👥
            </div>
            <h2 className="text-2xl font-bold mb-2">Peer Feedback</h2>
            <p className="text-gray-600">
              Learn from verified peers and community discussion
            </p>
          </div>

          <div className="text-center">
            <div className="text-4xl mb-4" role="img" aria-label="Target">
              🎯
            </div>
            <h2 className="text-2xl font-bold mb-2">Daily Questions</h2>
            <p className="text-gray-600">
              Stay motivated with daily questions and streaks
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export const Home = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <SignedOutHome />;
  }

  return <SignedInHome />;
};
