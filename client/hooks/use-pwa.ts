'use client';

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';

// Type for the BeforeInstallPromptEvent which is not standard in lib.dom.d.ts
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const emptySubscribe = () => () => {};

function subscribeStandalone(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  const mediaQuery = window.matchMedia('(display-mode: standalone)');
  mediaQuery.addEventListener('change', callback);
  window.addEventListener('appinstalled', callback);
  return () => {
    mediaQuery.removeEventListener('change', callback);
    window.removeEventListener('appinstalled', callback);
  };
}

function getStandaloneSnapshot(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

export function usePwa() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalledAfterPrompt, setIsInstalledAfterPrompt] = useState(false);

  // Safely detect client-side mount without cascading renders
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  // Subscribe to standalone display mode
  const isStandalone = useSyncExternalStore(
    subscribeStandalone,
    getStandaloneSnapshot,
    () => false
  );

  const isInstalled = isStandalone || isInstalledAfterPrompt;

  // Detect iOS environment safely
  const isIOS = useSyncExternalStore(
    emptySubscribe,
    () => {
      if (typeof window === 'undefined') return false;
      const userAgent = window.navigator.userAgent.toLowerCase();
      return (
        /iphone|ipad|ipod/.test(userAgent) ||
        (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1)
      );
    },
    () => false
  );

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalledAfterPrompt(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const isInstallable = Boolean(deferredPrompt);

  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) {
      return false;
    }

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalledAfterPrompt(true);
        setDeferredPrompt(null);
        return true;
      }
      return false;
    } catch (err) {
      console.error('[PWA] Prompt error:', err);
      return false;
    }
  }, [deferredPrompt]);

  return {
    isMounted,
    isInstallable,
    isInstalled,
    isIOS,
    promptInstall,
  };
}
