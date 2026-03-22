import React, { useEffect } from 'react';
import { useStore } from './store/useStore';

import Header from './components/Header';
import UploadView from './views/UploadView';
import ProcessingView from './views/ProcessingView';
import ResultsView from './views/ResultsView';
import ErrorView from './views/ErrorView';

const AppContent = () => {
  const { 
    currentFile,
    uploadLoading, uploadError,
    analysisData, analysisLoading, analysisError,
    fetchAnalysis
  } = useStore();

  // Once file is uploaded, kick off the unified analysis
  useEffect(() => {
    if (currentFile && !uploadLoading && !analysisData && !analysisLoading && !analysisError) {
      fetchAnalysis();
    }
  }, [currentFile, uploadLoading, analysisData, analysisLoading, analysisError, fetchAnalysis]);

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
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
      {!analysisData && (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
          <Header />
          <main className="main-container">
            {renderCurrentView()}
          </main>
        </div>
      )}
      {analysisData && (
        <main style={{ width: '100%', height: '100vh' }}>
          {renderCurrentView()}
        </main>
      )}
    </div>
  );
};

export default AppContent;
