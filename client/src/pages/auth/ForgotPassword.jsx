import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { validateEmail } from "../../utils/validation";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { sendPasswordResetOTP } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Handle redirect from ResetPassword component with error
  useEffect(() => {
    if (location.state?.error) {
      setError(location.state.error);
      if (location.state.email) {
        setEmail(location.state.email);
        setTouched({ email: true });
      }
      // Clear the navigation state to prevent showing error again on refresh
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, navigate, location.pathname]);

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);

    // Clear error when user starts typing
    if (error) {
      setError("");
    }

    // Validate email in real-time if it has been touched
    if (touched.email) {
      validateField("email", value);
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));
    validateField(name, value);
  };

  const validateField = (fieldName, value) => {
    let validation = { isValid: true, error: null };

    if (fieldName === "email") {
      validation = validateEmail(value);
    }

    setFieldErrors((prev) => ({
      ...prev,
      [fieldName]: validation.error,
    }));

    return validation.isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    // Validate email
    if (!validateField("email", email)) {
      setLoading(false);
      setTouched({ email: true });
      return;
    }

    try {
      const result = await sendPasswordResetOTP(email.trim().toLowerCase());

      if (result.success) {
        // Show success and navigate to reset password page
        setSuccess(true);

        // Navigate to reset password page with email after delay
        setTimeout(() => {
          navigate("/reset-password", {
            state: { email: email.trim().toLowerCase() },
          });
        }, 10000); // 10 seconds
      } else {
        // Handle specific error cases
        if (result.statusCode === 404) {
          setError(
            "Email address not found. Please check your email or sign up for an account."
          );
        } else if (result.statusCode === 429) {
          setError("Too many reset requests. Please try again later.");
        } else if (
          result.statusCode === 400 &&
          result.error.includes("not verified")
        ) {
          setError(
            "Your account is not verified. Please check your email for verification instructions."
          );
        } else {
          setError(
            result.error || "Failed to send reset code. Please try again."
          );
        }
      }
    } catch (err) {
      setError(
        "Network error. Please check your internet connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
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
            <h2 className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
              Check Your Email
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              If an account with{" "}
              <span className="font-medium text-gray-900 dark:text-white">
                {email}
              </span>{" "}
              exists, you will receive a password reset code shortly.
            </p>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-blue-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    <strong>Important:</strong> For security reasons, we don't
                    confirm whether an email address is registered with us. If
                    you don't receive an email within a few minutes, please
                    check your spam folder or try a different email address.
                  </p>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Please proceed to enter the verification code...
            </p>
            <div className="mt-6">
              <button
                onClick={() =>
                  navigate("/reset-password", {
                    state: { email: email.trim().toLowerCase() },
                  })
                }
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
              >
                Enter Verification Code
              </button>
            </div>
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
            Reset your password
          </h3>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Enter your email address and we'll send you a verification code
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow-lg sm:rounded-lg sm:px-10 border dark:border-gray-700">
          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  disabled={loading}
                  className={`appearance-none block w-full px-3 py-2 border rounded-md placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 disabled:opacity-50 dark:bg-gray-700 dark:text-white ${
                    fieldErrors.email
                      ? "border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500 dark:focus:ring-red-400 dark:focus:border-red-400"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                  placeholder="Enter your email address"
                  value={email}
                  onChange={handleEmailChange}
                  onBlur={handleBlur}
                />
                {fieldErrors.email && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {fieldErrors.email}
                  </p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </div>
                ) : (
                  "Send Reset Code"
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate("/signin")}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium text-sm"
            >
              ← Back to sign in
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

export default ForgotPassword;
