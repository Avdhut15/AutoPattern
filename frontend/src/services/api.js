import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: API_URL,
});

export const DataService = {
  uploadDataset: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    // Config for tracking upload progress
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };
    
    const response = await api.post('/upload_dataset', formData, config);
    return response.data;
  },
  
  getSummary: async (filePath) => {
    const response = await api.get('/dataset_summary', { params: { file_path: filePath } });
    return response.data;
  },
  
  getPatterns: async (filePath) => {
    const response = await api.get('/pattern_analysis', { params: { file_path: filePath } });
    return response.data;
  },
  
  getAnomalies: async (filePath) => {
    const response = await api.get('/anomaly_detection', { params: { file_path: filePath } });
    return response.data;
  },
  
  getDLAnomalies: async (filePath) => {
    const response = await api.get('/dl_anomaly_detection', { params: { file_path: filePath } });
    return response.data;
  },
  
  getVisualizations: async (filePath) => {
    const response = await api.get('/visualizations', { params: { file_path: filePath } });
    return response.data;
  },
  
  getInsights: async (filePath) => {
    const response = await api.get('/insights', { params: { file_path: filePath } });
    return response.data;
  }
};

export default DataService;
