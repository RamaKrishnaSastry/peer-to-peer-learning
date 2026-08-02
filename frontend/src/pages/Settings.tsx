import { useState } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useFetch } from "../hooks/useFetch";
import api from "../utils/api";
import { API_ENDPOINTS } from "../utils/constants";
import { useAuth } from "../contexts/AuthContext";
import { ChangeUsernameForm } from "../components/ChangeUsernameForm";
import { Loading } from "../components/Loading";
import { Avatar } from "../components/Avatar";
import { getErrorMessage } from "../utils/helpers";

interface Me {
  id: string;
  username: string;
  email: string;
  bio: string | null;
  avatarUrl: string | null;
  domain?: string | null;
}

const buttonBase =
  "px-6 py-2 rounded font-bold hover:opacity-95 disabled:bg-gray-400 disabled:cursor-not-allowed";
const primary = `bg-blue-600 text-white ${buttonBase}`;
const danger = `bg-red-600 text-white ${buttonBase}`;

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
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm flex items-center gap-4">
              <Avatar
                name={me.username}
                avatarUrl={me.avatarUrl}
                className="w-14 h-14 text-xl"
              />
              <div>
                <h2 className="font-semibold">{me.username}</h2>
                <p className="text-sm text-gray-500">{me.email}</p>
                <Link to="/profile" className="text-sm text-blue-600 hover:underline">
                  View my profile ↗
                </Link>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h2 className="font-semibold mb-3">Profile photo &amp; bio</h2>
              <ProfileForm initialBio={me.bio} initialAvatarUrl={me.avatarUrl} />
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h2 className="font-semibold mb-3">Change username</h2>
              <ChangeUsernameForm />
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h2 className="font-semibold mb-1">Exam domain</h2>
              <p className="text-sm text-gray-500 mb-3">
                {me.domain
                  ? "Your feed is scoped to this exam. Change it anytime."
                  : "You currently see everything. Pick an exam to scope your feed to it."}
              </p>
              <DomainForm initialDomain={me.domain} />
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h2 className="font-semibold mb-3">Change password</h2>
              <ChangePasswordForm />
            </div>

            <div className="bg-white border border-red-200 rounded-lg p-6 shadow-sm">
              <h2 className="font-semibold mb-3 text-red-700">Danger zone</h2>
              <p className="text-sm text-gray-500 mb-3">
                Deleting your account permanently removes your profile, content,
                answers, and history. This cannot be undone.
              </p>
              <DeleteAccountForm />
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-600 py-10">Account not found.</p>
        )}
      </Loading>
    </div>
  );
};

const FORM_FIELDS = "w-full border border-gray-300 rounded px-4 py-2";

const ProfileForm = ({
  initialBio,
  initialAvatarUrl,
}: {
  initialBio: string | null;
  initialAvatarUrl: string | null;
}) => {
  const [bio, setBio] = useState(initialBio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { updateUser } = useAuth();
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess(false);
    try {
      let finalAvatarUrl: string | null = avatarUrl.trim() || null;
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        const uploadResponse = await api.post(API_ENDPOINTS.UPLOADS, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        finalAvatarUrl = uploadResponse.data.data.url;
      }
      const response = await api.put(API_ENDPOINTS.USERS.UPDATE_ME, {
        avatarUrl: finalAvatarUrl,
        ...(bio.trim() ? { bio: bio.trim() } : { bio: null }),
      });
      updateUser({
        avatarUrl: response.data.data.avatarUrl,
        bio: response.data.data.bio,
      });
      setAvatarUrl(finalAvatarUrl ?? "");
      setFile(null);
      setSuccess(true);
      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to save profile"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-4">
        <Avatar
          name="preview"
          avatarUrl={file ? undefined : avatarUrl}
          className="w-16 h-16 text-2xl"
        />
        <div className="flex-1">
          <label className="block text-gray-700 mb-1">Upload a photo</label>
          <input
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700"
          />
          {file && (
            <p className="text-xs text-gray-500 mt-1">
              Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB). You&apos;ll
              still need to Save to upload it.
            </p>
          )}
        </div>
      </div>
      <div>
        <label className="block text-gray-700 mb-1">… or paste an avatar URL (optional)</label>
        <input
          type="url"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          className={FORM_FIELDS}
          placeholder="https://..."
        />
      </div>
      <div>
        <label className="block text-gray-700 mb-1">Bio</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          maxLength={300}
          className={FORM_FIELDS}
          placeholder="Tell other learners about yourself..."
        />
      </div>
      {error && <div className="bg-red-100 text-red-700 p-4 rounded">{error}</div>}
      {success && (
        <div className="bg-green-100 text-green-700 p-4 rounded">
          Profile saved successfully.
        </div>
      )}
      <button type="submit" disabled={submitting} className={primary}>
        {submitting ? "Saving..." : "Save Profile"}
      </button>
    </form>
  );
};

