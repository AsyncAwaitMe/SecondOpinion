import React from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";

const ModelSelection = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  const models = [
    {
      title: "Brain Tumor Detection",
      description: "AI-powered MRI analysis for brain tumor detection",
      route: "/detection/mri",
      icon: "🧠",
      color: "blue",
      stats: { accuracy: "92.5%", scans: "1,234" },
      available: true,
      modelType: "brain",
    },
    {
      title: "Breast Cancer Detection",
      description: "Advanced imaging for breast cancer screening",
      route: "/detection/breast",
      icon: "🩺",
      color: "pink",
      stats: { accuracy: "94.2%", scans: "2,156" },
      available: false,
      modelType: "breast",
    },
    {
      title: "Pneumonia Detection",
      description: "X-ray analysis for pneumonia detection",
      route: "/detection/pneumonia",
      icon: "🫁",
      color: "green",
      stats: { accuracy: "96.8%", scans: "3,421" },
      available: false,
      modelType: "pneumonia",
    },
    {
      title: "Skin Cancer Detection",
      description: "Dermatological AI for skin lesion analysis",
      route: "/detection/skin",
      icon: "🔬",
      color: "purple",
      stats: { accuracy: "89.7%", scans: "856" },
      available: false,
      modelType: "skin",
    },
  ];

  return (
    <div className="p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Choose Your AI Model
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Select the appropriate AI model for your medical diagnosis
        </p>
      </div>

      {/* Clean 2x2 Model Grid with better spacing */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {models.map((model, index) => (
          <div
            key={index}
            onClick={() =>
              model.available
                ? navigate(`/upload?model=${model.modelType}`)
                : null
            }
            className={`group relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 transition-all duration-300 ${
              model.available
                ? "hover:shadow-2xl cursor-pointer transform hover:-translate-y-2"
                : "opacity-60 cursor-not-allowed"
            }`}
          >
            {/* Coming Soon Badge */}
            {!model.available && (
              <div className="absolute top-4 right-4 bg-gradient-to-r from-orange-400 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-semibold z-20">
                Coming Soon
              </div>
            )}

            {/* Gradient overlay */}
            <div
              className={`absolute inset-0 rounded-2xl transition-opacity duration-300 ${
                model.available
                  ? "opacity-0 group-hover:opacity-10"
                  : "opacity-0"
              } ${
                model.color === "blue"
                  ? "bg-gradient-to-br from-blue-500 to-blue-600"
                  : model.color === "pink"
                  ? "bg-gradient-to-br from-pink-500 to-pink-600"
                  : model.color === "green"
                  ? "bg-gradient-to-br from-green-500 to-green-600"
                  : "bg-gradient-to-br from-purple-500 to-purple-600"
              }`}
            />

            <div className="relative z-10">
              {/* Icon and Stats */}
              <div className="flex items-start justify-between mb-6">
                <div
                  className={`p-4 rounded-xl ${
                    model.color === "blue"
                      ? "bg-blue-100"
                      : model.color === "pink"
                      ? "bg-pink-100"
                      : model.color === "green"
                      ? "bg-green-100"
                      : "bg-purple-100"
                  }`}
                >
                  <span className="text-3xl">{model.icon}</span>
                </div>
                <div className="text-right">
                  <div
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      model.available
                        ? model.color === "blue"
                          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400"
                          : model.color === "pink"
                          ? "bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-400"
                          : model.color === "green"
                          ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400"
                          : "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {model.available ? model.stats.accuracy : "TBD"}
                  </div>
                </div>
              </div>

              {/* Title and Description */}
              <h3
                className={`text-xl font-bold mb-3 transition-colors ${
                  model.available
                    ? "text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400"
                    : "text-gray-600 dark:text-gray-400"
                }`}
              >
                {model.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                {model.available
                  ? model.description
                  : "To be implemented soon - Advanced AI analysis coming to this detection type"}
              </p>

              {/* Stats and CTA */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-500">
                  {model.available
                    ? `${model.stats.scans} scans completed`
                    : "Implementation in progress"}
                </span>
                <div
                  className={`flex items-center font-semibold transition-transform ${
                    model.available
                      ? "text-blue-600 dark:text-blue-400 group-hover:translate-x-2"
                      : "text-gray-400 dark:text-gray-500"
                  }`}
                >
                  <span className="mr-2">
                    {model.available ? "Start Analysis" : "Coming Soon"}
                  </span>
                  <span className="text-lg">→</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Additional Info Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          How It Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📤</span>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Upload Image
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Select and upload your medical image for analysis
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🤖</span>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              AI Analysis
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Our AI model analyzes your image with high accuracy
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Get Results
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Receive detailed analysis results and recommendations
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelSelection;
