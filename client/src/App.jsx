import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import ProtectedRoute from "./components/common/ProtectedRoute";
import Home from "./pages/public/Home";
import Welcome from "./pages/public/Welcome";
import SignIn from "./pages/auth/SignIn";
import SignUp from "./pages/auth/SignUp";
import OTPVerification from "./pages/auth/OTPVerification";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import Layout from "./pages/public/Layout";
import DashboardLayout from "./layouts/DashboardLayout";
import Dashboard from "../src/pages/Models/Dashboard";
import ModelSelection from "./pages/Models/ModelSelection";
import Upload from "./pages/Upload/Upload";
import Results from "./pages/Results/Results";
import ResultDetails from "./pages/detection/ResultDetails";
import TumorPrediction from "./pages/detection/TumorPrediction";
import BreastCancer from "./pages/detection/BreastCancer";
import SkinCancer from "./pages/detection/SkinCancer";
import PneumoniaDetection from "./pages/detection/PneumoniaDetection";
import Settings from "./pages/Settings/Settings";

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="welcome" element={<Welcome />} />
              <Route path="home" element={<Home />} />
              <Route path="about" element={<div>About Page</div>} />
            </Route>

            {/* Protected routes with dashboard layout */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Dashboard />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/models"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <ModelSelection />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/upload"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Upload />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/results"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Results />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/results/details/:resultId"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <ResultDetails />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/results/:id"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <ResultDetails />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/detection/mri"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <TumorPrediction />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/detection/breast"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <BreastCancer />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/detection/skin"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <SkinCancer />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/detection/pneumonia"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <PneumoniaDetection />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Settings />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Auth pages without layout (no header/footer) */}
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/verify-otp" element={<OTPVerification />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
