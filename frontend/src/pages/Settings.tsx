import { Link } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";
import { API_ENDPOINTS } from "../utils/constants";
import { useAuth } from "../contexts/AuthContext";
import { ChangeUsernameForm } from "../components/ChangeUsernameForm";
import { Loading } from "../components/Loading";

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
          </div>
        ) : (
          <p className="text-center text-gray-600 py-10">Account not found.</p>
        )}
      </Loading>
    </div>
  );
};
