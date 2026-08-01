import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import api from "../utils/api";
import { API_ENDPOINTS } from "../utils/constants";
import { getErrorMessage } from "../utils/helpers";
import { useAuth } from "../contexts/AuthContext";

export const ChangeUsernameForm = () => {
  const { updateUser } = useAuth();
  const [newUsername, setNewUsername] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const response = await api.put(API_ENDPOINTS.USERS.UPDATE_ME, {
        username: newUsername.trim().toLowerCase(),
      });
      const updated = response.data.data;
      updateUser({ username: updated.username });
      setNewUsername("");
      setMsg({ type: "success", text: "Username updated" });
      queryClient.invalidateQueries({ queryKey: ["me"] });
    } catch (err: unknown) {
      setMsg({
        type: "error",
        text: getErrorMessage(err, "Failed to update username"),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <input
        type="text"
        value={newUsername}
        onChange={(e) => setNewUsername(e.target.value.toLowerCase())}
        pattern="[a-z0-9_]{3,20}"
        title="3-20 characters: letters, numbers, or underscores"
        required
        className="flex-1 border border-gray-300 rounded px-4 py-2"
        placeholder="new_username"
      />
      <button
        type="submit"
        disabled={saving}
        className="bg-blue-600 text-white px-6 py-2 rounded font-semibold hover:bg-blue-700 disabled:bg-gray-400"
      >
        {saving ? "Saving..." : "Save"}
      </button>
      {msg && (
        <p
          className={`w-full text-sm ${
            msg.type === "success" ? "text-green-600" : "text-red-600"
          }`}
        >
          {msg.text}
        </p>
      )}
    </form>
  );
};
