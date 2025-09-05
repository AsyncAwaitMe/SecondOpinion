import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";

const Home = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();

  // Reset scroll to top when component mounts to fix navigation issue
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="snap-y snap-mandatory overflow-y-scroll h-screen overscroll-none">
      {/* Hero Section - Account for header height */}
      <section
        className="h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4 snap-start relative"
        style={{ height: "calc(100vh - 80px)" }}
      >
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            AI-Powered{" "}
            <span className="text-blue-600 dark:text-blue-400">Brain Scan</span>{" "}
            Insights
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Upload MRI scans and get fast, AI-assisted analysis for brain tumor
            detection. Supporting healthcare professionals with cutting-edge
            technology.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate("/signup")}
              className="px-8 py-4 bg-blue-600 dark:bg-blue-500 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition shadow-lg hover:shadow-xl"
            >
              Get Started Free
            </button>
            <button
              onClick={() =>
                document
                  .getElementById("about")
                  .scrollIntoView({ behavior: "smooth" })
              }
              className="px-8 py-4 border-2 border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 text-lg font-semibold rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition"
            >
              Learn More
            </button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <svg
            className="w-6 h-6 text-blue-600 dark:text-blue-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </div>
      </section>

      {/* About Section */}
      <section
        id="about"
        className="bg-white dark:bg-gray-900 flex items-center justify-center px-4 snap-start relative"
        style={{ height: "calc(100vh - 80px)" }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Advancing Medical Diagnosis with AI
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
                  Who We Are
                </h3>
                <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                  We're a team of medical professionals and AI researchers
                  dedicated to making advanced diagnostic tools accessible to
                  healthcare providers worldwide.
                </p>
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
                  Our Mission
                </h3>
                <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                  To support early detection of brain tumors through innovative
                  AI technology, helping doctors provide better patient care
                  with faster, more accurate insights.
                </p>
              </div>
            </div>
            <div className="bg-blue-50 dark:bg-gray-800 p-12 rounded-2xl text-center">
              <div className="w-40 h-40 bg-blue-200 dark:bg-blue-900 rounded-full mx-auto mb-6 flex items-center justify-center">
                <span className="text-6xl">🧠</span>
              </div>
              <p className="text-blue-800 dark:text-blue-300 font-medium text-lg">
                Advanced AI models trained on thousands of MRI scans
              </p>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <svg
            className="w-6 h-6 text-blue-600 dark:text-blue-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </div>
      </section>

      {/* How It Works Section */}
      <section
        id="how-it-works"
        className="bg-gray-50 dark:bg-gray-800 flex items-center justify-center px-4 snap-start relative"
        style={{ height: "calc(100vh - 80px)" }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Simple, secure, and fast - get AI insights in three easy steps
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center bg-white dark:bg-gray-700 p-10 rounded-2xl shadow-lg hover:shadow-xl dark:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-full mx-auto mb-8 flex items-center justify-center">
                <span className="text-3xl">📤</span>
              </div>
              <div className="w-8 h-8 bg-blue-600 dark:bg-blue-500 text-white rounded-full mx-auto mb-4 flex items-center justify-center font-bold">
                1
              </div>
              <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
                Upload Scan
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Securely upload your MRI brain scan files. We support DICOM and
                common image formats.
              </p>
            </div>
            <div className="text-center bg-white dark:bg-gray-700 p-10 rounded-2xl shadow-lg hover:shadow-xl dark:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full mx-auto mb-8 flex items-center justify-center">
                <span className="text-3xl">🤖</span>
              </div>
              <div className="w-8 h-8 bg-green-600 dark:bg-green-500 text-white rounded-full mx-auto mb-4 flex items-center justify-center font-bold">
                2
              </div>
              <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
                AI Analyzes
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Our trained neural network analyzes the scan for potential tumor
                indicators and patterns.
              </p>
            </div>
            <div className="text-center bg-white dark:bg-gray-700 p-10 rounded-2xl shadow-lg hover:shadow-xl dark:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900 rounded-full mx-auto mb-8 flex items-center justify-center">
                <span className="text-3xl">📊</span>
              </div>
              <div className="w-8 h-8 bg-purple-600 dark:bg-purple-500 text-white rounded-full mx-auto mb-4 flex items-center justify-center font-bold">
                3
              </div>
              <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
                Get Results
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Receive detailed analysis results with confidence scores and
                highlighted areas of interest.
              </p>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <svg
            className="w-6 h-6 text-gray-600 dark:text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </div>
      </section>

      {/* Trust/Disclaimer Section */}
      <section
        className="bg-white dark:bg-gray-900 flex items-center justify-center px-4 snap-start relative"
        style={{ height: "calc(100vh - 80px)" }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-yellow-50 dark:bg-yellow-900/30 border-2 border-yellow-200 dark:border-yellow-700 rounded-2xl p-12">
            <div className="mb-8">
              <span className="text-6xl mb-4 block">⚠️</span>
              <h3 className="text-3xl font-bold text-yellow-800 dark:text-yellow-300 mb-6">
                Important Medical Disclaimer
              </h3>
            </div>
            <div className="text-yellow-700 dark:text-yellow-200 space-y-6 text-lg leading-relaxed">
              <p>
                <strong>This is a research and educational tool.</strong>{" "}
                Results are not intended to replace professional medical
                diagnosis or treatment.
              </p>
              <p>
                Always consult with qualified healthcare professionals for
                medical decisions. Our AI provides supplementary insights to
                support medical professionals.
              </p>
              <p>
                <strong>Privacy & Security:</strong> All uploaded data is
                encrypted and processed securely. We follow healthcare data
                protection standards.
              </p>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <svg
            className="w-6 h-6 text-yellow-600 dark:text-yellow-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </div>
      </section>

      {/* CTA Section */}
      <section
        className="bg-gradient-to-br from-blue-600 to-blue-800 dark:from-blue-700 dark:to-blue-900 flex items-center justify-center px-4 snap-start relative"
        style={{ height: "calc(100vh - 80px)" }}
      >
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl md:text-2xl text-blue-100 dark:text-blue-200 mb-12 max-w-2xl mx-auto leading-relaxed">
            Join healthcare professionals already using Second Opinion for
            AI-assisted diagnosis.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button
              onClick={() => navigate("/signup")}
              className="px-10 py-4 bg-white text-blue-600 dark:bg-gray-100 dark:text-blue-700 text-lg font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-200 transition shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Create Free Account
            </button>
            <button
              onClick={() => navigate("/signin")}
              className="px-10 py-4 border-2 border-white text-white text-lg font-semibold rounded-lg hover:bg-white hover:text-blue-600 dark:hover:bg-gray-100 dark:hover:text-blue-700 transition"
            >
              Sign In
            </button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </div>
      </section>

      {/* Footer Section - NO SCROLL INDICATOR */}
      <footer
        className="bg-gray-900 dark:bg-black text-white flex items-center justify-center px-4 snap-start"
        style={{ height: "calc(100vh - 80px)" }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex justify-center mb-4">
              <svg
                width="64"
                height="64"
                viewBox="0 0 200 200"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="100" cy="100" r="90" fill="#f0f4f8" />
                <text
                  x="50%"
                  y="50%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontFamily="Arial, sans-serif"
                  fontSize="80"
                  fontWeight="bold"
                  fill="#0070c0"
                >
                  S
                </text>
                <text
                  x="50%"
                  y="50%"
                  dy="30"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontFamily="Arial, sans-serif"
                  fontSize="80"
                  fontWeight="bold"
                  fill="#c00000"
                >
                  O
                </text>
                <path
                  d="M50 140 C80 160, 120 160, 150 140"
                  stroke="#0070c0"
                  strokeWidth="4"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <h3 className="text-3xl font-bold text-blue-400 dark:text-blue-300 mb-4">
              Second Opinion
            </h3>
            <p className="text-xl text-gray-400 dark:text-gray-300 max-w-2xl mx-auto">
              AI-powered medical imaging analysis for healthcare professionals.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="text-center">
              <h4 className="text-lg font-semibold mb-6 text-blue-400 dark:text-blue-300">
                Product
              </h4>
              <ul className="space-y-3 text-gray-400 dark:text-gray-300">
                <li>
                  <a
                    href="#"
                    className="hover:text-white dark:hover:text-gray-100 transition text-lg"
                  >
                    How It Works
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-white dark:hover:text-gray-100 transition text-lg"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-white dark:hover:text-gray-100 transition text-lg"
                  >
                    Pricing
                  </a>
                </li>
              </ul>
            </div>
            <div className="text-center">
              <h4 className="text-lg font-semibold mb-6 text-blue-400 dark:text-blue-300">
                Company
              </h4>
              <ul className="space-y-3 text-gray-400 dark:text-gray-300">
                <li>
                  <a
                    href="#"
                    className="hover:text-white dark:hover:text-gray-100 transition text-lg"
                  >
                    About
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-white dark:hover:text-gray-100 transition text-lg"
                  >
                    Team
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-white dark:hover:text-gray-100 transition text-lg"
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div className="text-center">
              <h4 className="text-lg font-semibold mb-6 text-blue-400 dark:text-blue-300">
                Legal
              </h4>
              <ul className="space-y-3 text-gray-400 dark:text-gray-300">
                <li>
                  <a
                    href="#"
                    className="hover:text-white dark:hover:text-gray-100 transition text-lg"
                  >
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-white dark:hover:text-gray-100 transition text-lg"
                  >
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-white dark:hover:text-gray-100 transition text-lg"
                  >
                    HIPAA Compliance
                  </a>
                </li>
              </ul>
            </div>
            <div className="text-center">
              <h4 className="text-lg font-semibold mb-6 text-blue-400 dark:text-blue-300">
                Connect
              </h4>
              <ul className="space-y-3 text-gray-400 dark:text-gray-300">
                <li>
                  <a
                    href="#"
                    className="hover:text-white dark:hover:text-gray-100 transition text-lg"
                  >
                    GitHub
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-white dark:hover:text-gray-100 transition text-lg"
                  >
                    LinkedIn
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-white dark:hover:text-gray-100 transition text-lg"
                  >
                    Twitter
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 dark:border-gray-600 pt-8 text-center">
            <p className="text-gray-400 dark:text-gray-300 text-lg">
              &copy; 2025 Second Opinion. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
