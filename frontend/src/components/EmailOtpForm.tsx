import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getErrorMessage } from "../utils/helpers";

const RESEND_COOLDOWN_SECONDS = 60;

interface EmailOtpFormProps {
  redirectTo?: string;
}

export const EmailOtpForm = ({ redirectTo = "/" }: EmailOtpFormProps) => {
  const { requestOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [devOtp, setDevOtp] = useState<string | undefined>(undefined);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setInterval(() => setResendIn((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [resendIn]);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const hint = await requestOtp(email);
      setDevOtp(hint);
      setStep("otp");
      setResendIn(RESEND_COOLDOWN_SECONDS);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to send verification code"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      const hint = await requestOtp(email);
      setDevOtp(hint);
      setResendIn(RESEND_COOLDOWN_SECONDS);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to resend code"));
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await verifyOtp(email, code);
      navigate(redirectTo);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Verification failed"));
    } finally {
      setIsLoading(false);
    }
  };

  if (step === "email") {
    return (
      <form onSubmit={handleRequest} className="space-y-4">
        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded">{error}</div>
        )}

        <div>
          <label className="block text-gray-700 mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border border-gray-300 rounded px-4 py-2"
            placeholder="your@email.com"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isLoading ? "Sending code..." : "Send verification code"}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleVerify} className="space-y-4">
      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded">{error}</div>
      )}

      <p className="text-gray-600 text-sm">
        We emailed a 6-digit code to <span className="font-semibold">{email}</span>.
      </p>

      {devOtp && (
        <div className="bg-green-100 text-green-800 p-3 rounded text-sm">
          Dev mode: your code is <span className="font-bold tracking-widest">{devOtp}</span>
        </div>
      )}

      <div>
        <label className="block text-gray-700 mb-2">Verification code</label>
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          required
          className="w-full border border-gray-300 rounded px-4 py-2 tracking-widest text-center text-xl"
          placeholder="••••••"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading || code.length !== 6}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
      >
        {isLoading ? "Verifying..." : "Verify & continue"}
      </button>

      <button
        type="button"
        onClick={handleResend}
        disabled={resendIn > 0}
        className="w-full text-blue-600 text-sm py-1 hover:underline disabled:text-gray-400 disabled:no-underline"
      >
        {resendIn > 0 ? `Resend code in ${resendIn}s` : "Resend code"}
      </button>
    </form>
  );
};
