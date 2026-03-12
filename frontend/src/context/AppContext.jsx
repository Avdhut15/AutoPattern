import React, { createContext, useState, useContext } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [currentFile, setCurrentFile] = useState(null); // The server file path
  const [originalFileName, setOriginalFileName] = useState("");
  
  const value = {
    currentFile,
    setCurrentFile,
    originalFileName,
    setOriginalFileName
  };
  
  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
