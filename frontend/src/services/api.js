import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: API_URL,
  timeout: 300000, // 5 min timeout for heavy AI + ML processing
});

export const DataService = {
  uploadDataset: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/upload_dataset', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  analyzeDataset: async (filePath) => {
    const response = await api.get('/analyze', { params: { file_path: filePath } });
    return response.data;
  },

  getRecommendation: async (filePath) => {
    const response = await api.get('/recommend', { params: { file_path: filePath } });
    return response.data;
  },

  // Legacy endpoints kept for compatibility
  getSummary: async (filePath) => {
    const response = await api.get('/dataset_summary', { params: { file_path: filePath } });
    return response.data;
  },

  getInsights: async (filePath) => {
    const response = await api.get('/insights', { params: { file_path: filePath } });
    return response.data;
  },
};

export default DataService;
