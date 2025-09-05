import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const ModelSelection = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");

  const models = [
    {
      title: "Brain Tumor Detection",
      description: "AI-powered MRI analysis for brain tumor detection",
      route: "/detection/mri",
      icon: "🧠",
      color: "blue",
      stats: { accuracy: "92.5%", scans: "1,234" },
      available: true,
    },
    {
      title: "Breast Cancer Detection",
      description: "Advanced imaging for breast cancer screening",
      route: "/detection/breast",
      icon: "🩺",
      color: "pink",
      stats: { accuracy: "94.2%", scans: "2,156" },
      available: false,
    },
    {
      title: "Pneumonia Detection",
      description: "X-ray analysis for pneumonia detection",
      route: "/detection/pneumonia",
      icon: "🫁",
      color: "green",
      stats: { accuracy: "96.8%", scans: "3,421" },
      available: false,
    },
    {
      title: "Skin Cancer Detection",
      description: "Dermatological AI for skin lesion analysis",
      route: "/detection/skin",
      icon: "🔬",
      color: "purple",
      stats: { accuracy: "89.7%", scans: "856" },
      available: false,
    },
  ];

  const sidebarItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊", active: true },
    { id: "upload", label: "Upload", icon: "📤", active: false },
    { id: "results", label: "Results", icon: "📋", active: false },
    { id: "settings", label: "Settings", icon: "⚙️", active: false },
  ];

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
      title: "Settings",
      description: "Configure preferences",
      icon: "⚙️",
      color: "purple",
      action: () => navigate("/settings"),
    },
  ];

  const recentActivity = [
    {
      id: "PT-80710304",
      name: "Jack",
      result: "Normal",
      time: "2 mins ago",
      type: "brain tumor",
    },
    {
      id: "PT-80710305",
      name: "Sarah",
      result: "Glioma Detected",
      time: "5 mins ago",
      type: "brain tumor",
    },
    {
      id: "PT-80710306",
      name: "Mike",
      result: "Normal",
      time: "12 mins ago",
      type: "brain tumor",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Fixed Background Gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 -z-10" />

      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg border-r border-gray-200 z-50">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-blue-600">SecondOpinion</h1>
        </div>

        {/* Navigation */}
        <nav className="mt-8">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center px-6 py-3 text-left transition-all duration-200 ${
                activeTab === item.id
                  ? "bg-blue-50 text-blue-600 border-r-2 border-blue-600"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <span className="mr-3 text-lg">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* User Info */}
        <div className="absolute bottom-0 w-full p-6 border-t border-gray-200">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
              A
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">Admin</p>
              <p className="text-xs text-gray-500">Medical Center</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome to SecondOpinion
          </h1>
          <p className="text-gray-600">
            Your AI-powered medical diagnosis assistant
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <span className="text-2xl">📊</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Scans</p>
              <p className="text-3xl font-bold text-gray-900">7,667</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <span className="text-2xl">✅</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Accuracy Rate</p>
              <p className="text-3xl font-bold text-gray-900">93.3%</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <span className="text-2xl">⏱️</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Average Time</p>
              <p className="text-3xl font-bold text-gray-900">2.1s</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-left hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-center mb-3">
                  <div
                    className={`p-3 rounded-lg mr-4 ${
                      action.color === "blue"
                        ? "bg-blue-100"
                        : action.color === "green"
                        ? "bg-green-100"
                        : "bg-purple-100"
                    }`}
                  >
                    <span className="text-2xl">{action.icon}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {action.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {action.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* AI Models Grid */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Available AI Models
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {models.map((model, index) => (
              <div
                key={index}
                onClick={() => (model.available ? navigate(model.route) : null)}
                className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-all duration-200 group ${
                  model.available
                    ? "hover:shadow-md cursor-pointer"
                    : "opacity-60 cursor-not-allowed"
                }`}
              >
                {!model.available && (
                  <div className="absolute top-2 right-2 bg-gradient-to-r from-orange-400 to-orange-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                    Coming Soon
                  </div>
                )}
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`p-3 rounded-lg ${
                      model.color === "blue"
                        ? "bg-blue-100"
                        : model.color === "pink"
                        ? "bg-pink-100"
                        : model.color === "green"
                        ? "bg-green-100"
                        : "bg-purple-100"
                    }`}
                  >
                    <span className="text-2xl">{model.icon}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Accuracy</p>
                    <p
                      className={`text-lg font-semibold ${
                        model.available ? "text-gray-900" : "text-gray-500"
                      }`}
                    >
                      {model.available ? model.stats.accuracy : "TBD"}
                    </p>
                  </div>
                </div>
                <h3
                  className={`text-lg font-semibold mb-2 transition-colors ${
                    model.available
                      ? "text-gray-900 group-hover:text-blue-600"
                      : "text-gray-600"
                  }`}
                >
                  {model.title}
                </h3>
                <p className="text-gray-600 mb-4">
                  {model.available
                    ? model.description
                    : "To be implemented soon - Advanced AI analysis coming to this detection type"}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    {model.available
                      ? `${model.stats.scans} scans completed`
                      : "Implementation in progress"}
                  </span>
                  <span
                    className={`font-medium transition-transform ${
                      model.available
                        ? "text-blue-600 group-hover:translate-x-1"
                        : "text-gray-400"
                    }`}
                  >
                    {model.available ? "Try Now" : "Coming Soon"} →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Recent Activity
          </h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="divide-y divide-gray-200">
              {recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-blue-600 font-semibold">
                          {activity.name[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {activity.id} - {activity.name}
                        </p>
                        <p className="text-sm text-gray-600 capitalize">
                          {activity.type} detection
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          activity.result === "Normal"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {activity.result}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelSelection;
