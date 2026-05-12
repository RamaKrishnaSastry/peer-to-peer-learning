export const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-8 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-bold mb-4">About</h3>
            <p className="text-gray-400">
              A community-driven peer learning platform for UPSC, JEE, and
              Finance.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4">Links</h3>
            <ul className="text-gray-400 space-y-2">
              <li>
                <a href="/" className="hover:text-white">
                  Home
                </a>
              </li>
              <li>
                <a href="/categories" className="hover:text-white">
                  Categories
                </a>
              </li>
              <li>
                <a href="/about" className="hover:text-white">
                  About
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4">Legal</h3>
            <ul className="text-gray-400 space-y-2">
              <li>
                <a href="/terms" className="hover:text-white">
                  Terms
                </a>
              </li>
              <li>
                <a href="/privacy" className="hover:text-white">
                  Privacy
                </a>
              </li>
              <li>
                <a href="/contact" className="hover:text-white">
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2024 Peer Learning. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
