'use client';

import React, { useState } from 'react';
import { usePwa } from '@/hooks/use-pwa';
import {
  Download,
  Smartphone,
  Share,
  PlusSquare,
  X,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export function PwaInstallButton() {
  const { isMounted, isInstallable, isInstalled, isIOS, promptInstall } = usePwa();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  if (!isMounted) return null;

  // If already installed and running as standalone PWA, hide the button
  if (isInstalled) return null;

  const handleClick = async () => {
    if (isInstallable) {
      const accepted = await promptInstall();
      if (accepted) {
        setInstalledSuccess(true);
        setTimeout(() => setInstalledSuccess(false), 4000);
      }
    } else {
      // If browser doesn't support direct prompt (e.g. iOS Safari, Firefox, or prompt not yet captured),
      // open the install guidance modal.
      setShowGuideModal(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="group relative flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 hover:bg-rose-100/80 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-xs"
        title="Install FoodMan as App"
        aria-label="Install FoodMan Progressive Web App"
      >
        <span className="relative flex items-center justify-center">
          <Download className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" />
          <span className="absolute -top-1 -right-1 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
          </span>
        </span>
        <span className="hidden sm:inline">Install App</span>
      </button>


      {installedSuccess && (
        <div className="fixed top-20 right-4 z-50 flex items-center gap-2 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-xl animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-xs font-bold">FoodMan has been installed!</span>
        </div>
      )}


      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
          >

            <button
              onClick={() => setShowGuideModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-center transition cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>


            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-600 flex items-center justify-center text-white shadow-md shadow-rose-600/30">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Install FoodMan
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Fast food delivery on your home screen
                </p>
              </div>
            </div>


            <div className="space-y-3.5 my-4">
              {isIOS ? (
                <>
                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                    <div className="w-7 h-7 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center text-xs font-black shrink-0">
                      1
                    </div>
                    <div className="text-xs text-slate-700 dark:text-slate-300">
                      Tap the <strong className="text-slate-900 dark:text-white">Share</strong> button{' '}
                      <Share className="inline w-3.5 h-3.5 text-rose-600 mx-0.5 align-text-bottom" /> in
                      Safari&apos;s bottom toolbar.
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                    <div className="w-7 h-7 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center text-xs font-black shrink-0">
                      2
                    </div>
                    <div className="text-xs text-slate-700 dark:text-slate-300">
                      Scroll down and tap{' '}
                      <strong className="text-slate-900 dark:text-white">Add to Home Screen</strong>{' '}
                      <PlusSquare className="inline w-3.5 h-3.5 text-rose-600 mx-0.5 align-text-bottom" />.
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                    <div className="w-7 h-7 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center text-xs font-black shrink-0">
                      3
                    </div>
                    <div className="text-xs text-slate-700 dark:text-slate-300">
                      Tap <strong className="text-slate-900 dark:text-white">Add</strong> in the top-right corner to finish.
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                    <div className="w-7 h-7 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center text-xs font-black shrink-0">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-xs text-slate-700 dark:text-slate-300">
                      Click the <strong className="text-slate-900 dark:text-white">Install</strong> icon in your browser address bar or menu (⋮), then choose <strong>Install FoodMan</strong>.
                    </div>
                  </div>
                </>
              )}
            </div>


            <div className="bg-rose-50/50 dark:bg-rose-950/20 rounded-2xl p-3 text-[11px] text-rose-700 dark:text-rose-300 flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 shrink-0 text-rose-500" />
              <span>Enjoy instant food ordering, fullscreen view, and offline fallback!</span>
            </div>


            <button
              onClick={() => setShowGuideModal(false)}
              className="w-full py-3 rounded-xl bg-slate-900 dark:bg-rose-600 hover:bg-slate-800 dark:hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
