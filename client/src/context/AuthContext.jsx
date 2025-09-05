import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      verifyToken();
    } else {
      setLoading(false);
    }
  }, [token]);

  const verifyToken = async () => {
    try {
      const response = await fetch("http://localhost:8000/auth/verify-token", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        logout();
      }
    } catch (error) {
      console.error("Token verification failed:", error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await fetch("http://localhost:8000/auth/login-json", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        const { access_token } = data;

        localStorage.setItem("token", access_token);
        setToken(access_token);

        // Get user data
        const userResponse = await fetch("http://localhost:8000/auth/me", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${access_token}`,
            "Content-Type": "application/json",
          },
        });

        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUser(userData);
        }

        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.detail || "Login failed" };
      }
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: "Network error" };
    }
  };

  const register = async (fullName, email, password) => {
    try {
      const response = await fetch("http://localhost:8000/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: fullName,
          email,
          password,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          email: data.email,
          requiresVerification: data.requires_verification,
        };
      } else {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.detail || "Registration failed",
        };
      }
    } catch (error) {
      console.error("Registration error:", error);
      return { success: false, error: "Network error" };
    }
  };

  const verifyOTP = async (email, otpCode) => {
    try {
      const response = await fetch("http://localhost:8000/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          otp_code: otpCode,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const { access_token } = data;

        localStorage.setItem("token", access_token);
        setToken(access_token);

        // Get user data
        const userResponse = await fetch("http://localhost:8000/auth/me", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${access_token}`,
            "Content-Type": "application/json",
          },
        });

        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUser(userData);
        }

        return { success: true };
      } else {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.detail || "OTP verification failed",
        };
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      return { success: false, error: "Network error" };
    }
  };

  const resendOTP = async (email) => {
    try {
      const response = await fetch("http://localhost:8000/auth/resend-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        return { success: true };
      } else {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.detail || "Failed to resend OTP",
        };
      }
    } catch (error) {
      console.error("Resend OTP error:", error);
      return { success: false, error: "Network error" };
    }
  };

  const sendPasswordResetOTP = async (email) => {
    try {
      const response = await fetch(
        "http://localhost:8000/auth/forgot-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        }
      );

      if (response.ok) {
        return { success: true };
      } else {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.detail || "Failed to send reset code",
          statusCode: response.status,
        };
      }
    } catch (error) {
      console.error("Send password reset OTP error:", error);
      return { success: false, error: "Network error" };
    }
  };

  const verifyPasswordResetOTP = async (email, otpCode) => {
    try {
      const response = await fetch(
        "http://localhost:8000/auth/verify-reset-otp",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            otp_code: otpCode,
          }),
        }
      );

      if (response.ok) {
        return { success: true };
      } else {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.detail || "Invalid verification code",
          statusCode: response.status,
        };
      }
    } catch (error) {
      console.error("Verify password reset OTP error:", error);
      return { success: false, error: "Network error" };
    }
  };

  const resetPassword = async (email, otpCode, newPassword) => {
    try {
      const response = await fetch(
        "http://localhost:8000/auth/reset-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            otp_code: otpCode,
            new_password: newPassword,
          }),
        }
      );

      if (response.ok) {
        return { success: true };
      } else {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.detail || "Password reset failed",
          statusCode: response.status,
        };
      }
    } catch (error) {
      console.error("Reset password error:", error);
      return { success: false, error: "Network error" };
    }
  };

  const resendPasswordResetOTP = async (email) => {
    try {
      const response = await fetch(
        "http://localhost:8000/auth/resend-reset-otp",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        }
      );

      if (response.ok) {
        return { success: true };
      } else {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.detail || "Failed to resend reset code",
          statusCode: response.status,
        };
      }
    } catch (error) {
      console.error("Resend password reset OTP error:", error);
      return { success: false, error: "Network error" };
    }
  };

  const updateUser = (updatedUserData) => {
    setUser(updatedUserData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    verifyOTP,
    resendOTP,
    sendPasswordResetOTP,
    verifyPasswordResetOTP,
    resetPassword,
    resendPasswordResetOTP,
    updateUser,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
