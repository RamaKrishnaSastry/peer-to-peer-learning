import { Link, useParams } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";
import { API_ENDPOINTS } from "../utils/constants";
import { Loading } from "../components/Loading";
import { Avatar } from "../components/Avatar";
import { getTimeAgo, getContentThumbnail } from "../utils/helpers";

interface CategoryNode {
  id: number;
  name: string;
  slug: string;
  domain: string;
  level: number;
  isLeaf: boolean;
  parentId: number | null;
  contentCount: number;
  children?: CategoryNode[];
}

interface ContentItem {
  id: string;
  title: string;
  description: string;
  type: string;
  contentUrl: string;
  avgRating: number;
  ratingCount: number;
  upvoteCount: number;
  commentCount: number;
  createdAt: string;
  creator: { id: string; username: string };
  category: { id: number; name: string };
}

const LEVEL_LABELS = ["Domain", "Subject", "Topic", "Subtopic"];

export const CategoryPage = () => {
  const { slug = "" } = useParams();

  const { data: category, isLoading } = useFetch<CategoryNode>(
    ["category", slug],
    API_ENDPOINTS.CATEGORIES.GET(slug),
  );

  const { data: breadcrumb } = useFetch<CategoryNode[]>(
    ["category-breadcrumb", slug],
    API_ENDPOINTS.CATEGORIES.BREADCRUMB(category?.id.toString() ?? ""),
    { enabled: !!category },
  );

  const { data: leafContent } = useFetch<ContentItem[]>(
    ["category-content", category?.id.toString() ?? "none"],
    `${API_ENDPOINTS.CONTENT.LIST}?categoryId=${category?.id ?? ""}&sort=newest`,
    { enabled: !!category?.isLeaf },
  );

  const children = category?.children ?? [];
  const childLevelLabel = LEVEL_LABELS[(category?.level ?? 0) + 1] ?? "Category";
  const parentSlug = breadcrumb?.at(-2)?.slug;

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="flex items-center gap-3 mb-6">
        {parentSlug && (
          <Link
            to={`/categories/${parentSlug}`}
            className="shrink-0 border border-gray-300 rounded px-3 py-1.5 text-sm font-semibold text-gray-700 hover:border-blue-500 hover:text-blue-600 transition"
          >
            ← Back
          </Link>
        )}
        <nav className="text-sm text-gray-500 flex flex-wrap items-center gap-1">
          <Link to="/categories" className="text-blue-600 hover:underline">
            Browse
          </Link>
          {breadcrumb?.map((item) => (
            <span key={item.id} className="flex items-center gap-1">
              <span className="text-gray-400">/</span>
              {item.id === category?.id ? (
                <span className="font-bold text-gray-800">{item.name}</span>
              ) : (
                <Link
                  to={`/categories/${item.slug}`}
                  className="hover:underline text-gray-600 hover:text-blue-600"
                >
                  {item.name}
                </Link>
              )}
            </span>
          ))}
        </nav>
      </div>

      <Loading isLoading={isLoading}>
        {category ? (
          <>
            <h1 className="text-4xl font-bold mb-2">{category.name}</h1>
            <p className="text-gray-500 mb-8">
              {LEVEL_LABELS[category.level] ?? "Category"} · {category.domain}
              {category.contentCount > 0 &&
                ` · ${category.contentCount} item${category.contentCount === 1 ? "" : "s"}`}
            </p>

            {children.length > 0 && (
              <>
                <h2 className="text-xl font-bold mb-4">{childLevelLabel}s</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                  {children.map((child) => (
                    <Link
                      key={child.id}
                      to={`/categories/${child.slug}`}
                      className="p-6 border border-gray-200 rounded-lg hover:shadow-lg hover:border-blue-300 transition"
                    >
                      <h3 className="text-xl font-bold text-blue-600 mb-2">
                        {child.name}
                      </h3>
                      <p className="text-gray-600">
                        {(child.children?.length ?? 0) > 0
                          ? `${child.children!.length} ${LEVEL_LABELS[child.level + 1]?.toLowerCase() ?? "items"} inside`
                          : child.contentCount > 0
                            ? `${child.contentCount} item${child.contentCount === 1 ? "" : "s"}`
                            : "No content yet"}
                      </p>
                    </Link>
                  ))}
                </div>
              </>
            )}

            {category.isLeaf && (
              <>
                <h2 className="text-xl font-bold mb-4">
                  Content in {category.name}
                </h2>
                {leafContent && leafContent.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {leafContent.map((item) => {
                      const thumb = getContentThumbnail(item.contentUrl, item.type);
                      return (
                        <Link
                          key={item.id}
                          to={`/content/${item.id}`}
                          className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-lg hover:border-blue-300 transition"
                        >
                          {thumb ? (
                            <img
                              src={thumb}
                              alt={item.title}
                              className="w-full h-36 object-cover"
                            />
                          ) : (
                            <div className="w-full h-36 bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center text-5xl text-gray-300">
                              📄
                            </div>
                          )}
                          <div className="p-4">
                            <h3 className="font-bold text-blue-700 line-clamp-2 mb-1">
                              {item.title}
                            </h3>
                            <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                              {item.description}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Avatar
                                name={item.creator.username}
                                className="w-6 h-6 text-xs"
                              />
                              <span className="truncate">{item.creator.username}</span>
                              <span className="ml-auto shrink-0 font-semibold text-gray-700">
                                ⭐ {item.avgRating.toFixed(1)}
                              </span>
                              <span className="shrink-0">👍 {item.upvoteCount}</span>
                              <span className="shrink-0 text-gray-400">
                                {getTimeAgo(item.createdAt)}
                              </span>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-600 bg-white border border-gray-200 rounded-lg p-6">
                    No content here yet.{" "}
                    <Link to="/content" className="text-blue-600 hover:underline">
                      Share the first resource
                    </Link>
                    .
                  </p>
                )}
              </>
            )}

            {children.length === 0 && !category.isLeaf && (
              <p className="text-gray-600 bg-white border border-gray-200 rounded-lg p-6">
                No sub-categories here.
              </p>
            )}

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                to={`/content?categoryId=${category.id}`}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
              >
                View {category.name} content
              </Link>
              <Link
                to={`/discussions?categoryId=${category.id}`}
                className="border-2 border-blue-600 text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50"
              >
                Discuss {category.name}
              </Link>
            </div>
          </>
        ) : (
          <p className="text-center text-gray-600 py-10">Category not found.</p>
        )}
      </Loading>
    </div>
  );
};
