import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import HistoryService from "../../services/historyService";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  formatNepaliTime,
  formatNepaliDate,
  calculateAgeInNepali,
} from "../../utils/formatters";
import { downloadMedicalReport } from "../../utils/pdfGenerator";
import ShareModal from "../../components/ShareModal";

const ResultDetails = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { resultId, id } = useParams(); // Support both parameter names
  const currentResultId = resultId || id;
  const [selectedResult, setSelectedResult] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

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
              ? calculateAgeInNepali(backendResult.patient.date_of_birth)
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
      console.log("Starting PDF download for:", selectedResult);

      // Show loading state
      const downloadButton = document.querySelector(
        'button[aria-label="download-report"]'
      );
      const originalText = downloadButton?.textContent;
      if (downloadButton) {
        downloadButton.textContent = "Generating PDF...";
        downloadButton.disabled = true;
      }

      // Ensure we have the required data structure for PDF generation
      const reportData = {
        ...selectedResult,
        // Ensure findings and recommendations are arrays
        findings: selectedResult.findings || [],
        recommendations: selectedResult.recommendations || [],
        // Add fallback values for missing data
        patientName: selectedResult.patientName || "Unknown Patient",
        patientId: selectedResult.patientId || "N/A",
        result: selectedResult.result || "Analysis Result",
        confidence: selectedResult.confidence || 0,
      };

      let pdfGeneratedSuccessfully = false;

      // Try using the utility function first
      if (typeof downloadMedicalReport === "function") {
        try {
          await downloadMedicalReport(
            reportData,
            `medical_report_${reportData.patientId}_${formatNepaliTime(
              new Date(),
              {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: undefined,
                minute: undefined,
                timeZoneName: undefined,
              }
            )
              .replace(/\//g, "-")
              .replace(/,/g, "")}.pdf`
          );
          pdfGeneratedSuccessfully = true;
          console.log("PDF generated using utility function");
        } catch (utilityError) {
          console.warn(
            "Utility PDF generation failed, using fallback:",
            utilityError
          );
        }
      } else {
        console.warn(
          "downloadMedicalReport function not available, using fallback"
        );
      }

      // Fallback to simple PDF generation if utility failed
      if (!pdfGeneratedSuccessfully) {
        console.log("Using fallback PDF generation");

        const pdf = new jsPDF();

        // Header
        pdf.setFillColor(25, 46, 89);
        pdf.rect(0, 0, 210, 25, "F");
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(16);
        pdf.text("MEDICAL ANALYSIS REPORT", 105, 15, { align: "center" });

        // Reset color and position
        pdf.setTextColor(0, 0, 0);
        let yPos = 40;

        // Patient Information
        pdf.setFontSize(14);
        pdf.setFont(undefined, "bold");
        pdf.text("PATIENT INFORMATION", 20, yPos);
        yPos += 10;

        pdf.setFontSize(11);
        pdf.setFont(undefined, "normal");
        pdf.text(`Patient Name: ${reportData.patientName}`, 20, yPos);
        yPos += 7;
        pdf.text(`Patient ID: ${reportData.patientId}`, 20, yPos);
        yPos += 7;
        if (reportData.age)
          pdf.text(`Age: ${reportData.age} years`, 20, yPos), (yPos += 7);
        if (reportData.gender)
          pdf.text(`Gender: ${reportData.gender}`, 20, yPos), (yPos += 7);
        yPos += 5;

        // Analysis Results
        pdf.setFontSize(14);
        pdf.setFont(undefined, "bold");
        pdf.text("ANALYSIS RESULTS", 20, yPos);
        yPos += 10;

        pdf.setFontSize(11);
        pdf.setFont(undefined, "normal");
        pdf.text(
          `Analysis Type: ${reportData.analysisType || "Medical Analysis"}`,
          20,
          yPos
        );
        yPos += 7;
        pdf.text(`Result: ${reportData.result}`, 20, yPos);
        yPos += 7;
        pdf.text(`Confidence Score: ${reportData.confidence}%`, 20, yPos);
        yPos += 7;
        pdf.text(`Analysis Date: ${formatNepaliTime(new Date())}`, 20, yPos);
        yPos += 10;

        // Findings
        if (reportData.findings && reportData.findings.length > 0) {
          pdf.setFont(undefined, "bold");
          pdf.text("KEY FINDINGS:", 20, yPos);
          yPos += 7;
          pdf.setFont(undefined, "normal");
          reportData.findings.forEach((finding, index) => {
            if (yPos > 270) {
              pdf.addPage();
              yPos = 20;
            }
            pdf.text(`• ${finding}`, 25, yPos);
            yPos += 6;
          });
          yPos += 5;
        }

        // Recommendations
        if (
          reportData.recommendations &&
          reportData.recommendations.length > 0
        ) {
          if (yPos > 250) {
            pdf.addPage();
            yPos = 20;
          }
          pdf.setFont(undefined, "bold");
          pdf.text("RECOMMENDATIONS:", 20, yPos);
          yPos += 7;
          pdf.setFont(undefined, "normal");
          reportData.recommendations.forEach((rec, index) => {
            if (yPos > 270) {
              pdf.addPage();
              yPos = 20;
            }
            pdf.text(`${index + 1}. ${rec}`, 25, yPos);
            yPos += 6;
          });
        }

        // Footer
        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 100);
        pdf.text("Second Opinion AI - Medical Analysis Platform", 105, 285, {
          align: "center",
        });

        // Download the PDF
        pdf.save(
          `medical_report_${reportData.patientId}_${formatNepaliTime(
            new Date(),
            {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: undefined,
              minute: undefined,
              timeZoneName: undefined,
            }
          )
            .replace(/\//g, "-")
            .replace(/,/g, "")}.pdf`
        );

        console.log("Fallback PDF generated successfully");
      }

      // Reset button state
      if (downloadButton) {
        downloadButton.textContent = originalText;
        downloadButton.disabled = false;
      }

      console.log("PDF download completed successfully");
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert(
        `Failed to generate PDF: ${
          error.message || "Unknown error"
        }. Please try again.`
      );

      // Reset button state
      const downloadButton = document.querySelector(
        'button[aria-label="download-report"]'
      );
      if (downloadButton) {
        downloadButton.textContent = "Download Report";
        downloadButton.disabled = false;
      }
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

          {/* Medical Image Preview */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <span className="mr-2"></span>
              Medical Imaging
            </h2>

            {/* Medical Image Preview */}
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
                <div className="text-4xl mb-2">🏥</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Click to view medical image
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Medical scan ready for review
                </p>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <span className="text-blue-600 dark:text-blue-400 mr-2">
                  ℹ️
                </span>
                <span className="font-medium text-blue-900 dark:text-blue-300">
                  Medical Image Analysis Complete
                </span>
              </div>
              <p className="text-sm text-blue-800 dark:text-blue-300">
                {selectedResult.analysisType} has been successfully performed
                using advanced AI diagnostic imaging. The analysis provides
                clinical-grade insights for medical review.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column - Analysis Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Clinical Assessment */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
              <span className="mr-2">🏥</span>
              Clinical Assessment - {selectedResult.analysisType}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="text-center">
                <div className="mb-4">
                  <div
                    className={`inline-flex items-center px-8 py-4 rounded-xl text-xl font-bold ${getResultColor(
                      selectedResult.result
                    )}`}
                  >
                    {selectedResult.result.includes("Normal")
                      ? "✅"
                      : selectedResult.result.includes("Tumor") ||
                        selectedResult.result.includes("tumor")
                      ? "⚠️"
                      : "🔍"}{" "}
                    {selectedResult.result}
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  Diagnostic Result
                </p>
              </div>

              <div className="text-center">
                <div className="mb-4">
                  <div
                    className={`text-4xl font-bold ${getConfidenceColor(
                      selectedResult.confidence
                    )}`}
                  >
                    {selectedResult.confidence}%
                  </div>
                  <div className="mt-2">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        selectedResult.confidence >= 90
                          ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                          : selectedResult.confidence >= 75
                          ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300"
                          : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                      }`}
                    >
                      {selectedResult.confidence >= 90
                        ? "High Confidence"
                        : selectedResult.confidence >= 75
                        ? "Moderate Confidence"
                        : "Low Confidence"}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  AI Diagnostic Confidence
                </p>
              </div>
            </div>

            {/* Medical Status Indicator */}
            <div
              className={`p-4 rounded-lg mb-6 ${
                selectedResult.result.includes("Normal")
                  ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                  : "bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
              }`}
            >
              <div className="flex items-center">
                <span className="text-2xl mr-3">
                  {selectedResult.result.includes("Normal") ? "✅" : "🏥"}
                </span>
                <div>
                  <h4
                    className={`font-semibold ${
                      selectedResult.result.includes("Normal")
                        ? "text-green-900 dark:text-green-100"
                        : "text-amber-900 dark:text-amber-100"
                    }`}
                  >
                    {selectedResult.result.includes("Normal")
                      ? "Normal Findings"
                      : "Abnormality Detected - Medical Review Recommended"}
                  </h4>
                  <p
                    className={`text-sm mt-1 ${
                      selectedResult.result.includes("Normal")
                        ? "text-green-700 dark:text-green-300"
                        : "text-amber-700 dark:text-amber-300"
                    }`}
                  >
                    {selectedResult.result.includes("Normal")
                      ? "No significant abnormalities detected in the medical imaging analysis."
                      : "The AI analysis has identified potential abnormalities that require medical evaluation."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Clinical Findings */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <span className="mr-2"></span>
              Clinical Findings
            </h3>
            <div className="space-y-4">
              {(selectedResult.findings || []).map((finding, index) => (
                <div
                  key={index}
                  className="flex items-start p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
                >
                  <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5 mr-3 flex-shrink-0">
                    {index + 1}
                  </span>
                  <div>
                    <span className="text-gray-900 dark:text-gray-100 font-medium">
                      {finding}
                    </span>
                  </div>
                </div>
              ))}
              {(!selectedResult.findings ||
                selectedResult.findings.length === 0) && (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">📋</div>
                  <p className="text-gray-500 dark:text-gray-400">
                    Clinical findings will be populated based on analysis
                    results
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Medical Recommendations */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <span className="mr-2">⚕️</span>
              Medical Recommendations
            </h3>
            <div className="space-y-4">
              {(selectedResult.recommendations || []).map((rec, index) => (
                <div
                  key={index}
                  className="flex items-start p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-l-4 border-green-500"
                >
                  <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5 mr-3 flex-shrink-0">
                    {index + 1}
                  </span>
                  <div>
                    <span className="text-gray-900 dark:text-gray-100 font-medium">
                      {rec}
                    </span>
                  </div>
                </div>
              ))}
              {(!selectedResult.recommendations ||
                selectedResult.recommendations.length === 0) && (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">💡</div>
                  <p className="text-gray-500 dark:text-gray-400">
                    Medical recommendations will be provided based on findings
                  </p>
                </div>
              )}
            </div>

            {/* Medical Disclaimer */}
            <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div className="flex items-start">
                <span className="text-amber-600 dark:text-amber-400 mr-2 mt-0.5">
                  ⚠️
                </span>
                <div>
                  <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                    Important Medical Notice
                  </h4>
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    This AI analysis is designed to assist healthcare
                    professionals and should not replace professional medical
                    diagnosis. Please consult with a qualified healthcare
                    provider for proper medical evaluation and treatment
                    decisions.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Medical Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <span className="mr-2">⚡</span>
              Medical Report Actions
            </h3>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={handleDownloadReport}
                aria-label="download-report"
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                <span className="mr-2"></span>
                Download Medical Report
              </button>
              <button
                onClick={() => setShowShareModal(true)}
                className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white px-6 py-3 rounded-lg transition-colors flex items-center font-medium"
              >
                <span className="mr-2">📧</span>
                Share with Doctor
              </button>
              <button
                onClick={() => navigate("/upload")}
                className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white px-6 py-3 rounded-lg transition-colors flex items-center font-medium"
              >
                <span className="mr-2">🩺</span>
                New Medical Analysis
              </button>
            </div>

            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">Next Steps:</span> Save this
                report for your medical records, share with your healthcare
                provider, or perform additional analysis as needed.
              </p>
            </div>
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

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        resultData={selectedResult}
        patientData={
          selectedResult?.patient || {
            full_name: selectedResult?.patientName,
            email: selectedResult?.contact,
            phone: selectedResult?.contact,
          }
        }
      />
    </div>
  );
};

export default ResultDetails;
