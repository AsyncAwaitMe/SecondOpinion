import React, { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import ShareService from "../services/shareService";

const ShareModal = ({ isOpen, onClose, resultData, patientData }) => {
  const { isDark } = useTheme();
  const [formData, setFormData] = useState({
    doctor_name: "",
    doctor_email: "",
    sender_name: patientData?.full_name || "",
    notes: "",
    include_pdf: true,
  });
  const [isSharing, setIsSharing] = useState(false);
  const [errors, setErrors] = useState([]);
  const [success, setSuccess] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    const validation = ShareService.validateShareForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setIsSharing(true);
    setErrors([]);

    try {
      // Check if user is authenticated
      const token = localStorage.getItem("token");
      if (!token) {
        setErrors(["Please log in to share reports with doctors."]);
        return;
      }

      // Convert prediction ID to integer if it's a string ID from mock data
      let predictionId = resultData.id;
      if (typeof predictionId === "string" && predictionId.startsWith("PT-")) {
        // This is mock data, we can't share it - show error
        setErrors([
          "Cannot share demo/sample data. Please perform a real medical analysis first.",
        ]);
        return;
      }

      // Ensure prediction ID is a number
      predictionId = parseInt(predictionId);
      if (isNaN(predictionId)) {
        setErrors(["Invalid prediction ID. Cannot share this result."]);
        return;
      }

      const shareRequest = {
        prediction_id: predictionId,
        doctor_email: formData.doctor_email.trim(),
        doctor_name: formData.doctor_name.trim(),
        sender_name:
          formData.sender_name.trim() || patientData?.full_name || "Patient",
        notes: formData.notes.trim() || null,
        include_pdf: formData.include_pdf,
      };

      console.log("ShareModal: Sending share request:", shareRequest);
      console.log("ShareModal: resultData:", resultData);
      console.log("ShareModal: patientData:", patientData);

      await ShareService.shareReport(shareRequest);
      setSuccess(true);

      // Auto-close after 2 seconds
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setFormData({
          doctor_name: "",
          doctor_email: "",
          sender_name: patientData?.full_name || "",
          notes: "",
          include_pdf: true,
        });
      }, 2000);
    } catch (error) {
      setErrors([error.message]);
    } finally {
      setIsSharing(false);
    }
  };

  const handleClose = () => {
    if (!isSharing) {
      onClose();
      setErrors([]);
      setSuccess(false);
      setFormData({
        doctor_name: "",
        doctor_email: "",
        sender_name: patientData?.full_name || "",
        notes: "",
        include_pdf: true,
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div
        className={`${
          isDark
            ? "bg-gray-900 text-white border border-gray-600"
            : "bg-white text-gray-900 border border-gray-200"
        } rounded-xl max-w-lg w-full max-h-[90vh] overflow-auto shadow-2xl`}
        style={{
          backgroundColor: isDark ? "#111827" : "#ffffff",
          color: isDark ? "#ffffff" : "#111827",
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h3
            className="text-xl font-semibold"
            style={{
              color: isDark ? "#ffffff" : "#111827",
            }}
          >
            📧 Share with Doctor
          </h3>
          <button
            onClick={handleClose}
            disabled={isSharing}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-xl font-bold disabled:opacity-50"
            style={{
              color: isDark ? "#d1d5db" : "#6b7280",
            }}
          >
            ✕
          </button>
        </div>

        {/* Info for Demo Data */}
        {resultData?.id &&
          typeof resultData.id === "string" &&
          resultData.id.startsWith("PT-") && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
              <div className="flex items-start">
                <span className="text-blue-600 dark:text-blue-400 mr-2 mt-0.5">
                  ℹ️
                </span>
                <div>
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                    Demo Data Notice
                  </h4>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    This is sample/demo data. To share real medical reports,
                    please upload and analyze actual medical images first.
                    <br />
                    <a href="/upload" className="underline hover:no-underline">
                      Go to Upload Page
                    </a>{" "}
                    to perform a real analysis.
                  </p>
                </div>
              </div>
            </div>
          )}

        {/* Success State */}
        {success && (
          <div className="p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✅</span>
              </div>
              <h4 className="text-lg font-semibold text-green-800 dark:text-green-300 mb-2">
                Report Shared Successfully!
              </h4>
              <p className="text-green-600 dark:text-green-400 text-sm">
                The medical report has been sent to Dr. {formData.doctor_name}{" "}
                at {formData.doctor_email}
              </p>
            </div>
          </div>
        )}

        {/* Form */}
        {!success && (
          <form onSubmit={handleSubmit} className="p-6">
            {/* Patient Info Preview */}
            <div
              className="mb-6 p-4 rounded-lg border"
              style={{
                backgroundColor: isDark ? "#1e3a8a" : "#dbeafe",
                borderColor: isDark ? "#3b82f6" : "#93c5fd",
              }}
            >
              <h4
                className="font-semibold mb-2"
                style={{
                  color: isDark ? "#ffffff" : "#1e40af",
                  fontWeight: "700",
                }}
              >
                📋 Report Details
              </h4>
              <div
                className="text-sm space-y-1"
                style={{
                  color: isDark ? "#e5e7eb" : "#1e40af",
                  fontWeight: "500",
                }}
              >
                <p>
                  <strong>Patient:</strong>{" "}
                  {patientData?.full_name || "Unknown"}
                </p>
                <p>
                  <strong>Analysis:</strong>{" "}
                  {resultData?.result || resultData?.prediction}
                </p>
                <p>
                  <strong>Confidence:</strong> {resultData?.confidence}%
                </p>
                <p>
                  <strong>Date:</strong>{" "}
                  {new Date(
                    resultData?.completedAt || resultData?.created_at
                  ).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Error Display */}
            {errors.length > 0 && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-start">
                  <span className="text-red-600 mr-2 text-lg">⚠️</span>
                  <div>
                    <h4 className="font-semibold text-red-800 dark:text-red-300">
                      Please fix the following errors:
                    </h4>
                    <ul className="text-red-700 dark:text-red-300 text-sm mt-1 list-disc list-inside">
                      {errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Form Fields */}
            <div className="space-y-4">
              {/* Doctor Name */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{
                    color: isDark ? "#f3f4f6" : "#374151",
                    fontWeight: "600",
                  }}
                >
                  Doctor's Name *
                </label>
                <input
                  type="text"
                  name="doctor_name"
                  value={formData.doctor_name}
                  onChange={handleInputChange}
                  placeholder="John Smith"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  style={{
                    color: isDark ? "#ffffff" : "#000000",
                    backgroundColor: isDark ? "#1f2937" : "#ffffff",
                    borderColor: isDark ? "#4b5563" : "#d1d5db",
                    fontSize: "16px",
                    fontWeight: "500",
                  }}
                  required
                  disabled={isSharing}
                />
              </div>

              {/* Doctor Email */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{
                    color: isDark ? "#f3f4f6" : "#374151",
                    fontWeight: "600",
                  }}
                >
                  Doctor's Email Address *
                </label>
                <input
                  type="email"
                  name="doctor_email"
                  value={formData.doctor_email}
                  onChange={handleInputChange}
                  placeholder="doctor@hospital.com"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  style={{
                    color: isDark ? "#ffffff" : "#000000",
                    backgroundColor: isDark ? "#1f2937" : "#ffffff",
                    borderColor: isDark ? "#4b5563" : "#d1d5db",
                    fontSize: "16px",
                    fontWeight: "500",
                  }}
                  required
                  disabled={isSharing}
                />
              </div>

              {/* Sender Name */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{
                    color: isDark ? "#f3f4f6" : "#374151",
                    fontWeight: "600",
                  }}
                >
                  Your Name (optional)
                </label>
                <input
                  type="text"
                  name="sender_name"
                  value={formData.sender_name}
                  onChange={handleInputChange}
                  placeholder="Your name"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  style={{
                    color: isDark ? "#ffffff" : "#000000",
                    backgroundColor: isDark ? "#1f2937" : "#ffffff",
                    borderColor: isDark ? "#4b5563" : "#d1d5db",
                    fontSize: "16px",
                    fontWeight: "500",
                  }}
                  disabled={isSharing}
                />
              </div>

              {/* Additional Notes */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{
                    color: isDark ? "#f3f4f6" : "#374151",
                    fontWeight: "600",
                  }}
                >
                  Additional Notes (optional)
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Any additional information for the doctor..."
                  rows={3}
                  maxLength={1000}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  style={{
                    color: isDark ? "#ffffff" : "#000000",
                    backgroundColor: isDark ? "#1f2937" : "#ffffff",
                    borderColor: isDark ? "#4b5563" : "#d1d5db",
                    fontSize: "16px",
                    fontWeight: "500",
                  }}
                  disabled={isSharing}
                />
                <div
                  className="text-xs mt-1"
                  style={{
                    color: isDark ? "#d1d5db" : "#6b7280",
                    fontWeight: "500",
                  }}
                >
                  {formData.notes.length}/1000 characters
                </div>
              </div>

              {/* Include PDF */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="include_pdf"
                  id="include_pdf"
                  checked={formData.include_pdf}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                  disabled={isSharing}
                />
                <label
                  htmlFor="include_pdf"
                  className="ml-2 block text-sm"
                  style={{
                    color: isDark ? "#f3f4f6" : "#374151",
                    fontWeight: "500",
                  }}
                >
                  Include PDF report as attachment
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSharing}
                className="flex-1 py-2 px-4 border rounded-lg transition-colors disabled:opacity-50"
                style={{
                  borderColor: isDark ? "#4b5563" : "#d1d5db",
                  color: isDark ? "#f3f4f6" : "#374151",
                  backgroundColor: isDark ? "#1f2937" : "#ffffff",
                  fontWeight: "500",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSharing}
                className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {isSharing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sharing...
                  </>
                ) : (
                  "📧 Share Report"
                )}
              </button>
            </div>

            {/* Info Box */}
            <div
              className="mt-4 p-3 rounded-lg border"
              style={{
                backgroundColor: isDark ? "#92400e" : "#fef3c7",
                borderColor: isDark ? "#f59e0b" : "#fbbf24",
              }}
            >
              <p
                className="text-xs"
                style={{
                  color: isDark ? "#fde68a" : "#92400e",
                  fontWeight: "600",
                }}
              >
                ℹ️ The doctor will receive a professional email with the
                analysis results, findings, and recommendations.
                {formData.include_pdf &&
                  " A PDF report will be attached for their records."}
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ShareModal;
