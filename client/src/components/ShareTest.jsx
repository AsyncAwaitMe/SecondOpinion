import React, { useState } from "react";
import ShareModal from "./ShareModal";

const ShareTest = () => {
  const [showModal, setShowModal] = useState(false);

  // Mock result data for testing
  const mockResult = {
    id: "test-123",
    result: "Normal Brain",
    prediction: "Normal Brain",
    confidence: 94,
    created_at: "2025-01-17T10:30:00Z",
    completedAt: "2025-01-17T10:30:00Z",
  };

  const mockPatient = {
    full_name: "Test Patient",
    email: "test@example.com",
    phone: "9800000000",
  };

  return (
    <div className="p-8 min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          📧 Email Sharing Test
        </h1>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Test Share with Doctor Feature
          </h2>

          <div className="space-y-4 mb-6">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
                Mock Result Data:
              </h3>
              <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                <li>
                  <strong>Patient:</strong> {mockPatient.full_name}
                </li>
                <li>
                  <strong>Result:</strong> {mockResult.result}
                </li>
                <li>
                  <strong>Confidence:</strong> {mockResult.confidence}%
                </li>
                <li>
                  <strong>Test ID:</strong> {mockResult.id}
                </li>
              </ul>
            </div>

            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <h3 className="font-semibold text-green-900 dark:text-green-300 mb-2">
                Email Features to Test:
              </h3>
              <ul className="text-sm text-green-800 dark:text-green-300 space-y-1 list-disc list-inside">
                <li>Professional email template with medical styling</li>
                <li>Form validation for doctor details</li>
                <li>Optional PDF attachment</li>
                <li>Additional notes field</li>
                <li>Success/error handling</li>
              </ul>
            </div>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center font-medium"
          >
            <span className="mr-2">📧</span>
            Test Share with Doctor
          </button>
        </div>

        <div className="mt-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex items-start">
            <span className="text-amber-600 dark:text-amber-400 mr-2 mt-0.5">
              ℹ️
            </span>
            <div>
              <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                Testing Notes
              </h4>
              <p className="text-sm text-amber-800 dark:text-amber-200">
                This test page validates the email sharing functionality. Make
                sure your backend server is running with proper SMTP
                configuration in the .env file. Use real email addresses to test
                email delivery.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        resultData={mockResult}
        patientData={mockPatient}
      />
    </div>
  );
};

export default ShareTest;
