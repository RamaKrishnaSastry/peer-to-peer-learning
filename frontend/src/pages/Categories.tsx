import { useFetch } from "../hooks/useFetch";
import { API_ENDPOINTS } from "../utils/constants";
import { Loading } from "../components/Loading";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface Category {
  id: number;
  name: string;
  slug: string;
  domain: string;
  level: number;
  children?: Category[];
}

export const CategoriesPage = () => {
  const { user } = useAuth();
  const domain = user?.domain;
  const { data: categories, isLoading } = useFetch<Category[]>(
    ["categories", domain ?? "all"],
    API_ENDPOINTS.CATEGORIES.LIST,
  );

  const visible = domain ? categories?.filter((c) => c.domain === domain) : categories;

  return (
    <div className="max-w-6xl mx-auto py-8">
      <h1 className="text-4xl font-bold mb-8">Browse by Category</h1>

      <Loading isLoading={isLoading}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {visible?.map((category) => (
            <Link
              key={category.id}
              to={`/categories/${category.slug}`}
              className="p-6 border border-gray-200 rounded-lg hover:shadow-lg transition"
            >
              <h2 className="text-2xl font-bold text-blue-600 mb-2">
                {category.name}
              </h2>
              <p className="text-gray-600">Domain: {category.domain}</p>
            </Link>
          ))}
        </div>
      </Loading>
    </div>
  );
};
