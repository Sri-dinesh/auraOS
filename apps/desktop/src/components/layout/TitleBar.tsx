import { useCallback, useEffect, useState } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { motion } from 'framer-motion';
import { useSceneStore, useAppStore } from '../../stores';

export function TitleBar() {
  const sceneStore = useSceneStore();
  const isReady = useAppStore((s) => s.isReady);
  const activeScene = sceneStore.scenes.find((s) => s.id === sceneStore.activeSceneId);
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getCurrentWindow()
      .isMaximized()
      .then((value) => {
        if (!cancelled) setIsMaximized(value);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleMaximize = useCallback(async () => {
    const win = getCurrentWindow();
    if (await win.isMaximized()) {
      await win.unmaximize();
    } else {
      await win.maximize();
    }
  }, []);

  const handleDrag = useCallback(() => {
    const win = getCurrentWindow();
    if (isMaximized) return;
    win.startDragging().catch(() => {});
  }, [isMaximized]);

  return (
    <div
      className="flex items-center justify-between h-8 px-2 select-none border-b border-border/60 bg-surface/40 backdrop-blur-sm"
      onMouseDown={handleDrag}
      data-tauri-drag-region
    >
      {/* Title / scene indicator */}
      <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
        <motion.div
          className="shrink-0 w-3 h-3 rounded-full"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: activeScene ? 1 : 0, opacity: activeScene ? 1 : 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          style={
            activeScene?.visual?.accentColor
              ? {
                  background: activeScene.visual.accentColor,
                  boxShadow: `0 0 6px ${activeScene.visual.accentColor}`,
                }
              : undefined
          }
        />
        <span className="text-xs font-medium text-muted truncate whitespace-nowrap">
          {activeScene?.name ?? 'AuraOS'}
        </span>
        {activeScene?.slug && (
          <span className="text-[10px] text-muted/60 uppercase tracking-widest hidden sm:inline truncate">
            {activeScene.slug}
          </span>
        )}
      </div>

      {/* Window controls */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          className="w-8 h-8 flex items-center justify-center text-muted/60 hover:text-foreground hover:bg-surface-hover/80 transition-colors rounded-md"
          onClick={() => {
            getCurrentWindow().minimize().catch(() => {});
          }}
          title="Minimize"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <rect y="5" width="12" height="2" rx="1" />
          </svg>
        </button>
        <button
          className="w-8 h-8 flex items-center justify-center text-muted/60 hover:text-foreground hover:bg-surface-hover/80 transition-colors rounded-md"
          onClick={toggleMaximize}
          title={isMaximized ? 'Restore' : 'Maximize'}
        >
          {isMaximized ? (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <rect x="1.5" y="3.5" width="7" height="7" rx="1" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <rect x="1" y="1" width="10" height="10" rx="1" />
            </svg>
          )}
        </button>
        <button
          className="w-8 h-8 flex items-center justify-center text-muted/60 hover:text-red-400 hover:bg-surface-hover/80 transition-colors rounded-md"
          onClick={() => {
            getCurrentWindow().close().catch(() => {});
          }}
          title="Close"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <path d="M1 1L11 11M11 1L1 11" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {!isReady && <span className="sr-only">Starting AuraOS…</span>}
    </div>
  );
}