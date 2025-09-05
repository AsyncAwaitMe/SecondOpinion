import React from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/common/Header";

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4 text-center">
          Welcome to <span className="text-blue-600">Second Opinion</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-600 max-w-xl text-center mb-8">
          Second Opinion is an app that lets you upload your MRI scans to
          predict or classify tumors in the brain. Get a fast, AI-powered second
          opinion to help you and your doctor make informed decisions.
        </p>
        <div className="flex gap-4">
          <button
            className="px-6 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
            onClick={() => navigate("/signin")}
          >
            Sign In
          </button>
          <button
            className="px-6 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700 transition"
            onClick={() => navigate("/signup")}
          >
            Sign Up
          </button>
        </div>
      </div>
    </>
  );
};

export default Welcome;
