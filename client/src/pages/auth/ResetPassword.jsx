import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyPasswordResetOTP, resetPassword, resendPasswordResetOTP } =
    useAuth();

  const [step, setStep] = useState(1); // 1: OTP verification, 2: New password
  const [otp, setOTP] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [email, setEmail] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    // Get email from navigation state
    const stateEmail = location.state?.email;
    if (!stateEmail) {
      navigate("/forgot-password");
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

  const handleOTPSubmit = async (e) => {
    e.preventDefault();
    const otpCode = otp.join("");

    if (otpCode.length !== 6) {
      setError("Please enter complete 6-digit verification code");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await verifyPasswordResetOTP(email, otpCode);
      if (result.success) {
        setStep(2); // Move to password reset step
      } else {
        // Check if user doesn't exist (404 error)
        if (result.statusCode === 404) {
          // Redirect back to forgot password page with error message
          navigate("/forgot-password", {
            state: {
              error:
                "Email address not found. Please check your email and try again.",
              email: email,
            },
          });
          return;
        }

        // Show user-friendly error message for other errors
        setError(
          "Invalid or expired verification code. Please check your code and try again."
        );
        // Clear OTP on error
        setOTP(["", "", "", "", "", ""]);
        const firstInput = document.getElementById("otp-input-0");
        if (firstInput) firstInput.focus();
      }
    } catch (err) {
      // Handle network errors gracefully
      setError(
        "Unable to verify code at the moment. Please check your internet connection and try again."
      );
      setOTP(["", "", "", "", "", ""]);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setFieldErrors({});

    // Validate passwords
    if (newPassword.length < 6) {
      setFieldErrors({
        password: "Password must be at least 6 characters long",
      });
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setFieldErrors({ confirmPassword: "Passwords do not match" });
      setLoading(false);
      return;
    }

    try {
      const result = await resetPassword(email, otp.join(""), newPassword);
      if (result.success) {
        // Show success message and redirect
        setStep(3);
        setTimeout(() => {
          navigate("/signin");
        }, 3000);
      } else {
        // Check if user doesn't exist (404 error)
        if (result.statusCode === 404) {
          // Redirect back to forgot password page with error message
          navigate("/forgot-password", {
            state: {
              error:
                "Email address not found. Please check your email and try again.",
              email: email,
            },
          });
          return;
        }

        setError(
          "Failed to reset password. Please verify your code and try again."
        );
      }
    } catch (err) {
      setError(
        "Unable to reset password at the moment. Please check your internet connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;

    setResendLoading(true);
    setError("");

    try {
      const result = await resendPasswordResetOTP(email);
      if (result.success) {
        setResendTimer(60); // 1 minute cooldown
        setOTP(["", "", "", "", "", ""]);
        const firstInput = document.getElementById("otp-input-0");
        if (firstInput) firstInput.focus();
      } else {
        // Check if user doesn't exist (404 error)
        if (result.statusCode === 404) {
          // Redirect back to forgot password page with error message
          navigate("/forgot-password", {
            state: {
              error:
                "Email address not found. Please check your email and try again.",
              email: email,
            },
          });
          return;
        }

        setError("Failed to resend verification code. Please try again later.");
      }
    } catch (err) {
      setError(
        "Unable to resend code at the moment. Please check your internet connection."
      );
    } finally {
      setResendLoading(false);
    }
  };

  // Success step
  if (step === 3) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
              Password Reset Successful
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Your password has been successfully reset.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Redirecting to sign in page...
            </p>
          </div>
        </div>
      </div>
    );
  }

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
            {step === 1 ? "Verify Your Email" : "Reset Your Password"}
          </h3>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            {step === 1
              ? `We've sent a 6-digit code to ${email}`
              : "Enter your new password below"}
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

          {step === 1 ? (
            // OTP Verification Step
            <form onSubmit={handleOTPSubmit} className="space-y-6">
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
                    "Verify Code"
                  )}
                </button>
              </div>
            </form>
          ) : (
            // Password Reset Step
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  New Password
                </label>
                <div className="mt-1">
                  <input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    disabled={loading}
                    className={`appearance-none block w-full px-3 py-2 border rounded-md placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 disabled:opacity-50 dark:bg-gray-700 dark:text-white ${
                      fieldErrors.password
                        ? "border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500 dark:focus:ring-red-400 dark:focus:border-red-400"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                    placeholder="Enter new password (min 6 characters)"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (fieldErrors.password) {
                        setFieldErrors((prev) => ({ ...prev, password: null }));
                      }
                    }}
                  />
                  {fieldErrors.password && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {fieldErrors.password}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Confirm New Password
                </label>
                <div className="mt-1">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    disabled={loading}
                    className={`appearance-none block w-full px-3 py-2 border rounded-md placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 disabled:opacity-50 dark:bg-gray-700 dark:text-white ${
                      fieldErrors.confirmPassword
                        ? "border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500 dark:focus:ring-red-400 dark:focus:border-red-400"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (fieldErrors.confirmPassword) {
                        setFieldErrors((prev) => ({
                          ...prev,
                          confirmPassword: null,
                        }));
                      }
                    }}
                  />
                  {fieldErrors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {fieldErrors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition disabled:opacity-50"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Resetting...
                    </div>
                  ) : (
                    "Reset Password"
                  )}
                </button>
              </div>
            </form>
          )}

          {step === 1 && (
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
                  : "Resend Code"}
              </button>
            </div>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={() =>
                step === 1 ? navigate("/forgot-password") : setStep(1)
              }
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium text-sm"
            >
              ← {step === 1 ? "Change email address" : "Back to verification"}
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

export default ResetPassword;
