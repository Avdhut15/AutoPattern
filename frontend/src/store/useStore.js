import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import DataService from '../services/api';

const parseErrorMessage = (err, defaultMsg) => {
  const detail = err?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail.map((d) => d.msg || JSON.stringify(d)).join(', ');
  }
  if (detail && typeof detail === 'object') {
    return detail.message || JSON.stringify(detail);
  }
  return err?.message || defaultMsg;
};

export const useStore = create(
  persist(
    (set, get) => ({
      currentFile: null,
      originalFileName: '',
      uploadLoading: false,
      uploadError: null,
      analysisData: null,
      analysisLoading: false,
      analysisError: null,

      summaryData: null,
      visualizationData: null,
      insightsData: null,
      recommendationData: null,

      uploadDataset: async (file) => {
        set({ uploadLoading: true, uploadError: null, analysisError: null });
        try {
          const data = await DataService.uploadDataset(file);
          set({
            uploadLoading: false,
            currentFile: data.file_path,
            originalFileName: file.name,
            // Reset analysis state when new file is uploaded
            analysisData: null,
            summaryData: null,
            visualizationData: null,
            insightsData: null,
            recommendationData: null,
            uploadError: null,
            analysisError: null,
          });
        } catch (err) {
          set({
            uploadLoading: false,
            uploadError: parseErrorMessage(err, 'Upload failed. Please check the file format.'),
          });
        }
      },

      fetchAnalysis: async () => {
        const state = get();
        if (!state.currentFile) return;
        if (state.analysisData) return; // Already cached

        set({ analysisLoading: true, analysisError: null });
        try {
          const data = await DataService.analyzeDataset(state.currentFile);
          set({
            analysisLoading: false,
            analysisData: data,
            summaryData: data.summary || null,
            visualizationData: {
              patterns: data.patterns || {},
              anomalies: data.anomalies || {},
              dl_anomalies: data.dl_anomalies || {},
            },
            insightsData: data.insights || [],
            recommendationData: data.recommendation || null,
          });
        } catch (err) {
          set({
            analysisLoading: false,
            analysisError: parseErrorMessage(err, 'Analysis failed.'),
          });
        }
      },

      resetState: () => {
        set({
          currentFile: null,
          originalFileName: '',
          uploadLoading: false,
          uploadError: null,
          analysisData: null,
          analysisLoading: false,
          analysisError: null,
          summaryData: null,
          visualizationData: null,
          insightsData: null,
          recommendationData: null,
        });
      },
    }),
    {
      name: 'autopattern-storage-v2',
    }
  )
);
