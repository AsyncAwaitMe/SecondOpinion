import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import HistoryService from "../../services/historyService";
import {
  formatNepaliTime,
  formatNepaliDate,
  formatNepaliTimeOnly,
  calculateAgeInNepali,
} from "../../utils/formatters";
import { downloadMedicalReport } from "../../utils/pdfGenerator";

const Results = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [results, setResults] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [statistics, setStatistics] = useState({
    total_predictions: 0,
    by_model_type: {},
    by_status: {},
  });

  // Caching state
  const [allResults, setAllResults] = useState([]); // Cache for all results
  const [lastCacheTime, setLastCacheTime] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [useLocalSearch, setUseLocalSearch] = useState(false);

  const resultsPerPage = 5;
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth/login");
      return;
    }
  }, [isAuthenticated, navigate]);

  // Load data when component mounts or filters change
  useEffect(() => {
    if (isAuthenticated) {
      loadResults();
      loadStatistics();
    }
  }, [isAuthenticated, currentPage, filterType]);

  // Load all data for caching and local search
  useEffect(() => {
    if (
      isAuthenticated &&
      (!lastCacheTime || Date.now() - lastCacheTime > CACHE_DURATION)
    ) {
      loadAllResults();
    }
  }, [isAuthenticated]);

  // Handle search with hybrid approach
  useEffect(() => {
    if (!searchQuery.trim()) {
      setIsSearching(false);
      setUseLocalSearch(false);
      if (isAuthenticated) {
        setCurrentPage(1);
        loadResults();
      }
      return;
    }

    setIsSearching(true);

    const delayedSearch = setTimeout(() => {
      if (isAuthenticated) {
        setCurrentPage(1);
        // Use local search if we have cached data, otherwise use backend search
        if (
          allResults.length > 0 &&
          Date.now() - lastCacheTime < CACHE_DURATION
        ) {
          performLocalSearch();
        } else {
          setUseLocalSearch(false);
          loadResults(); // This will use backend search
        }
      }
    }, 300); // Reduced debounce for better UX

    return () => clearTimeout(delayedSearch);
  }, [searchQuery]);

  // Handle sorting changes
  useEffect(() => {
    if (isAuthenticated) {
      if (useLocalSearch || (allResults.length > 0 && searchQuery.trim())) {
        // Use local search/sort for cached data
        performLocalSearch();
      } else {
        // For backend results, sort the current results and reload if needed
        if (results.length > 0) {
          const sortedResults = sortResults([...results]);
          setResults(sortedResults);
        } else {
          // Reload with current filters
          loadResults();
        }
      }
    }
  }, [sortBy]);

  // Handle pagination for local search
  useEffect(() => {
    if (useLocalSearch && searchQuery.trim()) {
      performLocalSearch();
    }
  }, [currentPage, useLocalSearch]);

  const loadAllResults = async () => {
    try {
      // Load a larger batch for caching (e.g., first 100 results)
      const response = await HistoryService.getPredictionHistory(1, 100, {});

      // Transform and cache the results
      const transformedResults = response.results.map((result) => ({
        id: result.id,
        patientName: result.patient.full_name,
        patientId: `PT-${String(result.patient.id).padStart(6, "0")}`,
        age: result.patient.date_of_birth
          ? calculateAgeInNepali(result.patient.date_of_birth)
          : "N/A",
        analysisType: getAnalysisTypeDisplay(result.model_type),
        result: result.prediction,
        confidence: Math.round(result.confidence * 100),
        date: formatNepaliDate(result.created_at),
        time: formatNepaliTimeOnly(result.created_at),
        status: result.status,
        model_type: result.model_type,
        notes: result.notes,
        entropy: result.entropy,
        probabilities: result.probabilities,
        patient: result.patient,
        image_filename: result.image_filename,
        message: result.message,
        created_at: result.created_at,
      }));

      setAllResults(transformedResults);
      setLastCacheTime(Date.now());

      // Store in localStorage for persistence across sessions
      localStorage.setItem(
        "resultsCache",
        JSON.stringify({
          data: transformedResults,
          timestamp: Date.now(),
          user_id: user?.id,
        })
      );
    } catch (error) {
      console.error("Failed to load all results for cache:", error);
    }
  };

  // Helper function to sort results
  const sortResults = (resultsToSort) => {
    return [...resultsToSort].sort((a, b) => {
      switch (sortBy) {
        case "date":
          return new Date(b.created_at) - new Date(a.created_at);
        case "patient":
          return a.patientName.localeCompare(b.patientName);
        case "confidence":
          return b.confidence - a.confidence;
        case "result":
          return a.result.localeCompare(b.result);
        default:
          return 0;
      }
    });
  };

  const performLocalSearch = () => {
    setUseLocalSearch(true);
    setLoading(true);

    // Filter by type
    let filteredResults = allResults;
    if (filterType !== "all") {
      if (filterType === "brain") {
        filteredResults = filteredResults.filter(
          (r) => r.model_type === "tumor"
        );
      } else if (filterType === "pneumonia") {
        filteredResults = filteredResults.filter(
          (r) => r.model_type === "chest_xray"
        );
      }
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filteredResults = filteredResults.filter(
        (result) =>
          result.patientName.toLowerCase().includes(query) ||
          result.patientId.toLowerCase().includes(query) ||
          result.analysisType.toLowerCase().includes(query) ||
          result.result.toLowerCase().includes(query) ||
          (result.notes && result.notes.toLowerCase().includes(query))
      );
    }

    // Apply sorting using the helper function
    const sortedResults = sortResults(filteredResults);

    // Apply pagination
    const startIndex = (currentPage - 1) * resultsPerPage;
    const endIndex = startIndex + resultsPerPage;
    const paginatedResults = sortedResults.slice(startIndex, endIndex);

    setResults(paginatedResults);
    setTotalResults(sortedResults.length);
    setTotalPages(Math.ceil(sortedResults.length / resultsPerPage));
    setLoading(false);
    setIsSearching(false);
  };

  // Load cache from localStorage on component mount
  useEffect(() => {
    if (isAuthenticated) {
      const cached = localStorage.getItem("resultsCache");
      if (cached) {
        try {
          const cacheData = JSON.parse(cached);
          // Check if cache is valid (same user and not expired)
          if (
            cacheData.user_id === user?.id &&
            Date.now() - cacheData.timestamp < CACHE_DURATION
          ) {
            setAllResults(cacheData.data);
            setLastCacheTime(cacheData.timestamp);
          } else {
            // Clear expired cache
            localStorage.removeItem("resultsCache");
          }
        } catch (error) {
          console.error("Failed to parse cache:", error);
          localStorage.removeItem("resultsCache");
        }
      }
    }
  }, [isAuthenticated, user?.id]);

  const loadResults = async () => {
    // Skip if we're actively using local search and have results
    if (useLocalSearch && searchQuery.trim() && results.length > 0) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setUseLocalSearch(false);

      const filters = {};
      if (filterType !== "all") {
        if (filterType === "brain") {
          filters.model_type = "tumor";
        } else if (filterType === "pneumonia") {
          filters.model_type = "chest_xray";
        }
      }

      // Add search parameter if provided
      if (searchQuery.trim()) {
        filters.search = searchQuery.trim();
      }

      const response = await HistoryService.getPredictionHistory(
        currentPage,
        resultsPerPage,
        filters
      );

      // Transform backend data to frontend format
      const transformedResults = response.results.map((result) => ({
        id: result.id,
        patientName: result.patient.full_name,
        patientId: `PT-${String(result.patient.id).padStart(6, "0")}`,
        age: result.patient.date_of_birth
          ? calculateAgeInNepali(result.patient.date_of_birth)
          : "N/A",
        analysisType: getAnalysisTypeDisplay(result.model_type),
        result: result.prediction,
        confidence: Math.round(result.confidence * 100),
        date: formatNepaliDate(result.created_at),
        time: formatNepaliTimeOnly(result.created_at),
        status: result.status,
        model_type: result.model_type,
        notes: result.notes,
        entropy: result.entropy,
        probabilities: result.probabilities,
        patient: result.patient,
        image_filename: result.image_filename,
        message: result.message,
        created_at: result.created_at,
      }));

      // Apply sorting to the transformed results
      const sortedResults = sortResults(transformedResults);

      setResults(sortedResults);
      setTotalResults(response.total);
      setTotalPages(response.total_pages);
    } catch (err) {
      console.error("Failed to load results:", err);
      setError("Failed to load analysis results. Please try again.");
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const stats = await HistoryService.getPredictionStatistics();
      setStatistics(stats);
    } catch (err) {
      console.error("Failed to load statistics:", err);
    }
  };

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

  const getResultColor = (result) => {
    const resultLower = result.toLowerCase();
    if (resultLower.includes("normal")) {
      return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300";
    } else if (
      resultLower.includes("glioma") ||
      resultLower.includes("meningioma") ||
      resultLower.includes("pituitary") ||
      resultLower.includes("pneumonia")
    ) {
      return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300";
    } else if (resultLower.includes("detected")) {
      return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300";
    } else if (
      resultLower.includes("suspicious") ||
      resultLower.includes("low confidence")
    ) {
      return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300";
    } else if (resultLower.includes("uncertain")) {
      return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300";
    } else {
      return "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300";
    }
  };

  const getAnalysisIcon = (type) => {
    switch (type.toLowerCase()) {
      case "brain tumor detection":
        return "🧠";
      case "pneumonia detection":
        return "🫁";
      case "breast cancer detection":
        return "🩺";
      case "skin cancer detection":
        return "🔬";
      default:
        return "🧠";
    }
  };

  // Filter and sort results - Remove client-side filtering since backend handles pagination
  const displayResults = results; // Use results directly from backend

  // Calculate display statistics from current page results
  const displayStats = {
    total: totalResults, // Use total from backend
    normal: results.filter((r) => r.result.toLowerCase().includes("normal"))
      .length,
    detected: results.filter((r) => !r.result.toLowerCase().includes("normal"))
      .length,
    avgConfidence:
      results.length > 0
        ? Math.round(
            results.reduce((sum, r) => sum + r.confidence, 0) / results.length
          )
        : 0,
  };

  const handleResultClick = (result) => {
    // Navigate directly to result details - no localStorage needed
    navigate(`/results/details/${result.id}`);
  };

  const handleDownloadPDF = async (result, event) => {
    event.stopPropagation();
    try {
      // Show loading state
      const button = event.target;
      const originalText = button.textContent;
      button.textContent = "Downloading...";
      button.disabled = true;

      // Prepare result data with findings and recommendations
      const resultWithExtras = {
        ...result,
        findings: generateFindings(result),
        recommendations: generateRecommendations(result),
      };

      await downloadMedicalReport(resultWithExtras);

      // Reset button state
      button.textContent = originalText;
      button.disabled = false;
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert("Failed to download PDF report. Please try again.");

      // Reset button state
      const button = event.target;
      button.textContent = "Download";
      button.disabled = false;
    }
  };

  const generateFindings = (result) => {
    const findings = [];
    if (result.result === "Normal Brain") {
      findings.push("No tumor detected");
      findings.push("Normal brain tissue structure");
    } else if (result.result.includes("Glioma")) {
      findings.push(`${result.result} detected`);
      findings.push("Requires further evaluation");
    } else if (result.result.includes("Meningioma")) {
      findings.push(`${result.result} detected`);
      findings.push("Requires surgical consultation");
    } else if (result.result.includes("Pituitary")) {
      findings.push(`${result.result} detected`);
      findings.push("Endocrine evaluation needed");
    } else {
      findings.push(`Detection result: ${result.result}`);
      findings.push(`Confidence level: ${result.confidence}%`);
    }
    if (result.message) {
      findings.push(result.message);
    }
    return findings;
  };

  const generateRecommendations = (result) => {
    const recommendations = [];
    if (result.result === "Normal Brain") {
      recommendations.push("Continue routine monitoring");
      recommendations.push("No immediate intervention needed");
    } else if (
      result.result.includes("Tumor") ||
      result.result.includes("tumor")
    ) {
      recommendations.push("Immediate medical consultation recommended");
      recommendations.push("Additional imaging studies may be required");
    } else if (
      result.result === "Low Confidence" ||
      result.result === "Uncertain/Unrelated"
    ) {
      recommendations.push("Image quality assessment needed");
      recommendations.push("Consider retaking the scan");
    } else {
      recommendations.push("Follow up with healthcare provider");
      recommendations.push("Consider additional diagnostic tests");
    }
    return recommendations;
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    // Note: useEffect will handle triggering the appropriate search/load
  };

  if (loading) {
    return (
      <div className="p-6 dark:bg-gray-900 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 dark:border-blue-400"></div>
          <span className="ml-4 text-lg text-gray-600 dark:text-gray-300">
            Loading results...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 dark:bg-gray-900 min-h-screen">
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-4">
          <div className="text-red-800 dark:text-red-300 font-medium">
            Error Loading Results
          </div>
          <div className="text-red-600 dark:text-red-400 text-sm mt-1">
            {error}
          </div>
          <button
            onClick={() => loadResults()}
            className="mt-3 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Analysis Results
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              View and manage all medical analysis results
            </p>
          </div>

          <div className="flex flex-col items-end space-y-3">
            {/* Cache Status */}
            <div className="flex items-center space-x-2 text-sm">
              {useLocalSearch && (
                <span className="flex items-center bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-3 py-1 rounded-full border border-green-200 dark:border-green-700">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Local Search Active
                </span>
              )}
              {allResults.length > 0 && lastCacheTime && (
                <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-700">
                  <span className="font-medium">{allResults.length}</span> items
                  cached •
                  <span className="text-blue-600 dark:text-blue-400">
                    {Math.round((Date.now() - lastCacheTime) / 60000)}m ago
                  </span>
                </div>
              )}
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => {
                // Clear cache and reload
                localStorage.removeItem("resultsCache");
                setAllResults([]);
                setLastCacheTime(null);
                setUseLocalSearch(false);
                loadResults();
                loadAllResults();
              }}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all duration-200"
            >
              <span className="mr-2">🔄</span>
              {loading ? "Refreshing..." : "Refresh Data"}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Total Analyses
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {displayStats.total}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <span className="text-2xl">📊</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Normal Results
              </p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                {displayStats.normal}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <span className="text-2xl">✅</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Detected Cases
              </p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                {displayStats.detected}
              </p>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <span className="text-2xl">⚠️</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Avg Confidence
              </p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {displayStats.avgConfidence}%
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <span className="text-2xl">🎯</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search Results
              {isSearching && (
                <span className="ml-2 text-blue-600 dark:text-blue-400 text-xs">
                  Searching...
                </span>
              )}
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by patient name, ID, or analysis type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:focus:ring-blue-400 dark:focus:border-blue-400 pr-10"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setUseLocalSearch(false);
                    setIsSearching(false);
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Filter by Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Filter by Type
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:focus:ring-blue-400 dark:focus:border-blue-400"
            >
              <option value="all">All Types</option>
              <option value="brain">Brain Tumor</option>
              <option value="pneumonia" disabled>
                Pneumonia (Coming Soon)
              </option>
              <option value="breast" disabled>
                Breast Cancer (Coming Soon)
              </option>
              <option value="skin" disabled>
                Skin Cancer (Coming Soon)
              </option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:focus:ring-blue-400 dark:focus:border-blue-400"
            >
              <option value="date">Date (Newest)</option>
              <option value="patient">Patient Name</option>
              <option value="confidence">Confidence</option>
              <option value="result">Result</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Analysis History ({totalResults} total results)
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Analysis Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Result
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Confidence
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {displayResults.map((result) => (
                <tr
                  key={result.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                  onClick={() => handleResultClick(result)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mr-3">
                        <span className="text-blue-600 dark:text-blue-400 font-semibold text-sm">
                          {result.patientName[0]}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {result.patientName}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {result.patientId} • Age {result.age}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-lg mr-2">
                        {getAnalysisIcon(result.analysisType)}
                      </span>
                      <span className="text-sm text-gray-900 dark:text-white">
                        {result.analysisType}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getResultColor(
                        result.result
                      )}`}
                    >
                      {result.result}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className={`h-2 rounded-full ${
                            result.confidence >= 90
                              ? "bg-green-500"
                              : result.confidence >= 75
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          }`}
                          style={{ width: `${result.confidence}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {result.confidence}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <div>{result.date}</div>
                    <div className="text-gray-500 dark:text-gray-400">
                      {result.time}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleResultClick(result);
                      }}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 mr-3"
                    >
                      View
                    </button>
                    <button
                      onClick={(e) => handleDownloadPDF(result, e)}
                      className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 disabled:opacity-50"
                    >
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {displayResults.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No results found
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              {searchQuery || filterType !== "all"
                ? "Try adjusting your search or filter criteria"
                : "Start your first analysis to see results here"}
            </p>
            {!searchQuery && filterType === "all" && (
              <button
                onClick={() => navigate("/upload")}
                className="mt-4 bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 dark:hover:bg-blue-600 transition"
              >
                Start Analysis
              </button>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {(currentPage - 1) * resultsPerPage + 1} to{" "}
              {Math.min(currentPage * resultsPerPage, totalResults)} of{" "}
              {totalResults} results
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              {/* First page */}
              {currentPage > 3 && (
                <>
                  <button
                    onClick={() => handlePageChange(1)}
                    className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    1
                  </button>
                  {currentPage > 4 && (
                    <span className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                      ...
                    </span>
                  )}
                </>
              )}

              {/* Current page and surrounding pages */}
              {[...Array(totalPages)].map((_, index) => {
                const page = index + 1;
                if (page >= currentPage - 2 && page <= currentPage + 2) {
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        page === currentPage
                          ? "bg-blue-600 dark:bg-blue-500 text-white"
                          : "text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
                      }`}
                    >
                      {page}
                    </button>
                  );
                }
                return null;
              })}

              {/* Last page */}
              {currentPage < totalPages - 2 && (
                <>
                  {currentPage < totalPages - 3 && (
                    <span className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                      ...
                    </span>
                  )}
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    {totalPages}
                  </button>
                </>
              )}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Results;
