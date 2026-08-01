import { useFetch } from "../hooks/useFetch";
import { API_ENDPOINTS } from "../utils/constants";
import { Loading } from "../components/Loading";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface Category {
  id: number;
  name: string;
  slug: string;
  domain: string;
  level: number;
  contentCount?: number;
  children?: Category[];
}

export const CategoriesPage = () => {
  const { user } = useAuth();
  const domain = user?.domain;
  const { data: categories, isLoading } = useFetch<Category[]>(
    ["categories", "all"],
    API_ENDPOINTS.CATEGORIES.LIST,
  );

  if (domain) {
    return <Navigate to={`/categories/${domain.toLowerCase()}`} replace />;
  }

  return (
    <div className="max-w-6xl mx-auto py-8">
      <h1 className="text-4xl font-bold mb-8">Browse by Category</h1>

      <Loading isLoading={isLoading}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories?.map((category) => (
            <Link
              key={category.id}
              to={`/categories/${category.slug}`}
              className="p-6 border border-gray-200 rounded-lg hover:shadow-lg hover:border-blue-300 transition"
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-bold text-blue-600">
                  {category.name}
                </h2>
                <span className="text-3xl">
                  {category.name === "UPSC"
                    ? "🏛️"
                    : category.name === "JEE"
                      ? "⚙️"
                      : "📈"}
                </span>
              </div>
              <p className="text-gray-600">
                {category.contentCount && category.contentCount > 0
                  ? `${category.contentCount} shared item${category.contentCount === 1 ? "" : "s"}`
                  : "No content yet"}
              </p>
            </Link>
          ))}
        </div>
      </Loading>
    </div>
  );
};
