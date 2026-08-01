import { useState } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useFetch } from "../hooks/useFetch";
import api from "../utils/api";
import { API_ENDPOINTS } from "../utils/constants";
import { getErrorMessage } from "../utils/helpers";
import { useAuth } from "../contexts/AuthContext";
import { Loading } from "../components/Loading";
import { CategorySelect } from "../components/CategorySelect";
import { Avatar } from "../components/Avatar";

interface Discussion {
  id: string;
  title: string;
  description: string;
  answerCount: number;
  viewCount: number;
  isClosed: boolean;
  createdAt: string;
  creator: { id: string; username: string };
  category: { id: number; name: string };
}

export const DiscussionsPage = () => {
  const [categoryId, setCategoryId] = useState("");
  const [sort, setSort] = useState("newest");
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [newCategoryId, setNewCategoryId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const params = new URLSearchParams();
  params.set("sort", sort);
  if (categoryId) params.set("categoryId", categoryId);

  const { data: discussions, isLoading } = useFetch<Discussion[]>(
    ["discussions", categoryId, sort],
    `${API_ENDPOINTS.DISCUSSIONS.LIST}?${params.toString()}`,
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !newCategoryId) return;
    setSubmitting(true);
    setError("");
    setSuccess(false);
    try {
      await api.post(API_ENDPOINTS.DISCUSSIONS.CREATE, {
        title,
        description,
        categoryId: parseInt(newCategoryId),
      });
      setTitle("");
      setDescription("");
      setNewCategoryId("");
      setShowForm(false);
      setSuccess(true);
      queryClient.invalidateQueries({ queryKey: ["discussions"] });
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to create discussion"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Discussions</h1>
        {isAuthenticated && (
          <button
            onClick={() => setShowForm((open) => !open)}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-blue-700"
          >
            {showForm ? "Cancel" : "+ New Discussion"}
          </button>
        )}
      </div>

      {success && (
        <div className="bg-green-100 text-green-700 p-4 rounded mb-4">
          Discussion posted successfully.
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
            <option value="top">Most answered</option>
          </select>
        </div>
      </div>

      {isAuthenticated && showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-white border border-gray-200 rounded-lg p-6 mb-8 shadow-sm"
        >
          <h2 className="text-xl font-bold mb-4">Start a Discussion</h2>
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
                placeholder="What do you want to discuss?"
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
                placeholder="Share your question or explanation..."
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Category</label>
              <CategorySelect value={newCategoryId} onChange={setNewCategoryId} className="grid-cols-1" />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-700 disabled:bg-gray-400"
            >
              {submitting ? "Posting..." : "Post Discussion"}
            </button>
          </div>
        </form>
      )}

      <Loading isLoading={isLoading}>
        <div className="space-y-4">
          {discussions?.map((discussion) => (
            <Link
              key={discussion.id}
              to={`/discussions/${discussion.id}`}
              className="block bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-blue-700">
                      {discussion.title}
                    </h3>
                    {discussion.isClosed && (
                      <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded uppercase">
                        Ended
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 line-clamp-2">{discussion.description}</p>
                </div>
                <div className="text-right text-sm text-gray-500 shrink-0">
                  <div>{discussion.answerCount} answers</div>
                  <div>{discussion.viewCount} views</div>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                <Avatar name={discussion.creator.username} className="w-6 h-6 text-xs" />
                <span>
                  by{" "}
                  <Link
                    to={`/users/${discussion.creator.username}`}
                    className="text-blue-600 hover:underline"
                  >
                    {discussion.creator.username}
                  </Link>
                </span>
                <span>in {discussion.category.name}</span>
              </div>
            </Link>
          ))}
          {discussions?.length === 0 && (
            <div className="text-center text-gray-500 py-10">
              <p className="mb-4">No discussions yet.</p>
              {isAuthenticated ? (
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-700"
                >
                  Start the first discussion
                </button>
              ) : (
                <Link to="/login" className="text-blue-600 hover:underline">
                  Login to start a discussion
                </Link>
              )}
            </div>
          )}
        </div>
      </Loading>
    </div>
  );
};
