import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import DataService from '../services/api';

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
        set({ uploadLoading: true, uploadError: null });
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
            analysisError: null,
          });
        } catch (err) {
          set({
            uploadLoading: false,
            uploadError: err.response?.data?.detail || 'Upload failed',
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
            analysisError: err.response?.data?.detail || 'Analysis failed',
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
