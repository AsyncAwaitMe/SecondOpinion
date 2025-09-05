import React from "react";
import { useNavigate } from "react-router-dom";

const BreastCancer = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-600 rounded-full flex items-center justify-center">
                <span className="text-2xl">🩺</span>
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              Breast Cancer Detection
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Advanced AI-powered analysis for breast cancer screening
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Coming Soon Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
          <div className="mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">🚧</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Coming Soon
            </h2>
            <p className="text-lg text-gray-600 max-w-lg mx-auto mb-8">
              We're working hard to bring you advanced AI-powered breast cancer
              detection. This feature will be available soon with
              state-of-the-art analysis capabilities.
            </p>
          </div>

          {/* Features Preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="p-6 bg-pink-50 rounded-xl border border-pink-200">
              <h3 className="font-semibold text-pink-900 mb-2">
                Mammography Analysis
              </h3>
              <p className="text-pink-800 text-sm">
                Advanced AI analysis of mammographic images for early detection
              </p>
            </div>
            <div className="p-6 bg-rose-50 rounded-xl border border-rose-200">
              <h3 className="font-semibold text-rose-900 mb-2">
                High Accuracy
              </h3>
              <p className="text-rose-800 text-sm">
                State-of-the-art deep learning models for reliable results
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate("/detection/mri")}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Try Brain Tumor Detection Instead
            </button>
            <button
              onClick={() => navigate("/models")}
              className="border border-gray-300 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              Back to Models
            </button>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mt-12 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-6">
          <div className="flex items-center">
            <span className="text-orange-600 mr-4 text-2xl">⏳</span>
            <div>
              <h3 className="text-orange-900 font-bold text-lg mb-2">
                Development in Progress
              </h3>
              <p className="text-orange-800 text-sm">
                Our team is actively developing this feature. Stay tuned for
                updates on our breast cancer detection capabilities.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BreastCancer;
