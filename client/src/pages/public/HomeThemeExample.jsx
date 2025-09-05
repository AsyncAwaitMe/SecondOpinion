import React from "react";

const HomeThemeExample = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900 transition-colors">
      <div className="max-w-2xl p-8 rounded-xl shadow-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Theme demo
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          This box changes styling based on the active theme. Use the toggle to
          switch.
        </p>
      </div>
    </div>
  );
};

export default HomeThemeExample;
