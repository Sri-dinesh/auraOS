import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  Calendar,
  Music,
  Battery,
  Activity,
  Quote,
  Cpu,
  HardDrive,
  Network,
  Eye,
  Sun,
  Plus,
  Check,
  X,
} from 'lucide-react';
import { useSceneStore } from '../stores';
import { Card, CardContent, CardHeader, CardTitle } from '@auraos/ui';
import { Badge } from '@auraos/ui';
import type { WidgetConfig } from '@auraos/types';

interface BuiltInWidget {
  type: string;
  name: string;
  description: string;
  icon: React.ElementType;
  category: 'info' | 'media' | 'system' | 'productivity' | 'fun';
  defaultSettings: Record<string, unknown>;
}

const builtInWidgets: BuiltInWidget[] = [
  { type: 'clock', name: 'Clock', description: 'Shows current time', icon: Clock, category: 'info', defaultSettings: { format: '12h', showSeconds: false } },
  { type: 'date', name: 'Date', description: 'Shows current date', icon: Calendar, category: 'info', defaultSettings: { format: 'medium' } },
  { type: 'now-playing', name: 'Now Playing', description: 'Current media track info', icon: Music, category: 'media', defaultSettings: { showArtwork: true, showProgress: true } },
  { type: 'battery', name: 'Battery', description: 'Battery level and charging state', icon: Battery, category: 'system', defaultSettings: { showPercentage: true, lowThreshold: 20 } },
  { type: 'system-usage', name: 'System Usage', description: 'CPU and memory usage', icon: Activity, category: 'system', defaultSettings: { showCpu: true, showMemory: true } },
  { type: 'focus-timer', name: 'Focus Timer', description: 'Pomodoro-style timer', icon: Clock, category: 'productivity', defaultSettings: { duration: 25, autoStart: false } },
  { type: 'quote', name: 'Quote', description: 'Daily random quote', icon: Quote, category: 'fun', defaultSettings: { rotateInterval: 3600 } },
  { type: 'weather', name: 'Weather', description: 'Current weather conditions', icon: Sun, category: 'info', defaultSettings: { location: 'auto', units: 'celsius' } },
  { type: 'cpu', name: 'CPU', description: 'Real-time CPU usage', icon: Cpu, category: 'system', defaultSettings: { showGraph: true, updateInterval: 1000 } },
  { type: 'memory', name: 'Memory', description: 'RAM usage indicator', icon: HardDrive, category: 'system', defaultSettings: { showBar: true } },
  { type: 'network', name: 'Network', description: 'Download/upload speed', icon: Network, category: 'system', defaultSettings: { format: 'Mbps' } },
  { type: 'brightness', name: 'Brightness', description: 'Screen brightness control', icon: Eye, category: 'system', defaultSettings: { showSlider: true } },
];

