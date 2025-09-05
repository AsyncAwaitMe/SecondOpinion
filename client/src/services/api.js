// Base API service
const API_BASE_URL = "http://localhost:8000";

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  getAuthHeaders() {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async post(endpoint, data, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      method: "POST",
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers,
      },
      ...options,
    };

    if (data instanceof FormData) {
      // Don't set Content-Type for FormData, let browser set it with boundary
      config.body = data;
    } else {
      config.headers = {
        "Content-Type": "application/json",
        ...config.headers,
      };
      config.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // Create a proper error object that preserves the response data
        const error = new Error(
          typeof errorData.detail === "string"
            ? errorData.detail
            : errorData.message || `HTTP error! status: ${response.status}`
        );
        error.response = {
          status: response.status,
          statusText: response.statusText,
          data: errorData,
        };
        throw error;
      }

      return await response.json();
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }

  async get(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...this.getAuthHeaders(),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `HTTP error! status: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }

  async put(endpoint, data, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...this.getAuthHeaders(),
        ...options.headers,
      },
      body: JSON.stringify(data),
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `HTTP error! status: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }

  async delete(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...this.getAuthHeaders(),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `HTTP error! status: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }

  // Patient Management
  async createPatient(patientData) {
    return this.post("/history/patients", patientData);
  }

  async getPatients(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/history/patients${queryString ? `?${queryString}` : ""}`);
  }

  async getPatient(patientId) {
    return this.get(`/history/patients/${patientId}`);
  }

  async updatePatient(patientId, patientData) {
    return this.put(`/history/patients/${patientId}`, patientData);
  }

  async deletePatient(patientId) {
    return this.delete(`/history/patients/${patientId}`);
  }

  // Prediction History
  async getPredictionHistory(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(
      `/history/predictions/history${queryString ? `?${queryString}` : ""}`
    );
  }

  async getPredictionResult(resultId) {
    return this.get(`/history/predictions/${resultId}`);
  }

  async updatePredictionResult(resultId, updateData) {
    return this.put(`/history/predictions/${resultId}`, updateData);
  }

  async getPatientPredictions(patientId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(
      `/history/patients/${patientId}/predictions${
        queryString ? `?${queryString}` : ""
      }`
    );
  }

  async getPredictionStatistics() {
    return this.get("/history/predictions/statistics");
  }

  // Enhanced Upload Methods with Patient Info
  async uploadTumorImage(file, patientData = {}) {
    const formData = new FormData();
    formData.append("file", file);

    // Add patient information
    if (patientData.patient_id) {
      formData.append("patient_id", patientData.patient_id);
    }
    if (patientData.patient_name) {
      formData.append("patient_name", patientData.patient_name);
    }
    if (patientData.patient_dob) {
      formData.append("patient_dob", patientData.patient_dob);
    }
    if (patientData.patient_gender) {
      formData.append("patient_gender", patientData.patient_gender);
    }
    if (patientData.patient_phone) {
      formData.append("patient_phone", patientData.patient_phone);
    }
    if (patientData.notes) {
      formData.append("notes", patientData.notes);
    }

    return this.post("/upload/tumor", formData);
  }

  async uploadChestImage(file, patientData = {}) {
    const formData = new FormData();
    formData.append("file", file);

    // Add patient information
    if (patientData.patient_id) {
      formData.append("patient_id", patientData.patient_id);
    }
    if (patientData.patient_name) {
      formData.append("patient_name", patientData.patient_name);
    }
    if (patientData.patient_dob) {
      formData.append("patient_dob", patientData.patient_dob);
    }
    if (patientData.patient_gender) {
      formData.append("patient_gender", patientData.patient_gender);
    }
    if (patientData.patient_phone) {
      formData.append("patient_phone", patientData.patient_phone);
    }
    if (patientData.notes) {
      formData.append("notes", patientData.notes);
    }

    return this.post("/upload/chest", formData);
  }
}

export default new ApiService();
