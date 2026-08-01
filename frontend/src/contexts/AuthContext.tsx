import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from "react";
import api from "../utils/api";
import { API_ENDPOINTS, STORAGE_KEYS } from "../utils/constants";

export interface User {
  id: string;
  email: string;
  username: string;
  bio?: string;
  avatarUrl?: string;
  domain?: string;
  stats?: {
    reputationScore: number;
    upvotesReceived: number;
    contentCount: number;
    answerCount: number;
    currentStreak: number;
    longestStreak: number;
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  requestOtp: (email: string) => Promise<string | undefined>;
  register: (
    email: string,
    code: string,
    password: string,
    username: string | undefined,
    domain: string,
  ) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  updateUser: (partial: Partial<User>) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
    const storedUser = localStorage.getItem(STORAGE_KEYS.USER);

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }

    setIsLoading(false);
  }, []);

  const storeSession = (newToken: string, newUser: User) => {
    localStorage.setItem(STORAGE_KEYS.TOKEN, newToken);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post(API_ENDPOINTS.AUTH.LOGIN, { email, password });
      const { token: newToken, user: newUser } = response.data.data;
      storeSession(newToken, newUser);
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const requestOtp = async (email: string): Promise<string | undefined> => {
    const response = await api.post(API_ENDPOINTS.AUTH.REQUEST_OTP, { email });
    return response.data.data?.devOtp;
  };

  const register = async (
    email: string,
    code: string,
    password: string,
    username: string | undefined,
    domain: string,
  ) => {
    try {
      const response = await api.post(API_ENDPOINTS.AUTH.VERIFY_OTP, {
        email,
        code,
        password,
        domain,
        ...(username ? { username } : {}),
      });
      const { token: newToken, user: newUser } = response.data.data;
      storeSession(newToken, newUser);
    } catch (error) {
      console.error("Registration failed:", error);
      throw error;
    }
  };

  const loginWithGoogle = async (idToken: string) => {
    try {
      const response = await api.post("/auth/google", { idToken });
      const { token: newToken, user: newUser } = response.data.data;
      storeSession(newToken, newUser);
    } catch (error) {
      console.error("Google login failed:", error);
      throw error;
    }
  };

  const updateUser = (partial: Partial<User>) => {
    setUser((prev) => {
      const next = prev ? { ...prev, ...partial } : prev;
      if (next) {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(next));
      }
      return next;
    });
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token,
        login,
        requestOtp,
        register,
        loginWithGoogle,
        updateUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
