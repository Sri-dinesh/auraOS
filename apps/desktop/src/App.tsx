import { useEffect, useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAppStore, useOverlayStore, useSceneStore, useAutomationStore } from './stores';
import { useGlobalShortcut, useContextStream } from './hooks';
import { Sidebar } from './components/layout/Sidebar';
import { TitleBar } from './components/layout/TitleBar';
import { TrayManager } from './components/system/TrayManager';
import {
  OverviewPage,
  ScenesPage,
  AutomationsPage,
  WidgetsPage,
  LibraryPage,
  SettingsPage,
} from './pages';
import { DEFAULT_SCENES } from '@auraos/types';
import { startSyncLoop, isAuthenticated, registerDevice } from './lib/sync';


// ─── Ambient overlay provider ──────────────────────────────
function AmbientOverlay() {
  const overlayOpacity = useOverlayStore((s) => s.overlayOpacity);
  const accentColor = useOverlayStore((s) => s.accentColor);
  const isVisible = useOverlayStore((s) => s.isOverlayVisible);

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none z-10"
      style={{
        background: `
          linear-gradient(
            135deg,
            rgba(255, 99, 99, ${0.05 + overlayOpacity * 0.3}),
            rgba(168, 85, 247, ${0.03 + overlayOpacity * 0.2}),
            rgba(255, 79, 145, ${0.02 + overlayOpacity * 0.15})
          )
        `,
        opacity: 0.6,
        transition: 'background 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      aria-hidden="true"
    >
      {/* Subtle vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(
              ellipse at center,
              transparent 40%,
              rgba(10, 10, 10, 0.4) 100%
            )
          `,
        }}
      />
      {/* Animated accent glow */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${accentColor}22 0%, transparent 70%)`,
          opacity: 0.4,
        }}
        animate={{ x: [0, 40, -20, 0], y: [0, -30, 20, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${accentColor}15 0%, transparent 70%)`,
          opacity: 0.3,
        }}
        animate={{ x: [0, -30, 20, 0], y: [0, 20, -30, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

// Import motion from framer-motion
import { motion } from 'framer-motion';

// ─── Main App ──────────────────────────────────────────────
export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const setReady = useAppStore((s) => s.setReady);
  const setAuthenticated = useAppStore((s) => s.setAuthenticated);
  const setScenes = useSceneStore((s) => s.setScenes);
  const setRules = useAutomationStore((s) => s.setRules);

  useEffect(() => {
    // Initialize built-in scenes if none exist
    const currentScenes = useSceneStore.getState().scenes;
    if (currentScenes.length === 0) {
      setScenes(DEFAULT_SCENES);
      // Set first built-in scene as active
      const firstBuiltIn = DEFAULT_SCENES.find((s) => s.isBuiltIn);
      if (firstBuiltIn) {
        useSceneStore.getState().setActiveScene(firstBuiltIn.id);
        useOverlayStore.getState().applySceneVisuals(firstBuiltIn);
      }
    }

    // Initialize built-in rules if none exist (could add default rules here)
    const currentRules = useAutomationStore.getState().rules;
    if (currentRules.length === 0) {
      setRules([]);
    }

    // Initialize desktop context stream and sync
    const init = async () => {
      // Check if we have a stored auth token
      if (isAuthenticated()) {
        setAuthenticated(true);
        await registerDevice();
        startSyncLoop();
      }

      // Small delay for splash screen
      setTimeout(() => {
        setIsLoading(false);
        setReady(true);
      }, 500);
    };

    init();

    return () => {};
  }, [setReady, setAuthenticated, setScenes, setRules]);

  // Register global shortcut
  useGlobalShortcut();

  // Start context stream
  useContextStream();

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-gradient-aura flex items-center justify-center glow-aura">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#151515" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            </div>
            <motion.div
              className="absolute inset-0 rounded-xl bg-gradient-aura"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1.4, opacity: 0 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut' }}
            />
          </div>
          <span className="text-sm text-muted font-medium tracking-wide">AuraOS</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-background text-foreground overflow-hidden select-none">
      <TitleBar />
      <div className="flex h-[calc(100%-32px)]">
        <Sidebar />
        <main className="flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<OverviewPage />} />
              <Route path="/scenes" element={<ScenesPage />} />
              <Route path="/automations" element={<AutomationsPage />} />
              <Route path="/widgets" element={<WidgetsPage />} />
              <Route path="/library" element={<LibraryPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </AnimatePresence>
          {/* Ambient overlay layer */}
          <div className="absolute inset-0 pointer-events-none z-[1]" aria-hidden="true">
            <AmbientOverlay />
          </div>
        </main>
      </div>
      <TrayManager />
    </div>
  );
}
