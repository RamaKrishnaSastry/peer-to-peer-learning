import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useFetch } from "../hooks/useFetch";
import api from "../utils/api";
import { API_ENDPOINTS } from "../utils/constants";
import { getErrorMessage, getTimeAgo } from "../utils/helpers";
import { useAuth } from "../contexts/AuthContext";
import { Loading } from "../components/Loading";
import { ReportButton } from "../components/ReportButton";

interface Answer {
  id: string;
  text: string;
  upvoteCount: number;
  commentCount: number;
  myVote: boolean;
  verified: boolean;
  verdict: string | null;
  createdAt: string;
  creator: { id: string; username: string };
}

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
  answers: Answer[];
}

export const DiscussionDetailPage = () => {
  const { id = "" } = useParams();
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [statusError, setStatusError] = useState("");
  const [statusSuccess, setStatusSuccess] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();

  const { data: discussion, isLoading } = useFetch<Discussion>(
    ["discussion", id],
    API_ENDPOINTS.DISCUSSIONS.GET(id!),
  );

  const handlePostAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text) return;
    setSubmitting(true);
    setError("");
    try {
      await api.post(API_ENDPOINTS.DISCUSSIONS.POST_ANSWER(id!), { text });
      setText("");
      queryClient.invalidateQueries({ queryKey: ["discussion", id] });
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to post answer"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpvote = async (answerId: string) => {
    try {
      await api.post(API_ENDPOINTS.ANSWERS.UPVOTE(answerId));
      queryClient.invalidateQueries({ queryKey: ["discussion", id] });
    } catch (err) {
      console.error("Upvote failed:", err);
    }
  };

  const handleToggleClosed = async () => {
    setStatusError("");
    setStatusSuccess(false);
    try {
      if (discussion?.isClosed) {
        await api.post(API_ENDPOINTS.DISCUSSIONS.REOPEN(id!));
      } else {
        await api.post(API_ENDPOINTS.DISCUSSIONS.CLOSE(id!));
      }
      setStatusSuccess(true);
      queryClient.invalidateQueries({ queryKey: ["discussion", id] });
    } catch (err: unknown) {
      setStatusError(getErrorMessage(err, "Failed to update discussion"));
    }
  };

  const isCreator = isAuthenticated && user?.id === discussion?.creator.id;

  return (
    <div className="max-w-3xl mx-auto py-8">
      <Link to="/discussions" className="text-blue-600 hover:underline mb-4 inline-block">
        ← Back to discussions
      </Link>

      <Loading isLoading={isLoading}>
        {discussion ? (
          <>
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold">{discussion.title}</h1>
                  {discussion.isClosed && (
                    <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded uppercase shrink-0">
                      Ended
                    </span>
                  )}
                </div>
                {isCreator && (
                  <button
                    onClick={handleToggleClosed}
                    className={`shrink-0 px-4 py-2 rounded font-semibold border ${
                      discussion.isClosed
                        ? "border-green-600 text-green-700 hover:bg-green-50"
                        : "border-red-600 text-red-700 hover:bg-red-50"
                    }`}
                  >
                    {discussion.isClosed ? "Reopen discussion" : "End discussion"}
                  </button>
                )}
              </div>
              <div className="flex justify-end -mt-2">
                <ReportButton
                  targetType="discussion"
                  targetId={discussion.id}
                  onSubmit={async (payload) => {
                    await api.post(API_ENDPOINTS.REPORTS, payload);
                  }}
                />
              </div>
              {statusError && (
                <div className="bg-red-100 text-red-700 p-3 rounded mt-3">
                  {statusError}
                </div>
              )}
              {statusSuccess && (
                <div className="bg-green-100 text-green-700 p-3 rounded mt-3">
                  {discussion.isClosed
                    ? "Discussion reopened."
                    : "Discussion ended."}
                </div>
              )}
              <div className="text-sm text-gray-500 mt-3 mb-4">
                by{" "}
                <Link
                  to={`/users/${discussion.creator.username}`}
                  className="text-blue-600 hover:underline"
                >
                  {discussion.creator.username}
                </Link>{" "}
                · {getTimeAgo(discussion.createdAt)} · {discussion.viewCount} views
              </div>
              <p className="text-gray-700 whitespace-pre-wrap">{discussion.description}</p>
              {discussion.isClosed && (
                <p className="mt-4 bg-gray-50 border border-gray-200 rounded p-3 text-sm text-gray-600">
                  This discussion has ended by the starter. No more answers can be
                  posted.
                </p>
              )}
            </div>

            <h2 className="text-xl font-bold mb-4">
              {discussion.answers.length} Answers
            </h2>

            <div className="space-y-4 mb-8">
              {discussion.answers.map((answer) => (
                <div
                  key={answer.id}
                  className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleUpvote(answer.id)}
                      className={`flex flex-col items-center px-3 py-2 border rounded-lg hover:border-blue-500 ${
                        answer.myVote
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-300"
                      }`}
                    >
                      <span className="text-lg">👍</span>
                      <span className="font-bold text-sm">{answer.upvoteCount}</span>
                    </button>
                    <div className="flex-1">
                      <p className="text-gray-800 whitespace-pre-wrap mb-2">{answer.text}</p>
                      {answer.verified && (
                        <p className="text-sm text-green-600 font-semibold mb-2">
                          ✓ AI verified: {answer.verdict}
                        </p>
                      )}
                      <div className="text-sm text-gray-500">
                        by{" "}
                        <Link
                          to={`/users/${answer.creator.username}`}
                          className="text-blue-600 hover:underline"
                        >
                          {answer.creator.username}
                        </Link>{" "}
                        · {getTimeAgo(answer.createdAt)} · 💬 {answer.commentCount}
                        <span className="ml-2">
                          <ReportButton
                            targetType="answer"
                            targetId={answer.id}
                            onSubmit={async (payload) => {
                              await api.post(API_ENDPOINTS.REPORTS, payload);
                            }}
                            className="text-xs"
                          />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {discussion.answers.length === 0 && (
                <p className="text-center text-gray-500 py-6">
                  No answers yet. Be the first to help!
                </p>
              )}
            </div>

            {discussion.isClosed ? (
              <p className="text-center text-gray-600">
                This discussion has ended — no new answers allowed.
              </p>
            ) : isAuthenticated ? (
              <form
                onSubmit={handlePostAnswer}
                className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm"
              >
                <h3 className="text-lg font-bold mb-4">Post Your Answer</h3>
                {error && (
                  <div className="bg-red-100 text-red-700 p-4 rounded mb-4">{error}</div>
                )}
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  required
                  rows={4}
                  className="w-full border border-gray-300 rounded px-4 py-2 mb-4"
                  placeholder="Share your explanation..."
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {submitting ? "Posting..." : "Post Answer"}
                </button>
              </form>
            ) : (
              <p className="text-center text-gray-600">
                <Link to="/login" className="text-blue-600 hover:underline">
                  Login
                </Link>{" "}
                to post an answer
              </p>
            )}
          </>
        ) : (
          <p className="text-center text-gray-600 py-10">Discussion not found.</p>
        )}
      </Loading>
    </div>
  );
};
