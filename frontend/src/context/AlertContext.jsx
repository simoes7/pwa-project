import React, { createContext, useContext, useState, useCallback } from 'react';
import AlertModal from '../components/AlertModal';

const AlertContext = createContext();

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

export const AlertProvider = ({ children }) => {
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: null,
  });

  const showAlert = useCallback((message, title = 'Notification', type = 'info') => {
    setAlertConfig({
      isOpen: true,
      title,
      message,
      type,
      onConfirm: null,
    });
  }, []);

  const showConfirm = useCallback((message, onConfirm, title = 'Are you sure?', type = 'warning') => {
    setAlertConfig({
      isOpen: true,
      title,
      message,
      type,
      onConfirm: () => {
        onConfirm();
        closeAlert();
      },
    });
  }, []);

  const closeAlert = useCallback(() => {
    setAlertConfig(prev => ({ ...prev, isOpen: false }));
  }, []);

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      <AlertModal
        {...alertConfig}
        onClose={closeAlert}
      />
    </AlertContext.Provider>
  );
};
