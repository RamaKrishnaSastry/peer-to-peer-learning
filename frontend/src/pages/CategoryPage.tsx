import { Link, useParams } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";
import { API_ENDPOINTS } from "../utils/constants";
import { Loading } from "../components/Loading";

interface CategoryNode {
  id: number;
  name: string;
  slug: string;
  domain: string;
  level: number;
  children?: CategoryNode[];
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

  const children = category?.children ?? [];
  const childLevelLabel = LEVEL_LABELS[(category?.level ?? 0) + 1] ?? "Category";
  const domainSlug = category?.domain.toLowerCase();

  return (
    <div className="max-w-6xl mx-auto py-8">
      <nav className="text-sm text-gray-500 mb-6 flex flex-wrap items-center gap-1">
        <Link to="/categories" className="text-blue-600 hover:underline">
          Browse
        </Link>
        {breadcrumb?.map((item) => (
          <span key={item.id} className="flex items-center gap-1">
            <span className="text-gray-400">/</span>
            <Link
              to={`/categories/${item.slug}`}
              className="hover:underline text-gray-600 hover:text-blue-600"
            >
              {item.name}
            </Link>
          </span>
        ))}
      </nav>

      <Loading isLoading={isLoading}>
        {category ? (
          <>
            <h1 className="text-4xl font-bold mb-2">{category.name}</h1>
            <p className="text-gray-500 mb-8">
              {LEVEL_LABELS[category.level] ?? "Category"} · {category.domain}
            </p>

            {children.length > 0 ? (
              <>
                <h2 className="text-xl font-bold mb-4">{childLevelLabel}s</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {children.map((child) => (
                    <Link
                      key={child.id}
                      to={`/categories/${child.slug}`}
                      className="p-6 border border-gray-200 rounded-lg hover:shadow-lg transition"
                    >
                      <h3 className="text-xl font-bold text-blue-600 mb-2">
                        {child.name}
                      </h3>
                      <p className="text-gray-600">
                        {(child.children?.length ?? 0) > 0
                          ? `${child.children!.length} ${LEVEL_LABELS[child.level + 1]?.toLowerCase() ?? "items"} inside`
                          : "Leaf topic"}
                      </p>
                    </Link>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-gray-600 bg-white border border-gray-200 rounded-lg p-6">
                This is a leaf topic. No sub-categories here.
              </p>
            )}

            {domainSlug && (
              <div className="mt-8 flex flex-wrap gap-4">
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
            )}
          </>
        ) : (
          <p className="text-center text-gray-600 py-10">Category not found.</p>
        )}
      </Loading>
    </div>
  );
};
