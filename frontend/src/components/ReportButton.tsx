import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getErrorMessage } from "../utils/helpers";

const REASONS = [
  { id: "spam", label: "Spam or duplicate" },
  { id: "abuse", label: "Abuse or harassment" },
  { id: "misinformation", label: "Misinformation" },
  { id: "other", label: "Other" },
];

interface ReportButtonProps {
  targetType: string;
  targetId: string;
  onSubmit: (payload: {
    targetType: string;
    targetId: string;
    reason: string;
    details?: string;
  }) => Promise<unknown>;
  className?: string;
}

export const ReportButton = ({
  targetType,
  targetId,
  onSubmit,
  className = "",
}: ReportButtonProps) => {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("spam");
  const [details, setDetails] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [error, setError] = useState("");

  if (!isAuthenticated) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setError("");
    try {
      await onSubmit({ targetType, targetId, reason, details: details.trim() || undefined });
      setStatus("done");
    } catch (err: unknown) {
      setStatus("error");
      setError(getErrorMessage(err, "Failed to submit report"));
    }
  };

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Report"
        className={`text-sm text-gray-400 hover:text-red-600 ${className}`}
      >
        🚩 Report
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
          {status === "done" ? (
            <div className="text-center py-2">
              <div className="text-2xl mb-1">✅</div>
              <p className="text-sm text-gray-700">
                Thanks for reporting. Our moderators will review it.
              </p>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setStatus("idle");
                  setDetails("");
                }}
                className="mt-3 text-sm text-blue-600 hover:underline"
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <p className="text-sm font-semibold text-gray-800">Report this item</p>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              >
                {REASONS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={3}
                placeholder="Optional details..."
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
              {status === "error" && (
                <div className="bg-red-100 text-red-700 p-2 rounded text-sm">{error}</div>
              )}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="flex-1 bg-red-600 text-white py-2 rounded text-sm font-semibold hover:bg-red-700 disabled:bg-gray-400"
                >
                  {status === "submitting" ? "Submitting..." : "Submit report"}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-3 py-2 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
