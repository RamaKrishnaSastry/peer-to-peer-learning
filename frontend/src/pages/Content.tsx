import { useState } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useFetch } from "../hooks/useFetch";
import api from "../utils/api";
import { API_ENDPOINTS, CONTENT_TYPES } from "../utils/constants";
import { getErrorMessage } from "../utils/helpers";
import { useAuth } from "../contexts/AuthContext";
import { Loading } from "../components/Loading";

interface Category {
  id: number;
  name: string;
  slug: string;
  domain: string;
}

interface ContentItem {
  id: string;
  title: string;
  description: string;
  type: string;
  avgRating: number;
  ratingCount: number;
  upvoteCount: number;
  commentCount: number;
  createdAt: string;
  creator: { id: string; username: string };
  category: { id: number; name: string };
}

export const ContentPage = () => {
  const [categoryId, setCategoryId] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<string>(CONTENT_TYPES.VIDEO);
  const [contentUrl, setContentUrl] = useState("");
  const [newCategoryId, setNewCategoryId] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const { data: categories } = useFetch<Category[]>(["categories"], API_ENDPOINTS.CATEGORIES.LIST);
  const { data: content, isLoading } = useFetch<ContentItem[]>(
    ["content", categoryId],
    `${API_ENDPOINTS.CONTENT.LIST}${categoryId ? `?categoryId=${categoryId}` : ""}`,
  );

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !contentUrl || !newCategoryId) return;
    setSubmitting(true);
    setError("");
    try {
      await api.post(API_ENDPOINTS.CONTENT.CREATE, {
        title,
        description,
        type,
        contentUrl,
        categoryId: parseInt(newCategoryId),
      });
      setTitle("");
      setDescription("");
      setContentUrl("");
      setNewCategoryId("");
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ["content"] });
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to upload content"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Learning Content</h1>
        {isAuthenticated && (
          <button
            onClick={() => setShowForm((open) => !open)}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-blue-700"
          >
            {showForm ? "Cancel" : "+ Share Content"}
          </button>
        )}
      </div>

      <div className="mb-6 flex items-center gap-3">
        <label className="text-gray-700 font-medium">Filter:</label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2"
        >
          <option value="">All categories</option>
          {categories?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {isAuthenticated && showForm && (
        <form
          onSubmit={handleUpload}
          className="bg-white border border-gray-200 rounded-lg p-6 mb-8 shadow-sm"
        >
          <h2 className="text-xl font-bold mb-4">Share Content</h2>
          {error && (
            <div className="bg-red-100 text-red-700 p-4 rounded mb-4">{error}</div>
          )}
          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-2">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full border border-gray-300 rounded px-4 py-2"
                placeholder="e.g. Medieval India - Bhakti Movement Notes"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={3}
                className="w-full border border-gray-300 rounded px-4 py-2"
                placeholder="What will learners get from this?"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full border border-gray-300 rounded px-4 py-2"
                >
                  <option value={CONTENT_TYPES.VIDEO}>Video</option>
                  <option value={CONTENT_TYPES.NOTES}>Notes</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Category</label>
                <select
                  value={newCategoryId}
                  onChange={(e) => setNewCategoryId(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded px-4 py-2"
                >
                  <option value="">Select a category</option>
                  {categories?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-gray-700 mb-2">
                Link {type === CONTENT_TYPES.VIDEO ? "(YouTube)" : "(Drive/other)"}
              </label>
              <input
                type="url"
                value={contentUrl}
                onChange={(e) => setContentUrl(e.target.value)}
                required
                className="w-full border border-gray-300 rounded px-4 py-2"
                placeholder="https://..."
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-700 disabled:bg-gray-400"
            >
              {submitting ? "Uploading..." : "Upload Content"}
            </button>
          </div>
        </form>
      )}

      <Loading isLoading={isLoading}>
        <div className="space-y-4">
          {content?.map((item) => (
            <Link
              key={item.id}
              to={`/content/${item.id}`}
              className="block bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-blue-700 mb-1">{item.title}</h3>
                  <p className="text-gray-600 line-clamp-2">{item.description}</p>
                </div>
                <div className="text-right text-sm text-gray-500 shrink-0">
                  <div className="font-semibold text-gray-700">
                    ⭐ {item.avgRating.toFixed(1)} ({item.ratingCount})
                  </div>
                  <div>👍 {item.upvoteCount}</div>
                  <div>{item.commentCount} comments</div>
                </div>
              </div>
              <div className="mt-3 text-sm text-gray-500">
                <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded uppercase text-xs font-bold mr-2">
                  {item.type}
                </span>
                by{" "}
                <Link
                  to={`/users/${item.creator.username}`}
                  className="text-blue-600 hover:underline"
                >
                  {item.creator.username}
                </Link>{" "}
                in {item.category.name}
              </div>
            </Link>
          ))}
          {content?.length === 0 && (
            <p className="text-center text-gray-500 py-10">
              No content yet. Share something above!
            </p>
          )}
        </div>
      </Loading>
    </div>
  );
};
