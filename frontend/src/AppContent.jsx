import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchSummary, fetchVisualizations, fetchInsights } from './store/datasetSlice';

import Header from './components/Header';
import UploadView from './views/UploadView';
import ProcessingView from './views/ProcessingView';
import ResultsView from './views/ResultsView';
import ErrorView from './views/ErrorView';

const AppContent = () => {
  const dispatch = useDispatch();
  
  const { 
    currentFile,
    uploadLoading, summaryLoading, visualizationLoading, insightsLoading,
    uploadError, summaryError, visualizationError, insightsError,
    summaryData, visualizationData, insightsData
  } = useSelector((state) => state.dataset);

  // Orchestrate the fetching process once a file is uploaded
  useEffect(() => {
    if (currentFile && !uploadLoading) {
      if (!summaryData && !summaryLoading && !summaryError) {
        dispatch(fetchSummary());
      } else if (summaryData && !visualizationData && !visualizationLoading && !visualizationError) {
        dispatch(fetchVisualizations());
      } else if (visualizationData && !insightsData && !insightsLoading && !insightsError) {
        dispatch(fetchInsights());
      }
    }
  }, [
    currentFile, uploadLoading,
    summaryData, summaryLoading, summaryError,
    visualizationData, visualizationLoading, visualizationError,
    insightsData, insightsLoading, insightsError,
    dispatch
  ]);

  // State Router
  const renderCurrentView = () => {
    // 1. Error State
    if (uploadError || summaryError || visualizationError || insightsError) {
      return <ErrorView />;
    }

    // 2. Upload State (Initial)
    if (!currentFile && !uploadLoading) {
      return <UploadView />;
    }

    // 3. Processing State
    if (
      uploadLoading || 
      summaryLoading || 
      visualizationLoading || 
      insightsLoading ||
      (currentFile && (!summaryData || !visualizationData || !insightsData)) // Missing data but no error yet
    ) {
      return <ProcessingView />;
    }

    // 4. Results State
    if (summaryData && visualizationData && insightsData) {
      return <ResultsView />;
    }

    // Fallback
    return <UploadView />;
  };

  return (
    <>
      <Header />
      <main className="main-container">
        {renderCurrentView()}
      </main>
    </>
  );
};

export default AppContent;
