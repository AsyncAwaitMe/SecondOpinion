import React, { useState, useCallback, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import ApiService from "../../services/api";
import HistoryService from "../../services/historyService";

const Upload = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const { theme } = useTheme();
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [selectedModel, setSelectedModel] = useState("brain");
  const [existingPatients, setExistingPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [showPatientSearch, setShowPatientSearch] = useState(false);
  const [patientSearchQuery, setPatientSearchQuery] = useState("");
  const [patientInfo, setPatientInfo] = useState({
    name: "",
    dateOfBirth: "",
    gender: "",
    phone: "",
    contact: "",
    notes: "",
  });
  const [validationErrors, setValidationErrors] = useState({
    phone: "",
    dateOfBirth: "",
  });

  // Handle URL parameters for model pre-selection
  useEffect(() => {
    const modelParam = searchParams.get("model");
    if (modelParam) {
      // Map URL parameters to internal model IDs
      const modelMap = {
        brain: "brain",
        tumor: "brain",
        pneumonia: "pneumonia",
        chest: "pneumonia",
        breast: "breast",
        skin: "skin",
      };

      const mappedModel = modelMap[modelParam.toLowerCase()];
      if (mappedModel) {
        setSelectedModel(mappedModel);
      }
    }
  }, [searchParams]);

  const modelOptions = [
    {
      id: "brain",
      name: "Brain Tumor Detection",
      icon: "🧠",
      format: "MRI scans",
      available: true,
      endpoint: "tumor",
    },
    {
      id: "pneumonia",
      name: "Pneumonia Detection",
      icon: "🫁",
      format: "X-ray images",
      available: false,
      endpoint: "chest",
    },
    {
      id: "breast",
      name: "Breast Cancer Detection",
      icon: "🩺",
      format: "Mammography images",
      available: false,
    },
    {
      id: "skin",
      name: "Skin Cancer Detection",
      icon: "🔬",
      format: "Dermatological images",
      available: false,
    },
  ];

  // Check authentication
  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth/login");
      return;
    }
  }, [isAuthenticated, navigate]);

  // Load existing patients for selection
  React.useEffect(() => {
    if (isAuthenticated) {
      loadPatients();
    }
  }, [isAuthenticated]);

  const loadPatients = async () => {
    try {
      const patients = await HistoryService.getPatients();
      setExistingPatients(patients);
    } catch (error) {
      console.error("Failed to load patients:", error);
    }
  };

  const searchPatients = async (query) => {
    if (!query.trim()) {
      loadPatients();
      return;
    }

    try {
      const patients = await HistoryService.searchPatients(query);
      setExistingPatients(patients);
    } catch (error) {
      console.error("Failed to search patients:", error);
    }
  };

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelection(files[0]);
    }
  }, []);

  const handleFileSelection = (file) => {
    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/dicom",
    ];
    if (
      !allowedTypes.includes(file.type) &&
      !file.name.toLowerCase().endsWith(".dcm")
    ) {
      alert("Please upload a valid medical image (JPEG, PNG, or DICOM format)");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB");
      return;
    }

    setSelectedFile(file);

    // Create image preview for supported formats
    if (
      file.type.startsWith("image/") &&
      !file.name.toLowerCase().endsWith(".dcm")
    ) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      // For DICOM files, we'll show a placeholder
      setImagePreview(null);
    }
  };

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelection(file);
    }
  };

  const handlePatientInfoChange = (field, value) => {
    setPatientInfo((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleExistingPatientSelect = (patient) => {
    setSelectedPatientId(patient.id);
    setPatientInfo({
      name: patient.full_name,
      dateOfBirth: patient.date_of_birth || "",
      gender: patient.gender || "",
      phone: patient.phone || "",
      contact: patient.phone || "",
      notes: "",
    });
    setShowPatientSearch(false);
  };

  const handleNewPatient = () => {
    setSelectedPatientId("");
    setPatientInfo({
      name: "",
      dateOfBirth: "",
      gender: "",
      phone: "",
      contact: "",
      notes: "",
    });
    setShowPatientSearch(false);
  };

  const formatDateForBackend = (dateStr) => {
    if (!dateStr) return null;

    // If it's already in YYYY-MM-DD format, return as is
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateStr;
    }

    // Try to parse and format
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return null;
      return date.toISOString().split("T")[0];
    } catch {
      return null;
    }
  };

  // Validation functions
  const validatePhoneNumber = (phone) => {
    if (!phone.trim()) return "";

    // Remove all non-digit characters
    const digitsOnly = phone.replace(/\D/g, "");

    // Check if it's exactly 10 digits
    if (digitsOnly.length !== 10) {
      return "Phone number must be exactly 10 digits";
    }

    // Format as XXX-XXX-XXXX (plain format)
    const formatted = `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(
      3,
      6
    )}-${digitsOnly.slice(6)}`;

    // Update the phone field with formatted value
    setPatientInfo((prev) => ({ ...prev, phone: formatted }));

    return "";
  };

  const validateDateOfBirth = (dob) => {
    if (!dob) return "";

    const birthDate = new Date(dob);
    const today = new Date();

    // Check if date is in the future
    if (birthDate > today) {
      return "Date of birth cannot be in the future";
    }

    // Calculate age
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    // Adjust age if birthday hasn't occurred this year
    const adjustedAge =
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
        ? age - 1
        : age;

    // Check if age is reasonable (0-120 years)
    if (adjustedAge < 0) {
      return "Invalid date of birth";
    }

    if (adjustedAge > 120) {
      return "Age cannot exceed 120 years";
    }

    return "";
  };

  // Enhanced change handlers with validation
  const handlePhoneChange = (value) => {
    setPatientInfo((prev) => ({ ...prev, phone: value }));
    const error = validatePhoneNumber(value);
    setValidationErrors((prev) => ({ ...prev, phone: error }));
  };

  const handleDateOfBirthChange = (value) => {
    setPatientInfo((prev) => ({ ...prev, dateOfBirth: value }));
    const error = validateDateOfBirth(value);
    setValidationErrors((prev) => ({ ...prev, dateOfBirth: error }));
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Please select a file to upload");
      return;
    }

    if (!patientInfo.name) {
      alert("Please provide patient name");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    try {
      // Simulate progress during upload
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Prepare patient data for backend
      const patientData = {
        patient_name: patientInfo.name,
        patient_gender: patientInfo.gender,
        patient_phone: patientInfo.phone || patientInfo.contact,
        notes: patientInfo.notes,
      };

      // Add patient ID if existing patient is selected
      if (selectedPatientId) {
        patientData.patient_id = parseInt(selectedPatientId);
      } else {
        // Add date of birth for new patients
        const dob = formatDateForBackend(patientInfo.dateOfBirth);
        if (dob) {
          patientData.patient_dob = dob;
        }
      }

      // Determine which API method to use based on selected model
      let response;
      if (selectedModel === "brain") {
        response = await ApiService.uploadTumorImage(selectedFile, patientData);
      } else if (selectedModel === "pneumonia") {
        response = await ApiService.uploadChestImage(selectedFile, patientData);
      } else {
        throw new Error("Selected model is not yet available");
      }

      // Complete progress
      clearInterval(progressInterval);
      setUploadProgress(100);

      // Navigate to ResultDetails with the backend result ID
      setTimeout(() => {
        setIsUploading(false);
        // Refresh patients list if new patient was created
        if (!selectedPatientId) {
          loadPatients();
        }
        // Use the actual result ID from the backend response
        navigate(`/results/details/${response.id}`);
      }, 1000);
    } catch (error) {
      console.error("Upload failed:", error);

      // Handle different types of errors
      let errorMessage = "Upload failed. Please try again.";

      if (error.response && error.response.data) {
        const errorData = error.response.data;

        // Handle separator validation errors (structured error object)
        if (errorData.detail && typeof errorData.detail === "object") {
          if (
            errorData.detail.error &&
            errorData.detail.error.includes("Invalid image type")
          ) {
            const imageType =
              errorData.detail.separator_prediction || "Non-medical";
            const mriProb = errorData.detail.mri_probability || 0;
            errorMessage = `Image Validation Failed: This appears to be a ${imageType} image (MRI probability: ${(
              mriProb * 100
            ).toFixed(
              1
            )}%). Please upload an MRI brain scan image for tumor analysis.`;
          } else {
            errorMessage =
              errorData.detail.message ||
              errorData.detail.error ||
              errorMessage;
          }
        }
        // Handle simple string error messages
        else if (errorData.detail && typeof errorData.detail === "string") {
          errorMessage = errorData.detail;
        }
        // Handle message field
        else if (errorData.message) {
          errorMessage = errorData.message;
        }
        // Handle error field
        else if (errorData.error) {
          errorMessage = errorData.error;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Special handling for patient requirement error
      if (
        errorMessage.includes(
          "Either patient_id or patient_name must be provided"
        )
      ) {
        errorMessage =
          "Please select an existing patient or provide patient information for a new patient.";
      }

      setUploadError(errorMessage);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Helper function to generate findings based on API response
  const generateFindings = (response) => {
    const findings = [];

    if (response.prediction === "Normal Brain") {
      findings.push("No tumor detected");
      findings.push("Normal brain tissue structure");
      findings.push("Clear ventricles");
      findings.push("No mass effect observed");
    } else if (response.prediction.includes("Glioma")) {
      findings.push(`${response.prediction} detected`);
      findings.push("Irregular enhancement pattern");
      findings.push("Possible mass effect");
      findings.push("Requires further evaluation");
    } else if (response.prediction.includes("Meningioma")) {
      findings.push(`${response.prediction} detected`);
      findings.push("Extra-axial location likely");
      findings.push("Well-circumscribed appearance");
      findings.push("Requires surgical consultation");
    } else if (response.prediction.includes("Pituitary")) {
      findings.push(`${response.prediction} detected`);
      findings.push("Sellar/suprasellar region");
      findings.push("Endocrine evaluation needed");
      findings.push("MRI with gadolinium recommended");
    } else {
      findings.push(`Detection result: ${response.prediction}`);
      findings.push(
        `Confidence level: ${(response.confidence * 100).toFixed(1)}%`
      );
      if (response.message) {
        findings.push(response.message);
      }
    }

    return findings;
  };

  // Helper function to generate recommendations based on API response
  const generateRecommendations = (response) => {
    const recommendations = [];

    if (response.prediction === "Normal Brain") {
      recommendations.push("Continue routine monitoring");
      recommendations.push("No immediate intervention needed");
      recommendations.push("Annual follow-up recommended");
    } else if (
      response.prediction.includes("Tumor") ||
      response.prediction.includes("tumor")
    ) {
      recommendations.push("Immediate medical consultation recommended");
      recommendations.push("Additional imaging studies may be required");
      recommendations.push("Multidisciplinary team review suggested");
      recommendations.push("Consider specialist referral");
    } else if (
      response.prediction === "Low Confidence" ||
      response.prediction === "Uncertain/Unrelated"
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

  const clearFile = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setUploadProgress(0);
  };

  const handleChangePhoto = () => {
    // Trigger file input
    const fileInput = document.getElementById("hidden-file-input");
    if (fileInput) {
      fileInput.click();
    }
  };

  const currentModel = modelOptions.find((model) => model.id === selectedModel);

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Upload Medical Image
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Upload your medical images for AI-powered analysis
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Upload and Model Selection */}
        <div className="lg:col-span-2 space-y-6">
          {/* Model Selection */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Select AI Model
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {modelOptions.map((model) => (
                <button
                  key={model.id}
                  onClick={() => model.available && setSelectedModel(model.id)}
                  disabled={!model.available}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 text-left relative ${
                    selectedModel === model.id && model.available
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400"
                      : model.available
                      ? "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-800"
                      : "border-gray-200 dark:border-gray-600 opacity-60 cursor-not-allowed bg-white dark:bg-gray-800"
                  }`}
                >
                  {!model.available && (
                    <div className="absolute top-2 right-2 bg-gradient-to-r from-orange-400 to-orange-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                      Coming Soon
                    </div>
                  )}
                  {model.available && (
                    <div className="absolute top-2 right-2 bg-gradient-to-r from-green-400 to-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                      Available
                    </div>
                  )}
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">{model.icon}</span>
                    <h3
                      className={`font-semibold ${
                        model.available
                          ? "text-gray-900 dark:text-white"
                          : "text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      {model.name}
                    </h3>
                  </div>
                  <p
                    className={`text-sm ${
                      model.available
                        ? "text-gray-600 dark:text-gray-400"
                        : "text-gray-500 dark:text-gray-500"
                    }`}
                  >
                    {model.available
                      ? model.format
                      : "Implementation in progress"}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* File Upload Area */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Upload Image
            </h2>

            {selectedFile ? (
              /* Image Preview Section */
              <div className="space-y-4">
                {/* Image Preview */}
                <div className="relative border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-700">
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Selected medical image"
                        className="w-full h-64 object-contain bg-black"
                      />
                      <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                        Preview
                      </div>
                    </div>
                  ) : (
                    /* DICOM File Placeholder */
                    <div className="h-64 flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                      <div className="text-center">
                        <div className="text-4xl mb-2">🏥</div>
                        <h3 className="font-semibold text-gray-700 dark:text-gray-300">
                          DICOM File
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Preview not available
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* File Information */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                      File Details
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                      ✓ Ready
                    </span>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                    <div>
                      <strong>Name:</strong> {selectedFile.name}
                    </div>
                    <div>
                      <strong>Size:</strong>{" "}
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                    <div>
                      <strong>Type:</strong> {selectedFile.type || "DICOM"}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleChangePhoto}
                    className="flex-1 flex items-center justify-center px-4 py-2 border border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors font-medium"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    Change Photo
                  </button>
                  <button
                    onClick={clearFile}
                    className="flex-1 flex items-center justify-center px-4 py-2 border border-red-600 dark:border-red-500 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    Remove Photo
                  </button>
                </div>

                {/* Hidden file input for "Change Photo" functionality */}
                <input
                  id="hidden-file-input"
                  type="file"
                  accept="image/*,.dcm"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </div>
            ) : (
              /* Initial Upload Area */
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ${
                  isDragOver
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400"
                    : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 bg-white dark:bg-gray-800"
                }`}
              >
                <div className="text-6xl mb-4">📤</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Drop your image here
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  or click to browse files
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                  Supported formats: JPEG, PNG, DICOM • Max size: 10MB
                </p>
                <input
                  type="file"
                  accept="image/*,.dcm"
                  onChange={handleFileInput}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <button className="bg-blue-600 dark:bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-700 transition-colors">
                  Browse Files
                </button>
              </div>
            )}

            {/* Upload Progress */}
            {isUploading && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {uploadProgress < 90 ? "Uploading..." : "Analyzing..."}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {uploadProgress}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Upload Error */}
            {uploadError && (
              <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex">
                  <div className="text-red-600 dark:text-red-400 text-sm">
                    <strong>Upload Failed:</strong> {uploadError}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Patient Information */}
        <div className="space-y-6">
          {/* Patient Selection */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Patient Selection
            </h2>

            <div className="space-y-4">
              {/* Patient Selection Options */}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowPatientSearch(true)}
                  className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium text-gray-900 dark:text-white"
                >
                  Select Existing Patient
                </button>
                <button
                  onClick={handleNewPatient}
                  className="flex-1 py-2 px-4 bg-blue-600 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-700 text-sm font-medium"
                >
                  New Patient
                </button>
              </div>

              {/* Patient Search Modal */}
              {showPatientSearch && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                      Select Patient
                    </h3>

                    {/* Search Input */}
                    <div className="mb-4">
                      <input
                        type="text"
                        placeholder="Search patients..."
                        value={patientSearchQuery}
                        onChange={(e) => {
                          setPatientSearchQuery(e.target.value);
                          searchPatients(e.target.value);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    {/* Patient List */}
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {existingPatients.length > 0 ? (
                        existingPatients.map((patient) => (
                          <div
                            key={patient.id}
                            onClick={() => handleExistingPatientSelect(patient)}
                            className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                          >
                            <div className="font-medium text-gray-900 dark:text-white">
                              {patient.full_name}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {patient.date_of_birth &&
                                `DOB: ${patient.date_of_birth}`}
                              {patient.phone && ` • Phone: ${patient.phone}`}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                          No patients found
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => setShowPatientSearch(false)}
                        className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Selected Patient Display */}
              {selectedPatientId && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="text-sm font-medium text-green-800 dark:text-green-400">
                    Selected Patient: {patientInfo.name}
                  </div>
                  <div className="text-xs text-green-600 dark:text-green-500">
                    ID: {selectedPatientId}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Patient Information Form */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {selectedPatientId
                ? "Patient Information"
                : "New Patient Information"}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Patient Name *
                </label>
                <input
                  type="text"
                  value={patientInfo.name}
                  onChange={(e) =>
                    handlePatientInfoChange("name", e.target.value)
                  }
                  disabled={!!selectedPatientId}
                  className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                    selectedPatientId ? "bg-gray-100 dark:bg-gray-600" : ""
                  }`}
                  placeholder="Enter patient name"
                />
              </div>

              {!selectedPatientId && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        value={patientInfo.dateOfBirth}
                        onChange={(e) =>
                          handleDateOfBirthChange(e.target.value)
                        }
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                          validationErrors.dateOfBirth
                            ? "border-red-500 focus:ring-red-500 focus:border-red-500 dark:border-red-400"
                            : "border-gray-300 dark:border-gray-600"
                        }`}
                      />
                      {validationErrors.dateOfBirth && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {validationErrors.dateOfBirth}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Gender
                      </label>
                      <select
                        value={patientInfo.gender}
                        onChange={(e) =>
                          handlePatientInfoChange("gender", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="">Select</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={patientInfo.phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                        validationErrors.phone
                          ? "border-red-500 focus:ring-red-500 focus:border-red-500 dark:border-red-400"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                      placeholder="XXX-XXX-XXXX"
                    />
                    {validationErrors.phone && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {validationErrors.phone}
                      </p>
                    )}
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes
                </label>
                <textarea
                  value={patientInfo.notes}
                  onChange={(e) =>
                    handlePatientInfoChange("notes", e.target.value)
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Additional notes for this analysis..."
                />
              </div>
            </div>
          </div>

          {/* Analysis Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Analysis Settings
            </h2>

            {currentModel && (
              <div className="mb-4">
                <div className="flex items-center mb-3">
                  <span className="text-2xl mr-3">{currentModel.icon}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {currentModel.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {currentModel.format}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                High accuracy AI model
              </div>
              <div className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                Real-time processing
              </div>
              <div className="flex items-center">
                <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                Detailed confidence scores
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleUpload}
            disabled={
              !selectedFile ||
              isUploading ||
              !patientInfo.name ||
              !currentModel?.available
            }
            className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${
              selectedFile &&
              patientInfo.name &&
              currentModel?.available &&
              !isUploading
                ? "bg-blue-600 dark:bg-blue-600 text-white hover:bg-blue-700 dark:hover:bg-blue-700 shadow-lg hover:shadow-xl"
                : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
            }`}
          >
            {isUploading ? "Analyzing..." : "Start Analysis"}
          </button>  
        </div>
      </div>
    </div>
  );
};

export default Upload;
