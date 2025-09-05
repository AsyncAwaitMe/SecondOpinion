import ApiService from "./api.js";

class ShareService {
  /**
   * Share a medical report with a doctor via email
   * @param {Object} shareData - The sharing request data
   * @param {number} shareData.prediction_id - ID of the prediction to share
   * @param {string} shareData.doctor_email - Doctor's email address
   * @param {string} shareData.doctor_name - Doctor's name
   * @param {string} shareData.sender_name - Name of person sharing (optional)
   * @param {string} shareData.notes - Additional notes (optional)
   * @param {boolean} shareData.include_pdf - Whether to include PDF attachment
   * @returns {Promise<Object>} Response from the API
   */
  async shareReport(shareData) {
    try {
      const response = await ApiService.post("/share/share-report", shareData);
      return response;
    } catch (error) {
      console.error("Failed to share report:", error);
      throw new Error(
        error.response?.data?.detail ||
          error.message ||
          "Failed to share medical report. Please try again."
      );
    }
  }

  /**
   * Validate email address format
   * @param {string} email - Email to validate
   * @returns {boolean} Whether email is valid
   */
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate sharing form data
   * @param {Object} formData - Form data to validate
   * @returns {Object} Validation result with isValid boolean and errors array
   */
  validateShareForm(formData) {
    const errors = [];

    if (!formData.doctor_name || formData.doctor_name.trim().length < 2) {
      errors.push("Doctor's name must be at least 2 characters long");
    }

    if (!formData.doctor_email || !this.validateEmail(formData.doctor_email)) {
      errors.push("Please enter a valid email address");
    }

    if (formData.notes && formData.notes.length > 1000) {
      errors.push("Notes must be less than 1000 characters");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

export default new ShareService();
