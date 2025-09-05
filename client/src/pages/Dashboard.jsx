import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import LogoutConfirmation from "../components/common/LogoutConfirmation";
import HistoryService from "../services/historyService";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState({
    total_predictions: 0,
    by_model_type: {},
    by_status: {},
  });

  // Load recent activities when component mounts
  useEffect(() => {
    loadRecentActivities();
    loadStatistics();
  }, []);

  const loadRecentActivities = async () => {
    try {
      setLoading(true);
      const response = await HistoryService.getPredictionHistory(1, 5); // Get latest 5 items

      // Transform backend data to frontend format
      const transformedActivities = response.results.map((result) => ({
        id: result.id,
        patientName: result.patient.full_name,
        patientId: `PT-${String(result.patient.id).padStart(6, "0")}`,
        analysisType: getAnalysisTypeDisplay(result.model_type),
        result: result.prediction,
        confidence: Math.round(result.confidence * 100),
        date: new Date(result.created_at).toLocaleDateString(),
        time: new Date(result.created_at).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        status: result.status,
      }));

      setRecentActivities(transformedActivities);
    } catch (error) {
      console.error("Failed to load recent activities:", error);
      setRecentActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const stats = await HistoryService.getPredictionStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error("Failed to load statistics:", error);
    }
  };

  const getAnalysisTypeDisplay = (modelType) => {
    switch (modelType) {
      case "tumor":
        return "Brain Tumor Detection";
      case "chest_xray":
        return "Pneumonia Detection";
      default:
        return "Unknown Analysis";
    }
  };

  const getResultColor = (result) => {
    const resultLower = result.toLowerCase();
    if (resultLower.includes("normal")) {
      return "text-green-600 bg-green-100";
    } else if (
      resultLower.includes("glioma") ||
      resultLower.includes("meningioma") ||
      resultLower.includes("pituitary") ||
      resultLower.includes("pneumonia")
    ) {
      return "text-red-600 bg-red-100";
    } else if (resultLower.includes("detected")) {
      return "text-red-600 bg-red-100";
    } else {
      return "text-blue-600 bg-blue-100";
    }
  };

  const handleActivityClick = (activity) => {
    navigate(`/results/details/${activity.id}`);
  };

  const handleLogout = () => {
    setShowLogoutConfirmation(true);
  };

  const confirmLogout = () => {
    logout();
    // Use setTimeout to ensure logout state change is processed before navigation
    setTimeout(() => {
      navigate("/", { replace: true });
    }, 0);
  };

  const cancelLogout = () => {
    setShowLogoutConfirmation(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <svg
                width="32"
                height="32"
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
              <h1 className="text-2xl font-bold text-blue-600">
                Second Opinion
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user?.full_name}</span>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Welcome Section */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Welcome to Your Dashboard
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Choose an AI model to analyze medical images
            </p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">📊</span>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Analyses
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {statistics.total_predictions || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">🧠</span>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Brain Scans
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {statistics.by_model_type?.tumor || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">⏱️</span>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Recent Activity
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {recentActivities.length > 0 ? "Today" : "None"}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* AI Models Section */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                Available AI Models
              </h3>
              <div className="space-y-4">
                {/* Available Model Card */}
                <div className="bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-lg transition">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-medium text-gray-900">
                        Brain Tumor Detection
                      </h4>
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">
                        Available
                      </span>
                    </div>
                    <p className="text-gray-600 mb-4">
                      Analyze MRI scans for brain tumors including glioma,
                      meningioma, and pituitary tumors.
                    </p>
                    <button
                      onClick={() => navigate("/upload?model=brain")}
                      className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                    >
                      Start Analysis
                    </button>
                  </div>
                </div>

                {/* Coming Soon Model Cards */}
                <div className="bg-white overflow-hidden shadow rounded-lg opacity-60 cursor-not-allowed relative">
                  <div className="absolute top-4 right-4 bg-gradient-to-r from-orange-400 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-semibold z-10">
                    Coming Soon
                  </div>
                  <div className="p-6">
                    <h4 className="text-lg font-medium text-gray-600">
                      Pneumonia Detection
                    </h4>
                    <p className="mt-2 text-gray-500">
                      Analyze chest X-rays for signs of pneumonia.
                    </p>
                    <button
                      disabled
                      className="mt-4 w-full bg-gray-400 text-white px-4 py-2 rounded cursor-not-allowed"
                    >
                      Coming Soon
                    </button>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg opacity-60 cursor-not-allowed relative">
                  <div className="absolute top-4 right-4 bg-gradient-to-r from-orange-400 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-semibold z-10">
                    Coming Soon
                  </div>
                  <div className="p-6">
                    <h4 className="text-lg font-medium text-gray-600">
                      Skin Cancer Detection
                    </h4>
                    <p className="mt-2 text-gray-500">
                      Analyze dermoscopic images for potential skin cancer
                      lesions.
                    </p>
                    <button
                      disabled
                      className="mt-4 w-full bg-gray-400 text-white px-4 py-2 rounded cursor-not-allowed"
                    >
                      Coming Soon
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activities Section */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Recent Activities
                </h3>
                <button
                  onClick={() => navigate("/results")}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  View All
                </button>
              </div>

              <div className="bg-white shadow rounded-lg">
                {loading ? (
                  <div className="p-6 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-600 mt-2">Loading activities...</p>
                  </div>
                ) : recentActivities.length > 0 ? (
                  <ul className="divide-y divide-gray-200">
                    {recentActivities.map((activity) => (
                      <li
                        key={activity.id}
                        onClick={() => handleActivityClick(activity)}
                        className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0">
                                <span className="text-lg">🧠</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {activity.patientName}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {activity.analysisType}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getResultColor(
                                activity.result
                              )}`}
                            >
                              {activity.result}
                            </span>
                            <div className="text-right">
                              <p className="text-sm text-gray-900">
                                {activity.confidence}%
                              </p>
                              <p className="text-xs text-gray-500">
                                {activity.date}
                              </p>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-6 text-center">
                    <div className="text-4xl mb-4">📊</div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">
                      No Recent Activities
                    </h4>
                    <p className="text-gray-600 mb-4">
                      Start your first analysis to see activities here
                    </p>
                    <button
                      onClick={() => navigate("/upload")}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                    >
                      Start Analysis
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Logout Confirmation Modal */}
      <LogoutConfirmation
        isOpen={showLogoutConfirmation}
        onConfirm={confirmLogout}
        onCancel={cancelLogout}
      />
    </div>
  );
};

export default Dashboard;
