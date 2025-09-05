import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import HistoryService from "../../services/historyService";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { formatNepaliTime, formatNepaliDate } from "../../utils/formatters";
import { downloadMedicalReport } from "../../utils/pdfGenerator";

const ResultDetails = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { resultId, id } = useParams(); // Support both parameter names
  const currentResultId = resultId || id;
  const [selectedResult, setSelectedResult] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);

  // Mock data - in real app, this would come from API
  const mockResults = [
    {
      id: "PT-80710304",
      patientName: "Jack",
      patientId: "PT-80710304",
      age: 61,
      dob: "1964-03-15",
      gender: "Male",
      contact: "9800100000",
      analysisType: "Brain Tumor Detection",
      result: "Normal Brain",
      confidence: 94,
      processingTime: "2.8s",
      imageQuality: "High",
      completedAt: "2025-04-17 14:40:34",
      uploadedAt: "2025-04-17 14:40:30",
      modelUsed: "BrainTumor ViT v3.2",
      imageFile: "brain_mri_004.dcm",
      imageSize: "1.1 MB",
      findings: [
        "No tumor detected",
        "Normal brain tissue structure",
        "Clear ventricles",
        "No mass effect observed",
      ],
      recommendations: [
        "Continue routine monitoring",
        "No immediate intervention needed",
        "Annual follow-up recommended",
      ],
      technicalDetails: {
        resolution: "256x256x180",
        colorSpace: "Grayscale",
        compression: "DICOM",
        metadata: "Full DICOM headers",
      },
    },
    {
      id: "PT-80710305",
      patientName: "Sarah",
      patientId: "PT-80710305",
      age: 45,
      dob: "1980-08-22",
      gender: "Female",
      contact: "9800100001",
      analysisType: "Brain Tumor Detection",
      result: "Glioma Tumor",
      confidence: 89,
      processingTime: "3.2s",
      imageQuality: "High",
      completedAt: "2025-04-17 14:32:10",
      uploadedAt: "2025-04-17 14:32:05",
      modelUsed: "BrainTumor ViT v3.2",
      imageFile: "brain_mri_005.dcm",
      imageSize: "1.3 MB",
      findings: [
        "Glioma tumor detected in left frontal lobe",
        "Irregular enhancement pattern",
        "Mild mass effect",
        "Surrounding edema present",
      ],
      recommendations: [
        "Immediate neurology consultation recommended",
        "Additional MRI sequences may be required",
        "Multidisciplinary team review suggested",
      ],
      technicalDetails: {
        resolution: "256x256x180",
        colorSpace: "Grayscale",
        compression: "DICOM",
        metadata: "Full DICOM headers",
      },
    },
    {
      id: "PT-80710306",
      patientName: "Mike",
      patientId: "PT-80710306",
      age: 52,
      dob: "1973-11-05",
      gender: "Male",
      contact: "9800100002",
      analysisType: "Brain Tumor Detection",
      result: "Meningioma Tumor",
      confidence: 92,
      processingTime: "3.1s",
      imageQuality: "High",
      completedAt: "2025-04-17 12:20:15",
      uploadedAt: "2025-04-17 12:20:10",
      modelUsed: "BrainTumor ViT v3.2",
      imageFile: "brain_mri_006.dcm",
      imageSize: "1.2 MB",
      findings: [
        "Meningioma tumor detected",
        "Extra-axial location confirmed",
        "Dural tail sign present",
        "Well-circumscribed borders",
      ],
      recommendations: [
        "Neurosurgical consultation recommended",
        "Consider surgical planning",
        "Monitor growth with serial imaging",
      ],
      technicalDetails: {
        resolution: "256x256x180",
        colorSpace: "Grayscale",
        compression: "DICOM",
        metadata: "Full DICOM headers",
      },
    },
  ];

  useEffect(() => {
    const loadResultData = async () => {
      // If resultId is provided, fetch from backend
      if (currentResultId) {
        try {
          // Fetch from backend API
          const backendResult = await HistoryService.getPredictionResult(
            currentResultId
          );

          // Transform backend data to frontend format
          const transformedResult = {
            id: backendResult.id,
            patientName: backendResult.patient.full_name,
            patientId: `PT-${String(backendResult.patient.id).padStart(
              6,
              "0"
            )}`,
            age: backendResult.patient.date_of_birth
              ? new Date().getFullYear() -
                new Date(backendResult.patient.date_of_birth).getFullYear()
              : "N/A",
            dob: backendResult.patient.date_of_birth
              ? formatNepaliDate(backendResult.patient.date_of_birth)
              : "Not provided",
            gender: backendResult.patient.gender || "Not specified",
            contact: backendResult.patient.phone || "N/A",
            analysisType: getAnalysisTypeDisplay(backendResult.model_type),
            result: backendResult.prediction,
            confidence: Math.round(backendResult.confidence * 100),
            processingTime: "Real-time",
            imageQuality: "High",
            completedAt: formatNepaliTime(backendResult.created_at),
            uploadedAt: formatNepaliTime(backendResult.created_at),
            modelUsed:
              backendResult.model_type === "tumor"
                ? "BrainTumor ViT v3.2"
                : "ChestXray ViT v2.1",
            imageFile: backendResult.image_filename || "medical_image.dcm",
            imageSize: "1.2 MB", // Default size since backend doesn't store this
            notes: backendResult.notes,
            findings: generateFindings(backendResult),
            recommendations: generateRecommendations(backendResult),
            technicalDetails: {
              resolution: "256x256x180",
              colorSpace: "Grayscale",
              compression: "DICOM",
              metadata: "Full DICOM headers",
              entropy: backendResult.entropy?.toFixed(3) || "N/A",
              probabilities: backendResult.probabilities || {},
            },
            probabilities: backendResult.probabilities || {},
            entropy: backendResult.entropy,
            status: backendResult.status,
            patient: backendResult.patient, // Keep the original patient data for PDF generation
            created_at: backendResult.created_at, // Keep for PDF generation
          };

          setSelectedResult(transformedResult);
          return;
        } catch (apiError) {
          console.error("Failed to fetch result from backend:", apiError);
          // Fall back to mock data if backend fails
          const result = mockResults.find((r) => r.id === currentResultId);
          if (result) {
            setSelectedResult(result);
            return;
          }
        }
      }

      // Default to first mock result if no ID provided or all else fails
      setSelectedResult(mockResults[0]);
    };

    loadResultData();
  }, [currentResultId]);

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

  const generateFindings = (result) => {
    const findings = [];
    if (result.prediction === "Normal Brain") {
      findings.push("No tumor detected");
      findings.push("Normal brain tissue structure");
      findings.push("Clear ventricles");
      findings.push("No mass effect observed");
    } else if (result.prediction.includes("Glioma")) {
      findings.push(`${result.prediction} detected`);
      findings.push("Irregular enhancement pattern");
      findings.push("Possible mass effect");
      findings.push("Requires further evaluation");
    } else if (result.prediction.includes("Meningioma")) {
      findings.push(`${result.prediction} detected`);
      findings.push("Extra-axial location likely");
      findings.push("Well-circumscribed appearance");
      findings.push("Requires surgical consultation");
    } else if (result.prediction.includes("Pituitary")) {
      findings.push(`${result.prediction} detected`);
      findings.push("Sellar/suprasellar region");
      findings.push("Endocrine evaluation needed");
      findings.push("MRI with gadolinium recommended");
    } else {
      findings.push(`Detection result: ${result.prediction}`);
      findings.push(
        `Confidence level: ${(result.confidence * 100).toFixed(1)}%`
      );
      if (result.message) {
        findings.push(result.message);
      }
    }
    return findings;
  };

  const generateRecommendations = (result) => {
    const recommendations = [];
    if (result.prediction === "Normal Brain") {
      recommendations.push("Continue routine monitoring");
      recommendations.push("No immediate intervention needed");
      recommendations.push("Annual follow-up recommended");
    } else if (
      result.prediction.includes("Tumor") ||
      result.prediction.includes("tumor")
    ) {
      recommendations.push("Immediate medical consultation recommended");
      recommendations.push("Additional imaging studies may be required");
      recommendations.push("Multidisciplinary team review suggested");
      recommendations.push("Consider specialist referral");
    } else if (
      result.prediction === "Low Confidence" ||
      result.prediction === "Uncertain/Unrelated"
    ) {
      recommendations.push("Image quality assessment needed");
      recommendations.push("Consider retaking the scan");
      recommendations.push("Manual review by radiologist recommended");
      recommendations.push("Ensure proper image format and quality");
    } else {
      recommendations.push("Follow up with healthcare provider");
      recommendations.push("Consider additional diagnostic tests");
      recommendations.push("Monitor symptoms if any");
    }
    return recommendations;
  };

  const getResultColor = (result) => {
    const resultLower = result.toLowerCase();
    if (resultLower.includes("normal")) {
      return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300";
    } else if (
      resultLower.includes("glioma") ||
      resultLower.includes("meningioma") ||
      resultLower.includes("pituitary")
    ) {
      return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300";
    } else if (resultLower.includes("detected")) {
      return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300";
    } else if (resultLower.includes("suspicious")) {
      return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300";
    } else {
      return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300";
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 90) return "text-green-600 dark:text-green-400";
    if (confidence >= 75) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const handleBackToResults = () => {
    navigate("/results");
  };

  const handleDownloadReport = async () => {
    try {
      await downloadMedicalReport(
        selectedResult,
        `medical_report_${selectedResult.patientId}_${formatNepaliTime(
          new Date(),
          {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: undefined,
            minute: undefined,
            timeZoneName: undefined,
          }
        ).replace(/\//g, "-")}.pdf`
      );
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  if (!selectedResult) {
    return (
      <div className="p-6 dark:bg-gray-900 min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600 dark:text-gray-300">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Analysis Results
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Completed at {selectedResult.completedAt}
          </p>
        </div>
        <button
          onClick={handleBackToResults}
          className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
        >
          ← Back to All Results
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Patient & Image Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Patient Information */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <span className="mr-2">👤</span>
              Patient Information
            </h2>

            <div className="space-y-4">
              <div className="flex items-center">
                <span className="w-3 h-3 bg-blue-500 rounded-full mr-3"></span>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Patient Name
                  </p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {selectedResult.patientName}
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                <span className="w-3 h-3 bg-green-500 rounded-full mr-3"></span>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Patient ID
                  </p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {selectedResult.patientId}
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                <span className="w-3 h-3 bg-purple-500 rounded-full mr-3"></span>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Age
                  </p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {selectedResult.age} years
                  </p>
                </div>
              </div>

              {selectedResult.dob && (
                <div className="flex items-center">
                  <span className="w-3 h-3 bg-indigo-500 rounded-full mr-3"></span>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Date of Birth
                    </p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {selectedResult.dob}
                    </p>
                  </div>
                </div>
              )}

              {selectedResult.gender && (
                <div className="flex items-center">
                  <span className="w-3 h-3 bg-pink-500 rounded-full mr-3"></span>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Gender
                    </p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {selectedResult.gender}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center">
                <span className="w-3 h-3 bg-orange-500 rounded-full mr-3"></span>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Contact
                  </p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {selectedResult.contact || "N/A"}
                  </p>
                </div>
              </div>

              {selectedResult.notes && (
                <div className="flex items-start">
                  <span className="w-3 h-3 bg-gray-500 rounded-full mr-3 mt-2"></span>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Notes
                    </p>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">
                      {selectedResult.notes}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Image Information */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <span className="mr-2">🖼️</span>
              Image Details
            </h2>

            {/* Actual Image Preview */}
            <div
              onClick={() => setShowImageModal(true)}
              className="bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden mb-4 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {selectedResult.imageFile && selectedResult.id ? (
                <img
                  src={`http://localhost:8000/uploads/${selectedResult.imageFile}`}
                  alt="Medical Analysis Image"
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    // Fallback to placeholder if image fails to load
                    e.target.style.display = "none";
                    e.target.nextSibling.style.display = "flex";
                  }}
                />
              ) : null}
              <div
                className={`${
                  selectedResult.imageFile && selectedResult.id
                    ? "hidden"
                    : "flex"
                } bg-gray-100 dark:bg-gray-700 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex-col items-center justify-center h-48`}
              >
                <div className="text-4xl mb-2">📸</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Click to view image
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  {selectedResult.imageFile || "Image not available"}
                </p>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  File Name:
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {selectedResult.imageFile || "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  File Size:
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {selectedResult.imageSize || "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Quality:
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {selectedResult.imageQuality || "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Processing Time:
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {selectedResult.processingTime || "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Model Used:
                </span>
                <span className="font-medium text-gray-900 dark:text-white text-xs">
                  {selectedResult.modelUsed || "BrainTumor ViT v3.2"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Analysis Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Result */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
              <span className="mr-2">🔬</span>
              {selectedResult.analysisType}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="text-center">
                <div
                  className={`inline-flex items-center px-6 py-3 rounded-full text-lg font-semibold ${getResultColor(
                    selectedResult.result
                  )}`}
                >
                  {selectedResult.result}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Analysis Result
                </p>
              </div>

              <div className="text-center">
                <div
                  className={`text-3xl font-bold ${getConfidenceColor(
                    selectedResult.confidence
                  )}`}
                >
                  {selectedResult.confidence}%
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Confidence Score
                </p>
              </div>
            </div>

            {/* Progress Bar for Confidence */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                <span>Confidence Level</span>
                <span>{selectedResult.confidence}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${
                    selectedResult.confidence >= 90
                      ? "bg-green-500"
                      : selectedResult.confidence >= 75
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${selectedResult.confidence}%` }}
                />
              </div>
            </div>
          </div>

          {/* Findings */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <span className="mr-2">📋</span>
              Key Findings
            </h3>
            <ul className="space-y-3">
              {(selectedResult.findings || []).map((finding, index) => (
                <li key={index} className="flex items-start">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700 dark:text-gray-300">
                    {finding}
                  </span>
                </li>
              ))}
              {(!selectedResult.findings ||
                selectedResult.findings.length === 0) && (
                <li className="text-gray-500 dark:text-gray-400 text-center">
                  No findings available
                </li>
              )}
            </ul>
          </div>

          {/* Recommendations */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <span className="mr-2">💡</span>
              Recommendations
            </h3>
            <ul className="space-y-3">
              {(selectedResult.recommendations || []).map((rec, index) => (
                <li key={index} className="flex items-start">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700 dark:text-gray-300">
                    {rec}
                  </span>
                </li>
              ))}
              {(!selectedResult.recommendations ||
                selectedResult.recommendations.length === 0) && (
                <li className="text-gray-500 dark:text-gray-400 text-center">
                  No recommendations available
                </li>
              )}
            </ul>
          </div>

          {/* Technical Details */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <span className="mr-2">⚙️</span>
              Technical Details
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {selectedResult.technicalDetails &&
              typeof selectedResult.technicalDetails === "object" ? (
                Object.entries(selectedResult.technicalDetails).map(
                  ([key, value]) => {
                    // Skip rendering probabilities here as they have their own section
                    if (key === "probabilities") return null;

                    // Ensure value is renderable
                    const displayValue =
                      typeof value === "object"
                        ? JSON.stringify(value)
                        : String(value || "N/A");

                    return (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400 capitalize">
                          {key.replace(/([A-Z])/g, " $1").trim()}:
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {displayValue}
                        </span>
                      </div>
                    );
                  }
                )
              ) : (
                <div className="col-span-2 text-gray-500 dark:text-gray-400 text-center">
                  No technical details available
                </div>
              )}
            </div>
          </div>

          {/* Model Probabilities (if available from API) */}
          {selectedResult.probabilities &&
            typeof selectedResult.probabilities === "object" &&
            Object.keys(selectedResult.probabilities).length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <span className="mr-2">📊</span>
                  Model Probabilities
                </h3>
                <div className="space-y-3">
                  {Object.entries(selectedResult.probabilities).map(
                    ([className, probability]) => (
                      <div
                        key={className}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {className}
                        </span>
                        <div className="flex items-center space-x-3 flex-1 ml-4">
                          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${(probability || 0) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium w-12 text-right text-gray-900 dark:text-white">
                            {((probability || 0) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleDownloadReport}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors flex items-center"
            >
              <span className="mr-2">📥</span>
              Download Report
            </button>
            <button className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white px-6 py-3 rounded-lg transition-colors flex items-center">
              <span className="mr-2">📧</span>
              Email Results
            </button>
            <button className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white px-6 py-3 rounded-lg transition-colors flex items-center">
              <span className="mr-2">🔄</span>
              Re-analyze
            </button>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl max-h-[90vh] overflow-auto relative">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Medical Analysis Image
              </h3>
              <button
                onClick={() => setShowImageModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-xl font-bold"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              {selectedResult.imageFile && selectedResult.id ? (
                <div className="text-center">
                  <img
                    src={`http://localhost:8000/uploads/${selectedResult.imageFile}`}
                    alt="Medical Analysis Image"
                    className="max-w-full max-h-[70vh] object-contain mx-auto rounded-lg shadow-lg"
                    onError={(e) => {
                      // Fallback to placeholder if image fails to load
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "flex";
                    }}
                  />
                  <div className="hidden bg-gray-100 dark:bg-gray-700 rounded-lg p-8 text-center flex-col items-center justify-center h-64">
                    <div className="text-6xl mb-4">🏥</div>
                    <p className="text-gray-600 dark:text-gray-400">
                      Image not available
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                      {selectedResult.imageFile}
                    </p>
                  </div>
                  <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedResult.imageFile}
                    </p>
                    <p>Analysis Type: {selectedResult.analysisType}</p>
                    <p>
                      Patient: {selectedResult.patientName} (
                      {selectedResult.patientId})
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-8 text-center">
                  <div className="text-6xl mb-4">🏥</div>
                  <p className="text-gray-600 dark:text-gray-400">
                    Medical Image Preview
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                    {selectedResult.imageFile || "Image not available"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultDetails;
