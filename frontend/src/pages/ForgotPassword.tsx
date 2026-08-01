import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../utils/api";
import { API_ENDPOINTS } from "../utils/constants";
import { getErrorMessage } from "../utils/helpers";

export const ForgotPasswordPage = () => {
  const [step, setStep] = useState<"email" | "reset" | "done">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [devOtp, setDevOtp] = useState<string | undefined>(undefined);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const response = await api.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
      setDevOtp(response.data.data.devOtp);
      setStep("reset");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to send reset code"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await api.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, { email, code, newPassword });
      setStep("done");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to reset password"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-16">
      <h1 className="text-3xl font-bold mb-6 text-center">Reset Password</h1>

      {step === "email" && (
        <form onSubmit={handleRequest} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-4">
          <div>
            <label className="block text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-300 rounded px-4 py-2"
              placeholder="you@example.com"
            />
          </div>
          {error && <div className="bg-red-100 text-red-700 p-4 rounded">{error}</div>}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isLoading ? "Sending..." : "Send reset code"}
          </button>
          <p className="text-sm text-gray-500 text-center">
            Back to{" "}
            <Link to="/login" className="text-blue-600 hover:underline">
              Login
            </Link>
          </p>
        </form>
      )}

      {step === "reset" && (
        <form onSubmit={handleReset} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-4">
          <p className="text-sm text-gray-600">
            Enter the code we sent to <strong>{email}</strong> and your new password.
          </p>
          {devOtp && (
            <div className="bg-gray-100 text-gray-700 p-3 rounded text-sm">
              Dev code: <strong>{devOtp}</strong>
            </div>
          )}
          <div>
            <label className="block text-gray-700 mb-2">Verification code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              className="w-full border border-gray-300 rounded px-4 py-2"
              placeholder="6-digit code"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-2">New password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              className="w-full border border-gray-300 rounded px-4 py-2"
              placeholder="At least 8 characters"
            />
          </div>
          {error && <div className="bg-red-100 text-red-700 p-4 rounded">{error}</div>}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isLoading ? "Resetting..." : "Reset password"}
          </button>
        </form>
      )}

      {step === "done" && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm text-center">
          <div className="text-4xl mb-3">✅</div>
          <p className="text-gray-700 mb-6">
            Password reset successfully. You can now login with your new password.
          </p>
          <Link
            to="/login"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded font-bold hover:bg-blue-700"
          >
            Go to Login
          </Link>
        </div>
      )}
    </div>
  );
};
