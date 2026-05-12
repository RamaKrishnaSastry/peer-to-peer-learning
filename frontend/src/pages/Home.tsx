import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";

export const Home = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <h1 className="text-5xl font-bold mb-4">
              Learn Together, Grow Together
            </h1>
            <p className="text-xl mb-8">
              A community-driven peer learning platform for UPSC, JEE, and
              Finance
            </p>
            <div className="space-x-4">
              <a
                href="/signup"
                className="bg-white text-blue-600 px-8 py-3 rounded font-bold hover:bg-gray-100"
              >
                Get Started
              </a>
              <a
                href="/categories"
                className="border-2 border-white text-white px-8 py-3 rounded font-bold hover:bg-white hover:text-blue-600"
              >
                Browse
              </a>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-4">📚</div>
              <h2 className="text-2xl font-bold mb-2">Organized Content</h2>
              <p className="text-gray-600">
                Browse organized content by curriculum, not algorithm
              </p>
            </div>

            <div className="text-center">
              <div className="text-4xl mb-4">👥</div>
              <h2 className="text-2xl font-bold mb-2">Peer Feedback</h2>
              <p className="text-gray-600">
                Learn from verified peers and community discussion
              </p>
            </div>

            <div className="text-center">
              <div className="text-4xl mb-4">🎯</div>
              <h2 className="text-2xl font-bold mb-2">Daily Questions</h2>
              <p className="text-gray-600">
                Stay motivated with daily questions and streaks
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
