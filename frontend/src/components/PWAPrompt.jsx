import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export default function PWAPrompt() {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  // Handle service worker updates
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  // Handle install prompt
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }

    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismissInstall = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  const handleUpdate = () => {
    updateServiceWorker(true);
  };

  const handleDismissUpdate = () => {
    setNeedRefresh(false);
  };

  const handleDismissOffline = () => {
    setOfflineReady(false);
  };

  // Check if user previously dismissed install prompt (within 7 days)
  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - dismissedTime < sevenDays) {
        setShowInstallPrompt(false);
      }
    }
  }, []);

  return (
    <>
      {/* Install Prompt */}
      {showInstallPrompt && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white rounded-lg shadow-2xl border border-primary-100 p-4 z-50 animate-slide-up">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">
                Installer YarnFlow
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Ajoutez YarnFlow à votre écran d'accueil pour un accès rapide et une expérience optimale !
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleInstall}
                  className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                >
                  Installer
                </button>
                <button
                  onClick={handleDismissInstall}
                  className="px-4 py-2 text-gray-600 text-sm hover:text-gray-900 transition-colors"
                >
                  Plus tard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Available */}
      {needRefresh && (
        <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-primary-600 text-white rounded-lg shadow-2xl p-4 z-50 animate-slide-down">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">
                Mise à jour disponible
              </h3>
              <p className="text-sm text-primary-100 mb-3">
                Une nouvelle version de YarnFlow est disponible !
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleUpdate}
                  className="flex-1 bg-white text-primary-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-50 transition-colors"
                >
                  Mettre à jour
                </button>
                <button
                  onClick={handleDismissUpdate}
                  className="px-4 py-2 text-primary-100 text-sm hover:text-white transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Offline Ready */}
      {offlineReady && (
        <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-green-600 text-white rounded-lg shadow-2xl p-4 z-50 animate-slide-down">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">
                Mode hors ligne activé
              </h3>
              <p className="text-sm text-green-100 mb-3">
                YarnFlow est maintenant disponible hors ligne !
              </p>
              <button
                onClick={handleDismissOffline}
                className="text-sm text-green-100 hover:text-white transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes slide-down {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }

        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
