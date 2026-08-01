import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { Home } from "./pages/Home";
import { LoginPage } from "./pages/Login";
import { SignupPage } from "./pages/Signup";
import { ForgotPasswordPage } from "./pages/ForgotPassword";
import { CategoriesPage } from "./pages/Categories";
import { CategoryPage } from "./pages/CategoryPage";
import { SearchPage } from "./pages/SearchPage";
import { DailyQuestionPage } from "./pages/DailyQuestion";
import { DiscussionsPage } from "./pages/Discussions";
import { DiscussionDetailPage } from "./pages/DiscussionDetail";
import { ContentPage } from "./pages/Content";
import { ContentDetailPage } from "./pages/ContentDetail";
import { ProfilePage } from "./pages/Profile";
import { SettingsPage } from "./pages/Settings";
import { UserProfilePage } from "./pages/UserProfile";

function App() {
  return (
    <AuthProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar />

        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/categories/:slug" element={<CategoryPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/daily" element={<DailyQuestionPage />} />
            <Route path="/discussions" element={<DiscussionsPage />} />
            <Route path="/discussions/:id" element={<DiscussionDetailPage />} />
            <Route path="/content" element={<ContentPage />} />
            <Route path="/content/:id" element={<ContentDetailPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/users/:username" element={<UserProfilePage />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </AuthProvider>
  );
}

export default App;
