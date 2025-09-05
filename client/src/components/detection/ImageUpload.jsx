import React, { useState, useCallback } from "react";

const ImageUpload = ({
  onFileSelect,
  selectedFile,
  clearFile,
  disabled = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback(
    (e) => {
      e.preventDefault();
      if (!disabled) {
        setIsDragOver(true);
      }
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragOver(false);

      if (disabled) return;

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFileSelection(files[0]);
      }
    },
    [disabled]
  );

  const handleFileSelection = (file) => {
    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      alert("Please upload a valid image file (JPEG, JPG, or PNG)");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB");
      return;
    }

    onFileSelect(file);
  };

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelection(file);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ${
        disabled
          ? "border-gray-200 bg-gray-50 cursor-not-allowed"
          : isDragOver
          ? "border-blue-500 bg-blue-50"
          : selectedFile
          ? "border-green-500 bg-green-50"
          : "border-gray-300 hover:border-gray-400 cursor-pointer"
      }`}
    >
      {selectedFile ? (
        <div>
          <div className="text-6xl mb-4">✅</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            File Selected
          </h3>
          <p className="text-gray-600 mb-2">{selectedFile.name}</p>
          <p className="text-sm text-gray-500 mb-4">
            Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
          </p>
          {!disabled && (
            <button
              onClick={clearFile}
              className="text-red-600 hover:text-red-700 font-medium"
            >
              Remove File
            </button>
          )}
        </div>
      ) : (
        <div>
          <div className="text-6xl mb-4">🧠</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Drop your brain scan here
          </h3>
          <p className="text-gray-600 mb-4">or click to browse files</p>
          <p className="text-sm text-gray-500 mb-4">
            Supported formats: JPEG, JPG, PNG • Max size: 10MB
          </p>
          {!disabled && (
            <>
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                onChange={handleFileInput}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={disabled}
              />
              <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Browse Files
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
