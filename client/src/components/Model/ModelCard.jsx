import React from "react";
import { useNavigate } from "react-router-dom";

const ModelCard = ({
  title,
  description,
  route,
  icon,
  color = "blue",
  stats = {},
}) => {
  const navigate = useNavigate();

  const colorVariants = {
    blue: {
      gradient: "from-blue-500 to-indigo-600",
      shadow: "shadow-blue-500/25",
      button: "bg-blue-500 hover:bg-blue-700",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    pink: {
      gradient: "from-pink-500 to-rose-600",
      shadow: "shadow-pink-500/25",
      button: "bg-pink-500 hover:bg-pink-700",
      iconBg: "bg-pink-100",
      iconColor: "text-pink-600",
    },
    green: {
      gradient: "from-green-500 to-emerald-600",
      shadow: "shadow-green-500/25",
      button: "bg-green-500 hover:bg-green-700",
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
    },
    purple: {
      gradient: "from-purple-500 to-violet-600",
      shadow: "shadow-purple-500/25",
      button: "bg-purple-500 hover:bg-purple-700",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
    },
  };

  const currentColor = colorVariants[color];

  return (
    <div
      className={`group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl ${currentColor.shadow} transform hover:-translate-y-2 transition-all duration-300 overflow-hidden`}
    >
      {/* Gradient background overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${currentColor.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
      />

      {/* Main content */}
      <div className="relative p-8">
        {/* Icon */}
        <div
          className={`inline-flex items-center justify-center w-28 h-16 rounded-xl ${currentColor.iconBg} mb-6 group-hover:scale-110 transition-transform duration-300`}
        >
          <div className={`text-2xl ${currentColor.iconColor}`}>{icon}</div>
        </div>

        {/* Title */}
        <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-gray-800 transition-colors">
          {title}
        </h3>

        {/* Description */}
        <p className="text-gray-600 mb-6 leading-relaxed">{description}</p>

        {/* Stats */}
        {stats.accuracy && (
          <div className="flex items-center justify-between mb-6 p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">Accuracy</span>
            <span className="text-sm font-semibold text-gray-900">
              {stats.accuracy}
            </span>
          </div>
        )}

        {/* Action button */}
        <button
          onClick={() => navigate(route)}
          className={`w-full ${currentColor.button} text-white py-3 px-6 rounded-xl font-medium transition-all duration-300 transform group-hover:scale-105 active:scale-95 cursor-pointer`}
        >
          Select Model
        </button>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-white/20 to-transparent rounded-bl-2xl" />
      <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-white/10 to-transparent rounded-tr-2xl" />
    </div>
  );
};

export default ModelCard;
