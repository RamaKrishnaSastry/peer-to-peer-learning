import { useState } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useFetch } from "../hooks/useFetch";
import api from "../utils/api";
import { API_ENDPOINTS } from "../utils/constants";
import { useAuth } from "../contexts/AuthContext";
import { ChangeUsernameForm } from "../components/ChangeUsernameForm";
import { Loading } from "../components/Loading";
import { getErrorMessage } from "../utils/helpers";

interface Me {
  id: string;
  username: string;
  email: string;
  bio: string | null;
  avatarUrl: string | null;
}

export const SettingsPage = () => {
  const { isAuthenticated } = useAuth();
  const { data: me, isLoading } = useFetch<Me>(
    ["me"],
    API_ENDPOINTS.USERS.GET_ME,
    { enabled: isAuthenticated },
  );

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Settings</h1>
        <p className="text-gray-600 mb-6">Login to manage your account.</p>
        <Link
          to="/login"
          className="inline-block bg-blue-600 text-white px-8 py-3 rounded font-bold hover:bg-blue-700"
        >
          Login
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      <Loading isLoading={isLoading}>
        {me ? (
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h2 className="font-semibold mb-1">Account</h2>
              <p className="text-sm text-gray-500">
                {me.username} · {me.email}
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h2 className="font-semibold mb-3">Change username</h2>
              <ChangeUsernameForm />
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h2 className="font-semibold mb-3">Profile</h2>
              <ProfileForm initialBio={me.bio} initialAvatarUrl={me.avatarUrl} />
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-600 py-10">Account not found.</p>
        )}
      </Loading>
    </div>
  );
};

const ProfileForm = ({
  initialBio,
  initialAvatarUrl,
}: {
  initialBio: string | null;
  initialAvatarUrl: string | null;
}) => {
  const [bio, setBio] = useState(initialBio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl ?? "");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess(false);
    try {
      await api.put(API_ENDPOINTS.USERS.UPDATE_ME, {
        ...(avatarUrl.trim() ? { avatarUrl: avatarUrl.trim() } : { avatarUrl: null }),
        ...(bio.trim() ? { bio: bio.trim() } : { bio: null }),
      });
      setSuccess(true);
      queryClient.invalidateQueries({ queryKey: ["me"] });
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to save profile"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-gray-700 mb-2">Bio</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          maxLength={300}
          className="w-full border border-gray-300 rounded px-4 py-2"
          placeholder="Tell other learners about yourself..."
        />
      </div>
      <div>
        <label className="block text-gray-700 mb-2">Avatar URL</label>
        <input
          type="url"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          className="w-full border border-gray-300 rounded px-4 py-2"
          placeholder="https://..."
        />
      </div>
      {error && <div className="bg-red-100 text-red-700 p-4 rounded">{error}</div>}
      {success && (
        <div className="bg-green-100 text-green-700 p-4 rounded">
          Profile saved successfully.
        </div>
      )}
      <button
        type="submit"
        disabled={submitting}
        className="bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-700 disabled:bg-gray-400"
      >
        {submitting ? "Saving..." : "Save Profile"}
      </button>
    </form>
  );
};
