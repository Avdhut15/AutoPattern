import { configureStore } from '@reduxjs/toolkit';
import datasetReducer from './datasetSlice';

export const store = configureStore({
  reducer: {
    dataset: datasetReducer,
  },
});
