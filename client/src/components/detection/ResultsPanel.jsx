import React from "react";

const ResultsPanel = ({ results, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Analyzing Image...
          </h3>
          <p className="text-gray-600">
            Please wait while our AI model processes your brain scan.
          </p>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-4">🔬</div>
          <p>Upload an image to see analysis results</p>
        </div>
      </div>
    );
  }

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return "text-green-600 bg-green-50";
    if (confidence >= 0.6) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const getConfidenceIcon = (confidence) => {
    if (confidence >= 0.8) return "✅";
    if (confidence >= 0.6) return "⚠️";
    return "❌";
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        Analysis Results
      </h2>

      {/* Image Validation Information */}
      {(results.separator_prediction ||
        results.mri_probability !== undefined) && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center mb-3">
            <span className="text-green-600 mr-2">✅</span>
            <h3 className="text-lg font-semibold text-green-900">
              Image Validation
            </h3>
          </div>
          <div className="space-y-2 text-sm text-green-800">
            {results.separator_prediction && (
              <p>
                <span className="font-medium">Image Type:</span>{" "}
                {results.separator_prediction}
              </p>
            )}
            {results.mri_probability !== undefined && (
              <p>
                <span className="font-medium">MRI Probability:</span>{" "}
                {(results.mri_probability * 100).toFixed(1)}%
              </p>
            )}
            {results.separator_confidence !== undefined && (
              <p>
                <span className="font-medium">Validation Confidence:</span>{" "}
                {(results.separator_confidence * 100).toFixed(1)}%
              </p>
            )}
          </div>
        </div>
      )}

      {/* Main Prediction */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Prediction</h3>
          <span className="text-2xl">
            {getConfidenceIcon(results.confidence)}
          </span>
        </div>

        <div
          className={`p-4 rounded-lg ${getConfidenceColor(results.confidence)}`}
        >
          <div className="font-semibold text-lg mb-2">{results.prediction}</div>
          <div className="text-sm">
            Confidence: {(results.confidence * 100).toFixed(1)}%
          </div>
        </div>

        {results.message && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-sm">{results.message}</p>
          </div>
        )}
      </div>

      {/* Tumor Detection Probabilities */}
      {results.probabilities && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Tumor Detection Probabilities
          </h3>
          <div className="space-y-3">
            {Object.entries(results.probabilities)
              .sort(([, a], [, b]) => b - a)
              .map(([className, probability]) => (
                <div
                  key={className}
                  className="flex items-center justify-between"
                >
                  <span className="text-gray-700">{className}</span>
                  <div className="flex items-center space-x-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${probability * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-12">
                      {(probability * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Image Validation Probabilities */}
      {results.separator_probabilities && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Image Validation Probabilities
          </h3>
          <div className="space-y-3">
            {Object.entries(results.separator_probabilities)
              .sort(([, a], [, b]) => b - a)
              .map(([className, probability]) => (
                <div
                  key={className}
                  className="flex items-center justify-between"
                >
                  <span className="text-gray-700">{className}</span>
                  <div className="flex items-center space-x-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${probability * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-12">
                      {(probability * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Additional Info */}
      {results.entropy !== undefined && (
        <div className="text-sm text-gray-600">
          <p>Model Uncertainty: {results.entropy.toFixed(3)}</p>
        </div>
      )}

      {/* Warning */}
      <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-start">
          <span className="text-amber-600 mr-2">⚠️</span>
          <div>
            <p className="text-amber-800 text-sm font-medium mb-1">
              Medical Disclaimer
            </p>
            <p className="text-amber-700 text-sm">
              This AI analysis is for educational purposes only and should not
              replace professional medical diagnosis. Always consult with a
              qualified healthcare professional for medical decisions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsPanel;
