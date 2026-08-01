import { useState } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useFetch } from "../hooks/useFetch";
import api from "../utils/api";
import { API_ENDPOINTS } from "../utils/constants";
import { useAuth } from "../contexts/AuthContext";
import { Loading } from "../components/Loading";
import { getTimeAgo } from "../utils/helpers";

interface Notification {
  id: string;
  type: string;
  message: string;
  targetType?: string;
  targetId?: string;
  actorName?: string;
  read: boolean;
  createdAt: string;
}

interface NotificationsResponse {
  data: Notification[];
  total: number;
  unreadCount: number;
  hasMore: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  answer_on_discussion: "💬 New answer",
  comment_on_content: "💭 New comment",
  comment_on_answer: "💭 New comment",
  comment_on_discussion: "💭 New comment",
};

export const NotificationsPage = () => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [acting, setActing] = useState<string | null>(null);

  const { data, isLoading } = useFetch<NotificationsResponse>(
    ["notifications"],
    API_ENDPOINTS.NOTIFICATIONS.LIST,
    { enabled: isAuthenticated },
  );

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["notifications"] });

  const markRead = async (id: string) => {
    setActing(id);
    try {
      await api.post(API_ENDPOINTS.NOTIFICATIONS.READ(id));
    } finally {
      setActing(null);
    }
    invalidate();
  };

  const markAllRead = async () => {
    setActing("all");
    try {
      await api.post(API_ENDPOINTS.NOTIFICATIONS.READ_ALL);
    } finally {
      setActing(null);
    }
    invalidate();
  };

  const notifications = data?.data ?? [];

  const targetHref = (n: Notification): string => {
    if (n.targetType === "content" && n.targetId) return `/content/${n.targetId}`;
    if (n.targetType === "discussion" && n.targetId) return `/discussions/${n.targetId}`;
    if (n.targetType === "answer" && n.targetId) return `/discussions/answer/${n.targetId}`;
    return "/notifications";
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Notifications</h1>
        {data && data.unreadCount > 0 && (
          <button
            onClick={markAllRead}
            disabled={acting !== null}
            className="text-sm text-blue-600 hover:underline disabled:text-gray-400"
          >
            {acting === "all" ? "Marking..." : "Mark all as read"}
          </button>
        )}
      </div>

      <Loading isLoading={isLoading}>
        {notifications.length === 0 ? (
          <div className="text-center text-gray-600 py-16 bg-white border border-gray-200 rounded-lg">
            <div className="text-4xl mb-3">🔔</div>
            <p>No notifications yet.</p>
            <p className="text-sm text-gray-500 mt-1">
              You&apos;ll be notified when someone answers your discussion or comments on your content.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <Link
                key={n.id}
                to={targetHref(n)}
                onClick={() => {
                  if (!n.read && acting === null) markRead(n.id);
                }}
                className={`block border rounded-lg p-4 hover:shadow-md transition ${
                  n.read ? "bg-white border-gray-200" : "bg-blue-50 border-blue-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{TYPE_LABELS[n.type] ?? "🔔"}</span>
                  <div className="flex-1">
                    <p className="text-gray-800">
                      {n.message}
                      {!n.read && (
                        <span className="ml-2 inline-block w-2 h-2 rounded-full bg-blue-600 align-middle" />
                      )}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{getTimeAgo(n.createdAt)}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Loading>
    </div>
  );
};
