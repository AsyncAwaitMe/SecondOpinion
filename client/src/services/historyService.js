import ApiService from "./api";

class HistoryService {
  // Patient Management
  async createPatient(patientData) {
    try {
      return await ApiService.createPatient(patientData);
    } catch (error) {
      console.error("Failed to create patient:", error);
      throw error;
    }
  }

  async getPatients(search = "", page = 1, limit = 20) {
    try {
      const params = { skip: (page - 1) * limit, limit };
      if (search) {
        params.search = search;
      }
      return await ApiService.getPatients(params);
    } catch (error) {
      console.error("Failed to get patients:", error);
      throw error;
    }
  }

  async getPatient(patientId) {
    try {
      return await ApiService.getPatient(patientId);
    } catch (error) {
      console.error("Failed to get patient:", error);
      throw error;
    }
  }

  async updatePatient(patientId, patientData) {
    try {
      return await ApiService.updatePatient(patientId, patientData);
    } catch (error) {
      console.error("Failed to update patient:", error);
      throw error;
    }
  }

  async deletePatient(patientId) {
    try {
      return await ApiService.deletePatient(patientId);
    } catch (error) {
      console.error("Failed to delete patient:", error);
      throw error;
    }
  }

  // Prediction History
  async getPredictionHistory(page = 1, perPage = 5, filters = {}) {
    try {
      const params = { page, per_page: perPage, ...filters };
      return await ApiService.getPredictionHistory(params);
    } catch (error) {
      console.error("Failed to get prediction history:", error);
      throw error;
    }
  }

  async getPredictionResult(resultId) {
    try {
      return await ApiService.getPredictionResult(resultId);
    } catch (error) {
      console.error("Failed to get prediction result:", error);
      throw error;
    }
  }

  async updatePredictionResult(resultId, updateData) {
    try {
      return await ApiService.updatePredictionResult(resultId, updateData);
    } catch (error) {
      console.error("Failed to update prediction result:", error);
      throw error;
    }
  }

  async getPatientPredictions(patientId, page = 1, limit = 20) {
    try {
      const params = { skip: (page - 1) * limit, limit };
      return await ApiService.getPatientPredictions(patientId, params);
    } catch (error) {
      console.error("Failed to get patient predictions:", error);
      throw error;
    }
  }

  async getPredictionStatistics() {
    try {
      return await ApiService.getPredictionStatistics();
    } catch (error) {
      console.error("Failed to get prediction statistics:", error);
      throw error;
    }
  }

  // Enhanced prediction methods
  async addNoteToResult(resultId, notes) {
    try {
      return await this.updatePredictionResult(resultId, { notes });
    } catch (error) {
      console.error("Failed to add note to result:", error);
      throw error;
    }
  }

  async updateResultStatus(resultId, status) {
    try {
      return await this.updatePredictionResult(resultId, { status });
    } catch (error) {
      console.error("Failed to update result status:", error);
      throw error;
    }
  }

  // Utility methods for frontend compatibility
  async getResultsByModelType(modelType, page = 1, perPage = 20) {
    try {
      return await this.getPredictionHistory(page, perPage, {
        model_type: modelType,
      });
    } catch (error) {
      console.error("Failed to get results by model type:", error);
      throw error;
    }
  }

  async getResultsByStatus(status, page = 1, perPage = 20) {
    try {
      return await this.getPredictionHistory(page, perPage, { status });
    } catch (error) {
      console.error("Failed to get results by status:", error);
      throw error;
    }
  }

  // Search functionality
  async searchPatients(query) {
    try {
      return await this.getPatients(query);
    } catch (error) {
      console.error("Failed to search patients:", error);
      throw error;
    }
  }
}

export default new HistoryService();
