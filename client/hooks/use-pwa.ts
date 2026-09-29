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

let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;
let globalIsInstalled = false;

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    globalDeferredPrompt = e as BeforeInstallPromptEvent;
  });

  window.addEventListener('appinstalled', () => {
    globalIsInstalled = true;
    globalDeferredPrompt = null;
  });
}

export function usePwa() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() => globalDeferredPrompt);
  const [isInstalledAfterPrompt, setIsInstalledAfterPrompt] = useState(() => globalIsInstalled);

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
    if (globalDeferredPrompt && !deferredPrompt) {
      setDeferredPrompt(globalDeferredPrompt);
    }
    if (globalIsInstalled && !isInstalledAfterPrompt) {
      setIsInstalledAfterPrompt(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Do not prevent default so that Chrome's ambient float prompt remains visible
      globalDeferredPrompt = e as BeforeInstallPromptEvent;
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      globalIsInstalled = true;
      globalDeferredPrompt = null;
      setIsInstalledAfterPrompt(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [deferredPrompt, isInstalledAfterPrompt]);

  const isInstallable = Boolean(deferredPrompt || globalDeferredPrompt);

  const promptInstall = useCallback(async (): Promise<boolean> => {
    const activePrompt = deferredPrompt || globalDeferredPrompt;
    if (!activePrompt) {
      return false;
    }

    try {
      await activePrompt.prompt();
      const choiceResult = await activePrompt.userChoice;
      if (choiceResult?.outcome === 'accepted') {
        globalIsInstalled = true;
        globalDeferredPrompt = null;
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