const DOMAIN_OPTIONS = [
  { value: "UPSC", emoji: "🏛️", desc: "Civil Services" },
  { value: "JEE", emoji: "⚙️", desc: "Engineering" },
  { value: "Finance", emoji: "📈", desc: "Markets & Investing" },
];

const DomainForm = ({ initialDomain }: { initialDomain?: string | null }) => {
  const { updateUser } = useAuth();
  const [domain, setDomain] = useState(initialDomain ?? "");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain) {
      setError("Select an exam domain.");
      return;
    }
    setSubmitting(true);
    setError("");
    setSuccess(false);
    try {
      const response = await api.put(API_ENDPOINTS.USERS.UPDATE_ME, { domain });
      updateUser({ domain: response.data.data.domain });
      setSuccess(true);
      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to update exam domain"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {DOMAIN_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              setDomain(option.value);
              setSuccess(false);
            }}
            className={`border-2 rounded-lg py-3 px-2 text-center transition ${
              domain === option.value
                ? "border-blue-600 bg-blue-50"
                : "border-gray-300 hover:border-blue-400"
            }`}
          >
            <div className="text-2xl">{option.emoji}</div>
            <div
              className={`font-bold text-sm ${
                domain === option.value ? "text-blue-700" : "text-gray-700"
              }`}
            >
              {option.value}
            </div>
            <div className="text-xs text-gray-500">{option.desc}</div>
          </button>
        ))}
      </div>
      {error && <div className="bg-red-100 text-red-700 p-4 rounded">{error}</div>}
      {success && (
        <div className="bg-green-100 text-green-700 p-4 rounded">
          Exam domain saved. Your feed is now scoped to {domain}.
        </div>
      )}
      <button type="submit" disabled={submitting} className={primary}>
        {submitting ? "Saving..." : "Save Exam Domain"}
      </button>
    </form>
  );
};

const ChangePasswordForm = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    setSubmitting(true);
    try {
      await api.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, {
        currentPassword,
        newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess(true);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to change password"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-gray-700 mb-1">Current password</label>
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
          className={FORM_FIELDS}
        />
      </div>
      <div>
        <label className="block text-gray-700 mb-1">New password</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          className={FORM_FIELDS}
          placeholder="At least 8 characters"
        />
      </div>
      <div>
        <label className="block text-gray-700 mb-1">Confirm new password</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className={FORM_FIELDS}
        />
      </div>
      {error && <div className="bg-red-100 text-red-700 p-4 rounded">{error}</div>}
      {success && (
        <div className="bg-green-100 text-green-700 p-4 rounded">
          Password changed successfully.
        </div>
      )}
      <button type="submit" disabled={submitting} className={primary}>
        {submitting ? "Updating..." : "Change Password"}
      </button>
    </form>
  );
};

const DeleteAccountForm = () => {
  const [confirmText, setConfirmText] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { user, logout } = useAuth();

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (confirmText !== user?.username) {
      setError(`Please type your username (${user?.username}) to confirm.`);
      return;
    }
    if (!password) {
      setError("Enter your password to delete your account.");
      return;
    }
    setSubmitting(true);
    try {
      await api.delete(API_ENDPOINTS.USERS.DELETE_ME, { data: { password } });
      logout();
      window.location.href = "/";
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to delete account"));
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleDelete} className="space-y-4">
      <div>
        <label className="block text-gray-700 mb-1">
          Type <span className="font-semibold">{user?.username}</span> to confirm
        </label>
        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          className={FORM_FIELDS}
          placeholder={user?.username}
        />
      </div>
      <div>
        <label className="block text-gray-700 mb-1">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={FORM_FIELDS}
        />
      </div>
      {error && <div className="bg-red-100 text-red-700 p-4 rounded">{error}</div>}
      <button
        type="submit"
        disabled={submitting}
        className={danger}
      >
        {submitting ? "Deleting..." : "Delete my account permanently"}
      </button>
    </form>
  );
};