import ApiService from "./api.js";

class TumorService {
  async predictTumor(imageFile) {
    const formData = new FormData();
    formData.append("file", imageFile);

    try {
      const result = await ApiService.post("/tumor", formData);
      return result;
    } catch (error) {
      console.error("Tumor prediction failed:", error);
      throw new Error("Failed to analyze tumor image. Please try again.");
    }
  }
}

export default new TumorService();
