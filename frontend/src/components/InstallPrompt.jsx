import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI to notify the user they can add to home screen
      // Optionally check if they've dismissed it before using localStorage
      const hasDismissed = localStorage.getItem('pwa-prompt-dismissed');
      if (!hasDismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-24 left-4 right-4 md:left-auto md:right-8 md:bottom-8 md:w-96 bg-surface-container-lowest shadow-2xl rounded-2xl p-5 z-50 flex gap-4"
          style={{ border: '1px solid var(--outline-variant)' }}
        >
          <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--primary-container)', color: 'var(--primary)' }}>
            <span className="material-symbols-outlined text-2xl">install_mobile</span>
          </div>
          <div className="flex-1">
            <h3 className="font-headline font-bold mb-1" style={{ color: 'var(--on-surface)' }}>Install Smart Queue</h3>
            <p className="text-sm mb-4" style={{ color: 'var(--on-surface-variant)' }}>Install our app for quick access, offline support, and a better experience.</p>
            <div className="flex gap-2">
              <button 
                onClick={handleInstallClick}
                className="flex-1 py-2 rounded-xl font-bold text-sm transition-opacity hover:opacity-90"
                style={{ backgroundColor: 'var(--primary)', color: 'white' }}
              >
                Install App
              </button>
              <button 
                onClick={handleDismiss}
                className="px-4 py-2 rounded-xl font-bold text-sm transition-colors hover:bg-surface-container-low"
                style={{ color: 'var(--on-surface-variant)' }}
              >
                Not Now
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InstallPrompt;
