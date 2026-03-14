import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import DataService from '../services/api';

// Single unified thunk: upload → analyze (AI recommend + all models + insights in one call)
export const uploadDataset = createAsyncThunk(
  'dataset/upload',
  async (file, { rejectWithValue }) => {
    try {
      const data = await DataService.uploadDataset(file);
      return {
        currentFile: data.file_path,
        originalFileName: file.name,
      };
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Upload failed');
    }
  }
);

export const fetchAnalysis = createAsyncThunk(
  'dataset/fetchAnalysis',
  async (_, { getState, rejectWithValue }) => {
    const { dataset } = getState();
    if (!dataset.currentFile) return rejectWithValue('No file uploaded');
    if (dataset.analysisData) return dataset.analysisData; // Already cached in Redux
    try {
      return await DataService.analyzeDataset(dataset.currentFile);
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Analysis failed');
    }
  }
);

const initialState = {
  currentFile: null,
  originalFileName: '',

  // Upload
  uploadLoading: false,
  uploadError: null,

  // Unified analysis
  analysisData: null,
  analysisLoading: false,
  analysisError: null,

  // Derived convenience fields (populated from analysisData)
  summaryData: null,
  visualizationData: null,
  insightsData: null,
  recommendationData: null,
};

const datasetSlice = createSlice({
  name: 'dataset',
  initialState,
  reducers: {
    resetState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Upload
      .addCase(uploadDataset.pending, (state) => {
        state.uploadLoading = true;
        state.uploadError = null;
      })
      .addCase(uploadDataset.fulfilled, (state, action) => {
        state.uploadLoading = false;
        // Reset analysis state for new file
        state.analysisData = null;
        state.summaryData = null;
        state.visualizationData = null;
        state.insightsData = null;
        state.recommendationData = null;
        state.analysisError = null;
        state.currentFile = action.payload.currentFile;
        state.originalFileName = action.payload.originalFileName;
      })
      .addCase(uploadDataset.rejected, (state, action) => {
        state.uploadLoading = false;
        state.uploadError = action.payload;
      })

      // Unified analysis
      .addCase(fetchAnalysis.pending, (state) => {
        if (!state.analysisData) state.analysisLoading = true;
        state.analysisError = null;
      })
      .addCase(fetchAnalysis.fulfilled, (state, action) => {
        state.analysisLoading = false;
        state.analysisData = action.payload;
        // Populate derived fields for backward-compat with existing panels
        state.summaryData = action.payload.summary || null;
        state.visualizationData = {
          patterns: action.payload.patterns || {},
          anomalies: action.payload.anomalies || {},
          dl_anomalies: action.payload.dl_anomalies || {},
        };
        state.insightsData = action.payload.insights || [];
        state.recommendationData = action.payload.recommendation || null;
      })
      .addCase(fetchAnalysis.rejected, (state, action) => {
        state.analysisLoading = false;
        state.analysisError = action.payload;
      });
  },
});

export const { resetState } = datasetSlice.actions;
export default datasetSlice.reducer;
