import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useFetch } from "../hooks/useFetch";
import api from "../utils/api";
import { API_ENDPOINTS } from "../utils/constants";
import { useAuth } from "../contexts/AuthContext";
import { Loading } from "../components/Loading";
import { getTimeAgo, getErrorMessage } from "../utils/helpers";

interface Comment {
  id: string;
  text: string;
  upvoteCount: number;
  createdAt: string;
  user: { id: string; username: string };
}

interface ContentDetail {
  id: string;
  title: string;
  description: string;
  type: string;
  contentUrl: string;
  avgRating: number;
  ratingCount: number;
  upvoteCount: number;
  myRating: number | null;
  createdAt: string;
  creator: { id: string; username: string };
  category: { id: number; name: string };
  comments: Comment[];
}

const extractYouTubeId = (url: string): string | null => {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/,
  );
  return match ? match[1] : null;
};

export const ContentDetailPage = () => {
  const { id = "" } = useParams();
  const [commentText, setCommentText] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const { data: content, isLoading } = useFetch<ContentDetail>(
    ["content", id],
    API_ENDPOINTS.CONTENT.GET(id!),
  );

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["content", id] });

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText) return;
    setSubmitting(true);
    setError("");
    try {
      await api.post(API_ENDPOINTS.CONTENT.COMMENT(id!), { text: commentText });
      setCommentText("");
      invalidate();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to add comment"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRate = async (stars: number) => {
    try {
      await api.post(API_ENDPOINTS.CONTENT.RATE(id!), { stars });
      invalidate();
    } catch (err) {
      console.error("Rate failed:", err);
    }
  };

  const handleUpvote = async () => {
    try {
      await api.post(API_ENDPOINTS.CONTENT.UPVOTE(id!));
      invalidate();
    } catch (err) {
      console.error("Upvote failed:", err);
    }
  };

  const videoId = content?.type === "video" ? extractYouTubeId(content.contentUrl) : null;

  return (
    <div className="max-w-3xl mx-auto py-8">
      <Link to="/content" className="text-blue-600 hover:underline mb-4 inline-block">
        ← Back to content
      </Link>

      <Loading isLoading={isLoading}>
        {content ? (
          <>
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold mb-1">{content.title}</h1>
                  <div className="text-sm text-gray-500 mb-4">
                    by{" "}
                    <Link
                      to={`/users/${content.creator.username}`}
                      className="text-blue-600 hover:underline"
                    >
                      {content.creator.username}
                    </Link>{" "}
                    · {getTimeAgo(content.createdAt)} · {content.category.name}
                  </div>
                </div>
                <button
                  onClick={handleUpvote}
                  className="flex flex-col items-center px-3 py-2 border border-gray-300 rounded-lg hover:border-blue-500"
                >
                  <span className="text-lg">👍</span>
                  <span className="font-bold text-sm">{content.upvoteCount}</span>
                </button>
              </div>

              <p className="text-gray-700 whitespace-pre-wrap mb-4">{content.description}</p>

              {videoId && (
                <div className="aspect-video mb-4">
                  <iframe
                    className="w-full h-full rounded"
                    src={`https://www.youtube.com/embed/${videoId}`}
                    title={content.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}

              <div className="flex items-center gap-2">
                <span className="font-semibold">Rate:</span>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleRate(star)}
                    disabled={!isAuthenticated}
                    className={`text-2xl ${
                      star <= (content.myRating ?? Math.round(content.avgRating))
                        ? "text-yellow-400"
                        : "text-gray-300"
                    } hover:scale-110 transition`}
                  >
                    ★
                  </button>
                ))}
                <span className="text-sm text-gray-500 ml-2">
                  {content.avgRating.toFixed(1)} ({content.ratingCount} ratings)
                </span>
              </div>
            </div>

            <h2 className="text-xl font-bold mb-4">
              Comments ({content.comments.length})
            </h2>

            <div className="space-y-3 mb-8">
              {content.comments.map((comment) => (
                <div
                  key={comment.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
                >
                  <p className="text-gray-800 mb-1">{comment.text}</p>
                  <div className="text-sm text-gray-500">
                    {comment.user.username} · {getTimeAgo(comment.createdAt)}
                  </div>
                </div>
              ))}
              {content.comments.length === 0 && (
                <p className="text-center text-gray-500 py-4">No comments yet.</p>
              )}
            </div>

            {isAuthenticated ? (
              <form
                onSubmit={handleComment}
                className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm"
              >
                <h3 className="text-lg font-bold mb-4">Add a Comment</h3>
                {error && (
                  <div className="bg-red-100 text-red-700 p-4 rounded mb-4">{error}</div>
                )}
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  required
                  rows={3}
                  className="w-full border border-gray-300 rounded px-4 py-2 mb-4"
                  placeholder="Share your feedback..."
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {submitting ? "Posting..." : "Post Comment"}
                </button>
              </form>
            ) : (
              <p className="text-center text-gray-600">
                <Link to="/login" className="text-blue-600 hover:underline">
                  Login
                </Link>{" "}
                to comment and rate
              </p>
            )}
          </>
        ) : (
          <p className="text-center text-gray-600 py-10">Content not found.</p>
        )}
      </Loading>
    </div>
  );
};