function WidgetCard({
  widget,
  isAdded,
  onToggle,
}: {
  widget: BuiltInWidget;
  isAdded: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`
        flex items-start gap-3 p-3 rounded-xl border transition-all duration-150 cursor-pointer
        ${isAdded
          ? 'bg-primary/5 border-primary/20'
          : 'bg-surface-elevated/40 border-border/50 hover:border-border hover:bg-surface-elevated/60'
        }
      `}
      onClick={onToggle}
    >
      <div
        className={`
          w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors
          ${isAdded ? 'bg-primary/10 text-primary' : 'bg-surface-active text-muted'}
        `}
      >
        <widget.icon className="w-4.5 h-4.5" strokeWidth={1.75} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${isAdded ? 'text-foreground' : 'text-foreground/80'}`}>
            {widget.name}
          </span>
          <Badge variant={isAdded ? 'default' : 'muted'} className="text-[9px] py-0 px-1.5 capitalize">
            {widget.category}
          </Badge>
        </div>
        <p className="text-xs text-muted mt-0.5">{widget.description}</p>
      </div>
      <div className="shrink-0">
        {isAdded ? (
          <Check className="w-4 h-4 text-primary" strokeWidth={2.5} />
        ) : (
          <Plus className="w-4 h-4 text-muted/40" />
        )}
      </div>
    </motion.div>
  );
}

const categoryColors: Record<string, string> = {
  info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  media: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  system: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  productivity: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  fun: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
};

export function WidgetsPage() {
  const scenes = useSceneStore((s) => s.scenes);
  const activeScene = useSceneStore((s) => {
    const id = s.activeSceneId;
    return id ? scenes.find((s) => s.id === id) : null;
  });
  const updateScene = useSceneStore((s) => s.updateScene);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const activeWidgets: WidgetConfig[] = activeScene?.widgets ?? [];
  const addedWidgetTypes = new Set(activeWidgets.map((w) => w.type));

  const filtered = selectedCategory === 'all'
    ? builtInWidgets
    : builtInWidgets.filter((w) => w.category === selectedCategory);

  const handleToggleWidget = (widget: BuiltInWidget) => {
    if (!activeScene) return;

    const existing = activeWidgets.find((w) => w.type === widget.type);
    if (existing) {
      updateScene(activeScene.id, {
        widgets: activeWidgets.filter((w) => w.type !== widget.type),
      });
    } else {
      const newWidget: WidgetConfig = {
        id: `widget_${Date.now()}`,
        type: widget.type,
        position: 'top-right',
        size: 'small',
        settings: widget.defaultSettings,
        enabled: true,
      };
      updateScene(activeScene.id, {
        widgets: [...activeWidgets, newWidget],
      });
    }
  };

  const categoryCounts = builtInWidgets.reduce((acc, w) => {
    acc[w.category] = (acc[w.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="h-full overflow-y-auto p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Widgets</h1>
          <p className="text-sm text-muted mt-0.5">
            {activeScene
              ? `Manage widgets for “${activeScene.name}”`
              : 'Select a scene to manage widgets'}
          </p>
        </div>
        {activeScene && (
          <Badge variant="default" className="gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            {activeScene.name}
          </Badge>
        )}
      </div>

      {!activeScene ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-surface-active flex items-center justify-center mb-4">
            <Clock className="w-8 h-8 text-muted/30" strokeWidth={1.5} />
          </div>
          <p className="text-sm font-medium text-muted mb-1">No scene selected</p>
          <p className="text-xs text-muted/60">Choose a scene to customize its widgets</p>
        </div>
      ) : (
        <>
          {/* Category filter */}
          <div className="flex flex-wrap gap-2">
            <button
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-primary/10 border-primary/30 text-primary'
                  : 'bg-surface-elevated/60 border-border/50 text-muted hover:text-foreground'
              }`}
              onClick={() => setSelectedCategory('all')}
            >
              All ({builtInWidgets.length})
            </button>
            {Object.entries(categoryCounts).map(([cat, count]) => (
              <button
                key={cat}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors capitalize ${
                  selectedCategory === cat
                    ? 'bg-primary/10 border-primary/30 text-primary'
                    : 'bg-surface-elevated/60 border-border/50 text-muted hover:text-foreground'
                }`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat} ({count})
              </button>
            ))}
          </div>

          {/* Widget grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {filtered.map((widget) => (
              <WidgetCard
                key={widget.type}
                widget={widget}
                isAdded={addedWidgetTypes.has(widget.type)}
                onToggle={() => handleToggleWidget(widget)}
              />
            ))}
          </div>
        </>
      )}

      {/* Active widgets summary */}
      {activeWidgets.length > 0 && (
        <Card className="bg-surface/60 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted uppercase tracking-widest">
              Active Widgets — {activeScene?.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {activeWidgets.map((w) => {
                const info = builtInWidgets.find((b) => b.type === w.type);
                return (
                  <div
                    key={w.id}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs ${categoryColors[info?.category ?? 'info']}`}
                  >
                    {info?.icon && <info.icon className="w-3.5 h-3.5" />}
                    <span className="text-foreground/90 font-medium capitalize">{info?.name ?? w.type}</span>
                    <span className="text-muted/60 capitalize">{w.size}</span>
                    <button
                      className="ml-1 text-muted/50 hover:text-red-400 transition-colors"
                      onClick={() => handleToggleWidget(info!)}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
