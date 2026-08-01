import { useState } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useFetch } from "../hooks/useFetch";
import api from "../utils/api";
import { API_ENDPOINTS, CONTENT_TYPES } from "../utils/constants";
import { getErrorMessage, getYouTubeThumbnail } from "../utils/helpers";
import { useAuth } from "../contexts/AuthContext";
import { Loading } from "../components/Loading";
import { CategorySelect } from "../components/CategorySelect";
import { Avatar } from "../components/Avatar";

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

export const ContentPage = () => {
  const [categoryId, setCategoryId] = useState("");
  const [sort, setSort] = useState("newest");
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<string>(CONTENT_TYPES.VIDEO);
  const [contentUrl, setContentUrl] = useState("");
  const [newCategoryId, setNewCategoryId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const params = new URLSearchParams();
  params.set("sort", sort);
  if (categoryId) params.set("categoryId", categoryId);

  const { data: content, isLoading } = useFetch<ContentItem[]>(
    ["content", categoryId, sort],
    `${API_ENDPOINTS.CONTENT.LIST}?${params.toString()}`,
  );

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !contentUrl || !newCategoryId) return;
    setSubmitting(true);
    setError("");
    setSuccess(false);
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
      setSuccess(true);
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

      {success && (
        <div className="bg-green-100 text-green-700 p-4 rounded mb-4">
          Content shared successfully.
        </div>
      )}

      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <span className="text-gray-700 font-medium">Filter:</span>
          <CategorySelect value={categoryId} onChange={setCategoryId} />
        </div>
        <div className="flex items-center gap-3">
          <label className="text-gray-700 font-medium">Sort:</label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2"
          >
            <option value="newest">Newest</option>
            <option value="rating">Top rated</option>
          </select>
        </div>
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
                <CategorySelect value={newCategoryId} onChange={setNewCategoryId} className="grid-cols-1" />
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
          {content?.map((item) => {
            const thumb = getYouTubeThumbnail(item.contentUrl);
            return (
              <Link
                key={item.id}
                to={`/content/${item.id}`}
                className="block bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition"
              >
                <div className="flex items-start gap-4">
                  {thumb ? (
                    <img
                      src={thumb}
                      alt={item.title}
                      className="w-24 h-16 object-cover rounded shrink-0"
                    />
                  ) : (
                    <div className="w-24 h-16 bg-gray-100 flex items-center justify-center text-2xl text-gray-400 shrink-0 rounded">
                      📄
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-blue-700">{item.title}</h3>
                    <p className="text-gray-600 line-clamp-2">{item.description}</p>
                    <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                      <Avatar name={item.creator.username} className="w-6 h-6 text-xs" />
                      <span>
                        by{" "}
                        <Link
                          to={`/users/${item.creator.username}`}
                          className="text-blue-600 hover:underline"
                        >
                          {item.creator.username}
                        </Link>
                      </span>
                      <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded uppercase text-xs font-bold">
                        {item.type}
                      </span>
                      <span>in {item.category.name}</span>
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500 shrink-0">
                    <div className="font-semibold text-gray-700">
                      ⭐ {item.avgRating.toFixed(1)} ({item.ratingCount})
                    </div>
                    <div>👍 {item.upvoteCount}</div>
                    <div>{item.commentCount} comments</div>
                  </div>
                </div>
              </Link>
            );
          })}
          {content?.length === 0 && (
            <div className="text-center text-gray-500 py-10">
              <p className="mb-4">No content yet.</p>
              {isAuthenticated ? (
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-700"
                >
                  Share the first resource
                </button>
              ) : (
                <Link
                  to="/login"
                  className="text-blue-600 hover:underline"
                >
                  Login to share content
                </Link>
              )}
            </div>
          )}
        </div>
      </Loading>
    </div>
  );
};
