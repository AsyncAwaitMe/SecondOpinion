import React, { useState } from "react";
import ImageUpload from "../../components/detection/ImageUpload";
import ResultsPanel from "../../components/detection/ResultsPanel";
import TumorService from "../../services/tumorService";

const TumorPrediction = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileSelect = (file) => {
    setSelectedFile(file);
    setError(null);
    setResults(null);

    // Create image preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const clearFile = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setResults(null);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setError("Please select an image file first.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const predictionResults = await TumorService.predictTumor(selectedFile);

      // Check if the response contains a separator validation error
      if (
        predictionResults.error &&
        predictionResults.error.includes("Invalid image type")
      ) {
        const imageType =
          predictionResults.separator_prediction || "Non-medical";
        const mriProb = predictionResults.mri_probability || 0;
        setError(
          `Image Validation Failed: This appears to be a ${imageType} image (MRI probability: ${(
            mriProb * 100
          ).toFixed(
            1
          )}%). Please upload an MRI brain scan image for tumor analysis.`
        );
        setResults(null);
        return;
      }

      setResults(predictionResults);
    } catch (err) {
      // Handle API errors
      if (err.response && err.response.data) {
        const errorData = err.response.data;
        if (errorData.error && errorData.error.includes("Invalid image type")) {
          const imageType = errorData.separator_prediction || "Non-medical";
          const mriProb = errorData.mri_probability || 0;
          setError(
            `Image Validation Failed: This appears to be a ${imageType} image (MRI probability: ${(
              mriProb * 100
            ).toFixed(
              1
            )}%). Please upload an MRI brain scan image for tumor analysis.`
          );
        } else {
          setError(
            errorData.message ||
              errorData.error ||
              "Failed to analyze the image. Please try again."
          );
        }
      } else {
        setError(
          err.message || "Failed to analyze the image. Please try again."
        );
      }
      console.error("Prediction error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-2xl">🧠</span>
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              MRI Brain Tumor Detection
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Advanced AI-powered analysis for detecting brain tumors in MRI
              scans
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-8">
            <div
              className={`flex items-center ${
                selectedFile ? "text-green-600" : "text-blue-600"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                  selectedFile ? "bg-green-500" : "bg-blue-500"
                }`}
              >
                {selectedFile ? "✓" : "1"}
              </div>
              <span className="ml-3 font-medium">Upload Image</span>
            </div>
            <div
              className={`w-16 h-1 ${
                selectedFile ? "bg-green-500" : "bg-gray-300"
              }`}
            ></div>
            <div
              className={`flex items-center ${
                results
                  ? "text-green-600"
                  : selectedFile
                  ? "text-blue-600"
                  : "text-gray-400"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                  results
                    ? "bg-green-500"
                    : selectedFile
                    ? "bg-blue-500"
                    : "bg-gray-300"
                }`}
              >
                {results ? "✓" : "2"}
              </div>
              <span className="ml-3 font-medium">AI Analysis</span>
            </div>
            <div
              className={`w-16 h-1 ${results ? "bg-green-500" : "bg-gray-300"}`}
            ></div>
            <div
              className={`flex items-center ${
                results ? "text-blue-600" : "text-gray-400"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                  results ? "bg-blue-500" : "bg-gray-300"
                }`}
              >
                3
              </div>
              <span className="ml-3 font-medium">View Results</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Section - Model Info */}
          <div className="xl:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 h-fit">
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-white text-xl">🤖</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  AI Model Info
                </h2>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-200">
                  <h3 className="font-semibold text-orange-900 mb-2">
                    🔍 Image Validation
                  </h3>
                  <p className="text-orange-800 text-sm">
                    First validates if uploaded image is an MRI brain scan using
                    EfficientNet-B2
                  </p>
                </div>

                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-2">
                    🧠 Tumor Detection
                  </h3>
                  <p className="text-blue-800 text-sm">
                    Vision Transformer (ViT-B/16) for brain tumor classification
                  </p>
                </div>

                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                  <h3 className="font-semibold text-green-900 mb-2">
                    Detectable Conditions
                  </h3>
                  <ul className="text-green-800 text-sm space-y-1">
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      Glioma Tumor
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      Meningioma Tumor
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      Pituitary Tumor
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      Normal Brain
                    </li>
                  </ul>
                </div>

                <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
                  <h3 className="font-semibold text-amber-900 mb-2">
                    Analysis Process
                  </h3>
                  <div className="space-y-2 text-amber-800 text-sm">
                    <div className="flex items-center">
                      <span className="text-amber-600 mr-2">1️⃣</span>
                      Image validation (MRI check)
                    </div>
                    <div className="flex items-center">
                      <span className="text-amber-600 mr-2">2️⃣</span>
                      Tumor detection & classification
                    </div>
                    <div className="flex items-center">
                      <span className="text-amber-600 mr-2">📊</span>
                      Confidence scoring & results
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Center Section - Upload/Preview */}
          <div className="xl:col-span-1">
            <div className="space-y-6">
              {/* Upload Section or Image Preview */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                {!imagePreview ? (
                  // Upload Section
                  <>
                    <div className="text-center mb-6">
                      <h2 className="text-xl font-bold text-gray-900">
                        Upload MRI Brain Scan
                      </h2>
                      <p className="text-gray-600 text-sm mt-1">
                        Upload an MRI brain scan image - our AI will first
                        validate the image type
                      </p>
                      <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-blue-800 text-xs">
                          ⚡ Two-step process: Image validation → Tumor
                          detection
                        </p>
                      </div>
                    </div>
                    <ImageUpload
                      onFileSelect={handleFileSelect}
                      selectedFile={selectedFile}
                      clearFile={clearFile}
                      disabled={isLoading}
                    />
                  </>
                ) : (
                  // Image Preview Section
                  <>
                    <div className="text-center mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <h2 className="text-xl font-bold text-gray-900 flex-1">
                          Image Preview
                        </h2>
                        <button
                          onClick={clearFile}
                          disabled={isLoading}
                          className="text-red-600 hover:text-red-700 font-medium text-sm px-3 py-1 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                          ✕ Remove
                        </button>
                      </div>
                      <p className="text-gray-600 text-sm">
                        {selectedFile?.name} (
                        {(selectedFile?.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    </div>

                    <div className="text-center">
                      <div className="relative inline-block mb-6">
                        <img
                          src={imagePreview}
                          alt="Selected brain scan"
                          className="max-w-full max-h-64 mx-auto rounded-xl shadow-md border border-gray-200"
                        />
                        {isLoading && (
                          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-xl flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <button
                          onClick={handleAnalyze}
                          disabled={isLoading || !selectedFile}
                          className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200 ${
                            selectedFile && !isLoading
                              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                              : "bg-gray-300 text-gray-500 cursor-not-allowed"
                          }`}
                        >
                          {isLoading ? (
                            <span className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Analyzing...
                            </span>
                          ) : (
                            "🔬 Start AI Analysis"
                          )}
                        </button>

                        {!isLoading && (
                          <button
                            onClick={clearFile}
                            className="w-full py-2 px-6 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                          >
                            📤 Upload Different Image
                          </button>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl p-4">
                  <div className="flex items-start">
                    <span className="text-red-600 mr-3 text-xl">⚠️</span>
                    <div>
                      <p className="text-red-800 font-semibold">
                        Analysis Error
                      </p>
                      <p className="text-red-700 text-sm mt-1">{error}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Section - Results */}
          <div className="xl:col-span-1">
            <div className="sticky top-6">
              <ResultsPanel results={results} isLoading={isLoading} />
            </div>
          </div>
        </div>

        {/* Medical Disclaimer */}
        <div className="mt-12 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6">
          <div className="flex items-start">
            <span className="text-amber-600 mr-4 text-2xl">⚕️</span>
            <div>
              <h3 className="text-amber-900 font-bold text-lg mb-2">
                Important Medical Disclaimer
              </h3>
              <p className="text-amber-800 text-sm leading-relaxed">
                This AI tool is designed for educational and research purposes
                only. The results should never be used as a substitute for
                professional medical diagnosis, treatment, or advice. Always
                consult with qualified healthcare professionals for any medical
                concerns or decisions regarding brain health.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TumorPrediction;
