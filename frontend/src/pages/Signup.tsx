import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { GoogleButton } from "../components/GoogleButton";
import { EmailOtpForm } from "../components/EmailOtpForm";
import { getErrorMessage } from "../utils/helpers";

export const SignupPage = () => {
  const [error, setError] = useState("");
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleGoogleSuccess = async (idToken: string) => {
    setError("");
    try {
      await loginWithGoogle(idToken);
      navigate("/");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Google sign-in failed"));
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8">
      <h1 className="text-3xl font-bold mb-6">Sign Up</h1>
      <p className="text-gray-600 mb-6">
        Create a password and verify your email to get started.
      </p>

      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded mb-4">{error}</div>
      )}

      <EmailOtpForm redirectTo="/" />

      <div className="my-6 flex items-center gap-3">
        <div className="flex-1 border-t border-gray-300"></div>
        <span className="text-gray-500 text-sm">or</span>
        <div className="flex-1 border-t border-gray-300"></div>
      </div>

      <GoogleButton onSuccess={handleGoogleSuccess} />

      <p className="mt-4 text-center text-gray-600">
        Already have an account?{" "}
        <Link to="/login" className="text-blue-600 hover:underline">
          Login
        </Link>
      </p>
    </div>
  );
};
