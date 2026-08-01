import { Link, useSearchParams } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";
import { API_ENDPOINTS } from "../utils/constants";
import { useAuth } from "../contexts/AuthContext";
import { Loading } from "../components/Loading";
import { Avatar } from "../components/Avatar";
import { getTimeAgo, getYouTubeThumbnail } from "../utils/helpers";

interface SearchResult {
  content: {
    id: string;
    title: string;
    description: string;
    type: string;
    contentUrl: string;
    avgRating: number;
    upvoteCount: number;
    commentCount: number;
    createdAt: string;
    creator: { username: string };
    category: { name: string };
  }[];
  discussions: {
    id: string;
    title: string;
    description: string;
    answerCount: number;
    isClosed: boolean;
    createdAt: string;
    creator: { username: string };
    category: { name: string };
  }[];
  categories: {
    id: number;
    name: string;
    slug: string;
    domain: string;
    level: number;
    path: string;
  }[];
  total: number;
}

const LEVEL_LABELS = ["Domain", "Subject", "Topic", "Subtopic"];

export const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const domain = user?.domain;
  const q = searchParams.get("q") ?? "";

  const { data, isLoading } = useFetch<SearchResult>(
    ["search", q, domain ?? "all"],
    `${API_ENDPOINTS.SEARCH}?q=${encodeURIComponent(q)}${domain ? `&domain=${domain}` : ""}`,
    { enabled: q.length > 0 },
  );

  if (!q.trim()) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Search</h1>
        <p className="text-gray-600">
          Use the search box in the top bar to find content, discussions, and topics.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-2">Results for “{q}”</h1>
      <p className="text-gray-500 mb-8">
        {data ? `${data.total} result${data.total === 1 ? "" : "s"}` : "Searching..."}
      </p>

      <Loading isLoading={isLoading}>
        {data && data.total === 0 ? (
          <div className="text-center text-gray-600 py-16 bg-white border border-gray-200 rounded-lg">
            <p className="mb-4">No results found.</p>
            <Link to="/categories" className="text-blue-600 hover:underline">
              Browse the curriculum instead
            </Link>
          </div>
        ) : (
          data && (
            <div className="space-y-10">
              {data.content.length > 0 && (
                <section>
                  <h2 className="text-xl font-bold mb-4">Content</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {data.content.map((item) => {
                      const thumb = getYouTubeThumbnail(item.contentUrl);
                      return (
                        <Link
                          key={item.id}
                          to={`/content/${item.id}`}
                          className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition"
                        >
                          {thumb ? (
                            <img src={thumb} alt={item.title} className="w-full h-32 object-cover" />
                          ) : (
                            <div className="w-full h-32 bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center text-4xl text-gray-300">
                              📄
                            </div>
                          )}
                          <div className="p-4">
                            <h3 className="font-bold text-blue-700 line-clamp-2 mb-1">
                              {item.title}
                            </h3>
                            <div className="text-xs text-gray-500 mb-2">
                              {item.category.name}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Avatar name={item.creator.username} className="w-6 h-6 text-xs" />
                              <span className="truncate">{item.creator.username}</span>
                              <span className="ml-auto shrink-0 font-semibold">
                                ⭐ {item.avgRating.toFixed(1)}
                              </span>
                              <span className="shrink-0">👍 {item.upvoteCount}</span>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              )}

              {data.discussions.length > 0 && (
                <section>
                  <h2 className="text-xl font-bold mb-4">Discussions</h2>
                  <div className="space-y-3">
                    {data.discussions.map((d) => (
                      <Link
                        key={d.id}
                        to={`/discussions/${d.id}`}
                        className="block bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-blue-700">{d.title}</span>
                          {d.isClosed && (
                            <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded uppercase">
                              Ended
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-1">{d.description}</p>
                        <div className="mt-2 text-xs text-gray-500">
                          {d.category.name} · {d.answerCount} answers · {getTimeAgo(d.createdAt)}
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {data.categories.length > 0 && (
                <section>
                  <h2 className="text-xl font-bold mb-4">Topics</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.categories.map((c) => (
                      <Link
                        key={c.id}
                        to={`/categories/${c.slug}`}
                        className="p-4 border border-gray-200 rounded-lg hover:shadow-lg transition"
                      >
                        <div className="font-bold text-blue-600">{c.name}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {LEVEL_LABELS[c.level] ?? "Topic"} · {c.domain}
                        </div>
                        <div className="text-xs text-gray-400 truncate mt-1">{c.path}</div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )
        )}
      </Loading>
    </div>
  );
};
