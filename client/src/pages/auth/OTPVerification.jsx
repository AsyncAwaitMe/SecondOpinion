import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const OTPVerification = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyOTP, resendOTP } = useAuth();

  const [otp, setOTP] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [email, setEmail] = useState("");

  useEffect(() => {
    // Get email from navigation state
    const stateEmail = location.state?.email;
    if (!stateEmail) {
      navigate("/signup");
      return;
    }
    setEmail(stateEmail);
  }, [location.state, navigate]);

  useEffect(() => {
    // Timer for resend button
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleOTPChange = (index, value) => {
    if (value.length > 1) return; // Prevent multiple digits

    const newOTP = [...otp];
    newOTP[index] = value;
    setOTP(newOTP);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }

    // Clear error when user starts typing
    if (error) setError("");
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    if (/^\d+$/.test(pastedData)) {
      const newOTP = pastedData.split("").concat(Array(6).fill("")).slice(0, 6);
      setOTP(newOTP);

      // Focus last filled input or next empty one
      const lastIndex = Math.min(pastedData.length - 1, 5);
      const lastInput = document.getElementById(`otp-input-${lastIndex}`);
      if (lastInput) lastInput.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpCode = otp.join("");

    if (otpCode.length !== 6) {
      setError("Please enter complete 6-digit OTP");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await verifyOTP(email, otpCode);
      if (result.success) {
        navigate("/dashboard");
      } else {
        setError(result.error);
        // Clear OTP on error
        setOTP(["", "", "", "", "", ""]);
        const firstInput = document.getElementById("otp-input-0");
        if (firstInput) firstInput.focus();
      }
    } catch (err) {
      setError("Verification failed. Please try again.");
      setOTP(["", "", "", "", "", ""]);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;

    setResendLoading(true);
    setError("");

    try {
      const result = await resendOTP(email);
      if (result.success) {
        setResendTimer(60); // 1 minute cooldown
        setOTP(["", "", "", "", "", ""]);
        const firstInput = document.getElementById("otp-input-0");
        if (firstInput) firstInput.focus();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("Failed to resend OTP. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Header with logo */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <svg
              width="64"
              height="64"
              viewBox="0 0 200 200"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="100" cy="100" r="90" fill="#f0f4f8" />
              <text
                x="50%"
                y="50%"
                textAnchor="middle"
                dominantBaseline="middle"
                fontFamily="Arial, sans-serif"
                fontSize="80"
                fontWeight="bold"
                fill="#0070c0"
              >
                S
              </text>
              <text
                x="50%"
                y="50%"
                dy="30"
                textAnchor="middle"
                dominantBaseline="middle"
                fontFamily="Arial, sans-serif"
                fontSize="80"
                fontWeight="bold"
                fill="#c00000"
              >
                O
              </text>
              <path
                d="M50 140 C80 160, 120 160, 150 140"
                stroke="#0070c0"
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
            Second Opinion
          </h2>
          <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Email Verification
          </h3>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            We've sent a 6-digit code to{" "}
            <span className="font-medium text-gray-900 dark:text-white">
              {email}
            </span>
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow-lg sm:rounded-lg sm:px-10 border dark:border-gray-700">
          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 text-center">
                Enter 6-digit verification code
              </label>

              <div
                className="flex justify-center space-x-2"
                onPaste={handlePaste}
              >
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-input-${index}`}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOTPChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    disabled={loading}
                    className="w-12 h-12 text-center text-lg font-semibold border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 disabled:opacity-50 dark:bg-gray-700 dark:text-white"
                    autoComplete="off"
                  />
                ))}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || otp.join("").length !== 6}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Verifying...
                  </div>
                ) : (
                  "Verify Email"
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Didn't receive the code?
            </p>
            <button
              onClick={handleResendOTP}
              disabled={resendLoading || resendTimer > 0}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resendLoading
                ? "Sending..."
                : resendTimer > 0
                ? `Resend in ${resendTimer}s`
                : "Resend OTP"}
            </button>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate("/signup")}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium text-sm"
            >
              ← Change email address
            </button>
          </div>
        </div>
      </div>

      {/* Back to home link */}
      <div className="mt-8 text-center">
        <button
          onClick={() => navigate("/")}
          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium"
        >
          ← Back to home
        </button>
      </div>
    </div>
  );
};

export default OTPVerification;
