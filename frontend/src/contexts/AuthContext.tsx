import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from "react";
import api from "../utils/api";
import { STORAGE_KEYS } from "../utils/constants";

export interface User {
  id: string;
  email: string;
  username: string;
  bio?: string;
  avatarUrl?: string;
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
  signup: (email: string, username: string, password: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
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
      const response = await api.post("/auth/login", { email, password });
      const { token: newToken, user: newUser } = response.data.data;
      storeSession(newToken, newUser);
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const signup = async (email: string, username: string, password: string) => {
    try {
      const response = await api.post("/auth/signup", {
        email,
        username,
        password,
      });
      const { token: newToken, user: newUser } = response.data.data;
      storeSession(newToken, newUser);
    } catch (error) {
      console.error("Signup failed:", error);
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
        signup,
        loginWithGoogle,
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
