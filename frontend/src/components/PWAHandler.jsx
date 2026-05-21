import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PWAHandler = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showStatusToast, setShowStatusToast] = useState(false);
  const [installPromptEvent, setInstallPromptEvent] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    // 1. Online / Offline Listeners
    const handleOnline = () => {
      setIsOnline(true);
      setShowStatusToast(true);
      // Auto hide the "Back Online" toast after 3.5 seconds
      const timer = setTimeout(() => {
        setShowStatusToast(false);
      }, 3500);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowStatusToast(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 2. beforeinstallprompt Listener
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the default browser mini-infobar from appearing on mobile
      e.preventDefault();
      // Store the event so it can be triggered later
      setInstallPromptEvent(e);
      // Check if user has already dismissed the prompt in this session
      const isDismissed = sessionStorage.getItem('pwa_prompt_dismissed');
      if (!isDismissed) {
        // Show our premium custom install banner after a 4-second delay
        const timer = setTimeout(() => {
          setShowInstallBanner(true);
        }, 4000);
        return () => clearTimeout(timer);
      }
    };

    const handleAppInstalled = () => {
      console.log('[PWA] Smart Queue successfully installed!');
      setInstallPromptEvent(null);
      setShowInstallBanner(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPromptEvent) return;
    
    // Hide our custom banner
    setShowInstallBanner(false);
    
    // Show the browser's native install prompt
    installPromptEvent.prompt();
    
    // Wait for the user's choice
    const { outcome } = await installPromptEvent.userChoice;
    console.log(`[PWA] User response to install prompt: ${outcome}`);
    
    // Reset the deferred prompt variable
    setInstallPromptEvent(null);
  };

  const handleDismissClick = () => {
    setShowInstallBanner(false);
    // Don't show it again during this specific tab session
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  return (
    <>
      {/* 1. Connection Status Toast */}
      <AnimatePresence>
        {showStatusToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 md:bottom-8 right-6 z-50 max-w-sm w-full"
          >
            <div className={`p-4 rounded-2xl shadow-xl backdrop-blur-md flex items-center gap-3 border ${
              isOnline 
                ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-800 dark:text-emerald-300' 
                : 'bg-rose-500/10 border-rose-500/25 text-rose-800 dark:text-rose-300'
            }`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isOnline ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
              }`}>
                <span className="material-symbols-outlined">
                  {isOnline ? 'wifi' : 'wifi_off'}
                </span>
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-sm font-headline">
                  {isOnline ? 'Back Online' : 'Connection Lost'}
                </h4>
                <p className="text-xs opacity-90 font-body">
                  {isOnline 
                    ? 'Your connection is restored! Synchronizing queue data...' 
                    : 'Working in offline mode. Live updates will resume once online.'
                  }
                </p>
              </div>
              <button 
                onClick={() => setShowStatusToast(false)}
                className="opacity-60 hover:opacity-100 transition-opacity p-1"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Custom App Install Prompt Banner */}
      <AnimatePresence>
        {showInstallBanner && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-[9999] p-4 md:p-6"
          >
            <div className="max-w-3xl mx-auto bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 shadow-2xl rounded-2xl md:rounded-3xl p-5 md:p-6 flex flex-col md:flex-row items-center justify-between gap-5">
              
              {/* App Info */}
              <div className="flex items-center gap-4 text-left w-full md:w-auto">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-500 to-violet-600 flex items-center justify-center text-white shadow-lg flex-shrink-0">
                  {/* PWA Logo Icon */}
                  <svg className="w-9 h-9" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" fill="none">
                    <path 
                      d="M 40 25 L 80 25 A 18 18 0 0 1 80 61 L 30 61 A 24 24 0 0 0 30 109 L 90 109 A 24 24 0 0 0 114 85" 
                      stroke="#ffffff" 
                      strokeWidth="14" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-800 dark:text-white font-headline leading-tight flex items-center gap-2">
                    Install Smart Queue
                    <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">PWA</span>
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-body mt-0.5">
                    Install the app for instant updates, smooth tracking, and reliable offline access.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                <button
                  onClick={handleDismissClick}
                  className="px-4 py-2.5 rounded-full text-slate-600 dark:text-slate-300 font-semibold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors w-1/2 md:w-auto text-center"
                >
                  Not Now
                </button>
                <button
                  onClick={handleInstallClick}
                  className="px-6 py-2.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-sm shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/35 hover:-translate-y-0.5 transition-all w-1/2 md:w-auto flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-base">download</span>
                  Install App
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default PWAHandler;
