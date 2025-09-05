import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import HistoryService from "../../services/historyService";

const Dashboard = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState({
    total_predictions: 0,
    by_model_type: {},
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
      const transformedActivities = response.results.map((result) => {
        const timeAgo = getTimeAgo(new Date(result.created_at));
        return {
          id: result.id,
          name: result.patient.full_name,
          result: result.prediction,
          time: timeAgo,
          type: getAnalysisTypeFromModel(result.model_type),
          patientId: `PT-${String(result.patient.id).padStart(6, "0")}`,
        };
      });

      setRecentActivity(transformedActivities);
    } catch (error) {
      console.error("Failed to load recent activities:", error);
      setRecentActivity([]);
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

  const getAnalysisTypeFromModel = (modelType) => {
    switch (modelType) {
      case "tumor":
        return "brain";
      case "chest_xray":
        return "pneumonia";
      default:
        return "unknown";
    }
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) {
      return "Just now";
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} mins ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days} day${days > 1 ? "s" : ""} ago`;
    }
  };

  const quickActions = [
    {
      title: "New Scan",
      description: "Upload medical image",
      icon: "📤",
      color: "blue",
      action: () => navigate("/upload"),
    },
    {
      title: "View Results",
      description: "Check analysis history",
      icon: "📊",
      color: "green",
      action: () => navigate("/results"),
    },
    {
      title: "Select Model",
      description: "Choose AI model",
      icon: "🤖",
      color: "purple",
      action: () => navigate("/models"),
    },
  ];

  return (
    <div className="p-8 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome to Second Opinion
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Your AI-powered medical diagnosis assistant
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {quickActions.map((action, index) => (
          <div
            key={index}
            onClick={action.action}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 cursor-pointer hover:shadow-md transition-all duration-200 hover:-translate-y-1"
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className={`p-3 bg-${action.color}-100 dark:bg-${action.color}-900/30 rounded-lg`}
              >
                <span className="text-2xl">{action.icon}</span>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {action.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {action.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <span className="text-2xl">📊</span>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Total Scans
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {statistics.total_predictions || 0}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <span className="text-2xl">✅</span>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Brain Tumor Scans
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {statistics.by_model_type?.tumor || 0}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <span className="text-2xl">⏱️</span>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Chest X-ray Scans
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {statistics.by_model_type?.chest_xray || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Recent Activity
        </h2>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-300">
                Loading recent activities...
              </p>
            </div>
          ) : recentActivity.length > 0 ? (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                  onClick={() => navigate(`/results/details/${activity.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mr-3">
                        <span className="text-blue-600 dark:text-blue-400 font-semibold">
                          {activity.name[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {activity.patientId} - {activity.name}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                          {activity.type} detection
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          activity.result === "Normal"
                            ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                            : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                        }`}
                      >
                        {activity.result}
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <div className="text-4xl mb-4">📊</div>
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No Recent Activities
              </h4>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Start your first analysis to see activities here
              </p>
              <button
                onClick={() => navigate("/upload")}
                className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 dark:hover:bg-blue-600 transition"
              >
                Start Analysis
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
