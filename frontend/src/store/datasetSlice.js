import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import DataService from '../services/api';

export const uploadDataset = createAsyncThunk(
  'dataset/upload',
  async (file, { rejectWithValue }) => {
    try {
      const data = await DataService.uploadDataset(file);
      return { 
        currentFile: data.file_path, 
        originalFileName: file.name 
      };
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || "Upload failed");
    }
  }
);

export const fetchSummary = createAsyncThunk(
  'dataset/fetchSummary',
  async (_, { getState, rejectWithValue }) => {
    const { dataset } = getState();
    if (!dataset.currentFile) return rejectWithValue("No file uploaded");
    if (dataset.summaryData) return dataset.summaryData;
    
    try {
      return await DataService.getSummary(dataset.currentFile);
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || "Failed to load summary");
    }
  }
);

export const fetchVisualizations = createAsyncThunk(
  'dataset/fetchVisualizations',
  async (_, { getState, rejectWithValue }) => {
    const { dataset } = getState();
    if (!dataset.currentFile) return rejectWithValue("No file uploaded");
    if (dataset.visualizationData) return dataset.visualizationData;

    try {
      return await DataService.getVisualizations(dataset.currentFile);
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || "Failed to load visualizations");
    }
  }
);

export const fetchInsights = createAsyncThunk(
  'dataset/fetchInsights',
  async (_, { getState, rejectWithValue }) => {
    const { dataset } = getState();
    if (!dataset.currentFile) return rejectWithValue("No file uploaded");
    if (dataset.insightsData) return dataset.insightsData;

    try {
      return await DataService.getInsights(dataset.currentFile);
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || "Failed to load insights");
    }
  }
);

const initialState = {
  currentFile: null,
  originalFileName: "",
  
  summaryData: null,
  summaryLoading: false,
  summaryError: null,
  
  visualizationData: null,
  visualizationLoading: false,
  visualizationError: null,

  insightsData: null,
  insightsLoading: false,
  insightsError: null,
  
  uploadLoading: false,
  uploadError: null
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
        // On new upload, reset everything else
        state.summaryData = null;
        state.visualizationData = null;
        state.insightsData = null;
        state.currentFile = action.payload.currentFile;
        state.originalFileName = action.payload.originalFileName;
      })
      .addCase(uploadDataset.rejected, (state, action) => {
        state.uploadLoading = false;
        state.uploadError = action.payload;
      })
      
      // Summary
      .addCase(fetchSummary.pending, (state) => {
        if (!state.summaryData) state.summaryLoading = true;
        state.summaryError = null;
      })
      .addCase(fetchSummary.fulfilled, (state, action) => {
        state.summaryLoading = false;
        state.summaryData = action.payload;
      })
      .addCase(fetchSummary.rejected, (state, action) => {
        state.summaryLoading = false;
        state.summaryError = action.payload;
      })
      
      // Visualizations
      .addCase(fetchVisualizations.pending, (state) => {
        if (!state.visualizationData) state.visualizationLoading = true;
        state.visualizationError = null;
      })
      .addCase(fetchVisualizations.fulfilled, (state, action) => {
        state.visualizationLoading = false;
        state.visualizationData = action.payload;
      })
      .addCase(fetchVisualizations.rejected, (state, action) => {
        state.visualizationLoading = false;
        state.visualizationError = action.payload;
      })
      
      // Insights
      .addCase(fetchInsights.pending, (state) => {
        if (!state.insightsData) state.insightsLoading = true;
        state.insightsError = null;
      })
      .addCase(fetchInsights.fulfilled, (state, action) => {
        state.insightsLoading = false;
        state.insightsData = action.payload;
      })
      .addCase(fetchInsights.rejected, (state, action) => {
        state.insightsLoading = false;
        state.insightsError = action.payload;
      });
  }
});

export const { resetState } = datasetSlice.actions;
export default datasetSlice.reducer;
