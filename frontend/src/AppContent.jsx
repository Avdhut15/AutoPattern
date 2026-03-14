import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchAnalysis } from './store/datasetSlice';

import Header from './components/Header';
import UploadView from './views/UploadView';
import ProcessingView from './views/ProcessingView';
import ResultsView from './views/ResultsView';
import ErrorView from './views/ErrorView';

const AppContent = () => {
  const dispatch = useDispatch();
  
  const { 
    currentFile,
    uploadLoading, uploadError,
    analysisData, analysisLoading, analysisError,
  } = useSelector((state) => state.dataset);

  // Once file is uploaded, kick off the unified analysis
  useEffect(() => {
    if (currentFile && !uploadLoading && !analysisData && !analysisLoading && !analysisError) {
      dispatch(fetchAnalysis());
    }
  }, [currentFile, uploadLoading, analysisData, analysisLoading, analysisError, dispatch]);

  const renderCurrentView = () => {
    // 1. Error
    if (uploadError || analysisError) {
      return <ErrorView />;
    }

    // 2. Upload (initial)
    if (!currentFile && !uploadLoading) {
      return <UploadView />;
    }

    // 3. Processing
    if (uploadLoading || analysisLoading || (currentFile && !analysisData)) {
      return <ProcessingView />;
    }

    // 4. Results
    if (analysisData) {
      return <ResultsView />;
    }

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
