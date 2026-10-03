import { motion } from 'framer-motion';
import {
  Clock,
  Zap,
  Headphones,
  Monitor,
  Rocket,
  Sun,
  Moon,
  Battery,
  Music,
  Sparkles,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import { useSceneStore, useContextStore, useAppStore } from '../stores';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Separator,
  Button,
} from '@auraos/ui';

function TimeGreeting() {
  const hour = useContextStore((s) => (s.context ? s.context.hour : new Date().getHours()));
  const timeOfDay = useContextStore((s) => (s.context ? s.context.timeOfDay : 'morning'));

  const getGreeting = () => {
    if (hour < 12) return { text: 'Good morning', icon: Sun };
    if (hour < 17) return { text: 'Good afternoon', icon: Sun };
    if (hour < 21) return { text: 'Good evening', icon: Moon };
    return { text: 'Good night', icon: Moon };
  };

  const { text, icon: Icon } = getGreeting();

  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
        <Icon className="w-5 h-5 text-primary" strokeWidth={1.75} />
      </div>
      <div>
        <p className="text-xs text-muted uppercase tracking-widest">{timeOfDay}</p>
        <p className="text-lg font-semibold">{text}</p>
      </div>
    </div>
  );
}

function CurrentSceneCard() {
  const activeSceneId = useSceneStore((s) => s.activeSceneId);
  const scenes = useSceneStore((s) => s.scenes);
  const context = useContextStore((s) => s.context);

  const scene = scenes.find((s) => s.id === activeSceneId);
  const isActive = !!scene;

  const activeApp = context?.activeApplication?.name ?? 'System';
  const elapsed = context ? Math.floor((Date.now() - context.timestamp) / 1000) : 0;
  const elapsedStr = elapsed > 3600
    ? `${Math.floor(elapsed / 3600)}h ${Math.floor((elapsed % 3600) / 60)}m`
    : elapsed > 60
    ? `${Math.floor(elapsed / 60)}m`
    : `${elapsed}s`;

  return (
    <Card className={`bg-surface-elevated/80 border-primary/20 ${isActive ? 'border border-primary/20' : 'border border-border'}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted uppercase tracking-widest">
            Current Atmosphere
          </CardTitle>
          {isActive && (
            <Badge variant="default" className="gap-1 text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Active
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-col gap-4">
          {scene ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold"
                    style={{
                      background: scene.visual?.accentColor
                        ? `${scene.visual.accentColor}20`
                        : undefined,
                      color: scene.visual?.accentColor ?? undefined,
                    }}
                  >
                    {scene.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-base">{scene.name}</p>
                    <p className="text-xs text-muted">
                      {activeApp}
                      {scene.slug && ` · ${scene.slug}`}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-[10px]">
                  {scene.behavior?.performanceMode ?? 'balanced'}
                </Badge>
              </div>

              {scene.visual?.effects && (
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex items-center gap-2 text-xs text-muted bg-surface/60 rounded-lg px-2.5 py-1.5">
                    <Sparkles className={`w-3.5 h-3.5 ${scene.visual.effects.particles?.enabled ? 'text-primary' : 'text-muted/40'}`} />
                    <span className="capitalize">
                      {scene.visual.effects.particles?.enabled ? 'particles' : 'no particles'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted bg-surface/60 rounded-lg px-2.5 py-1.5">
                    <Zap className={`w-3.5 h-3.5 ${scene.behavior?.animationIntensity !== 'off' ? 'text-primary' : 'text-muted/40'}`} />
                    <span className="capitalize">
                      {scene.behavior?.animationIntensity ?? 'medium'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted bg-surface/60 rounded-lg px-2.5 py-1.5">
                    <Monitor className={`w-3.5 h-3.5 ${scene.visual?.overlayOpacity ? 'text-primary' : 'text-muted/40'}`} />
                    <span className="capitalize">
                      {scene.visual?.overlayOpacity ? `${(scene.visual.overlayOpacity * 100).toFixed(0)}%` : 'none'} overlay
                    </span>
                  </div>
                </div>
              )}

              <Separator className="bg-border/50" />

              <div className="flex items-center justify-between text-xs">
                <span className="text-muted flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Active for {elapsedStr}
                </span>
                <div className="flex items-center gap-1.5 text-muted">
                  <Battery className={`w-3.5 h-3.5 ${context?.charging ? 'text-success' : ''}`} />
                  <span>{context?.battery?.level ?? '—'}%</span>
                  {context?.charging && <span className="text-[10px] text-success">charging</span>}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-6 text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-surface-active flex items-center justify-center mb-3">
                <Sparkles className="w-7 h-7 text-muted/40" strokeWidth={1.5} />
              </div>
              <p className="text-sm text-muted mb-1">No active scene</p>
              <p className="text-xs text-muted/60">Open an app or choose a scene to get started</p>
            </motion.div>
          )}

          {isActive && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-muted hover:text-foreground border border-border/50 hover:border-border"
            >
              <Rocket className="w-3.5 h-3.5" />
              Quick switch scene
              <kbd className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-surface-active border border-border/50 text-muted/60">
                Ctrl+Shift+Space
              </kbd>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ContextSummary() {
  const context = useContextStore((s) => s.context);

  if (!context) return null;

  // Every field is treated as optional: the snapshot arrives over IPC, so a
  // missing or renamed key must degrade to a placeholder rather than throw.
  // Throwing here unmounts the whole tree and the window just goes black.
  const hour = Number.isFinite(context.hour) ? context.hour : null;
  const idleSeconds = Number.isFinite(context.idleTimeSeconds) ? context.idleTimeSeconds : null;
  const isMediaPlaying = context.mediaState?.playing === true;

  const items = [
    {
      label: 'Active App',
      value: context.activeApplication?.name ?? 'None',
      icon: Monitor,
      color: 'text-primary',
    },
    {
      label: 'Time',
      value: hour === null ? '—' : `${hour.toString().padStart(2, '0')}:00`,
      icon: Clock,
      color: 'text-muted',
    },
    {
      label: 'Battery',
      value: `${context.battery?.level ?? '—'}%`,
      icon: Battery,
      color: context.charging ? 'text-success' : 'text-warning',
    },
    {
      label: 'Media',
      value: isMediaPlaying ? (context.mediaState?.player ?? 'Playing') : 'Idle',
      icon: isMediaPlaying ? Music : Headphones,
      color: isMediaPlaying ? 'text-primary' : 'text-muted/60',
    },
    {
      label: 'Idle',
      value: idleSeconds === null ? '—' : `${idleSeconds.toFixed(0)}s`,
      icon: Zap,
      color: 'text-muted',
    },
    {
      label: 'Workspace',
      value: `${context.workspace ?? '—'}`,
      icon: Rocket,
      color: 'text-muted',
    },
  ];

  return (
    <Card className="bg-surface/60 border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium text-muted uppercase tracking-widest">
          Active Context
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-2">
          {items.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-surface-elevated/50 border border-border/30 hover:border-border/60 transition-colors cursor-default"
            >
              <item.icon className={`w-4 h-4 shrink-0 ${item.color}`} strokeWidth={1.75} />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-muted/70 uppercase tracking-wider">{item.label}</p>
                <p className="text-sm font-medium text-foreground truncate">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function QuickScenes() {
  const scenes = useSceneStore((s) => s.scenes);
  const setActiveScene = useSceneStore((s) => s.setActiveScene);

  const quickScenes = scenes.filter((s) => s.isBuiltIn).slice(0, 4);

  return (
    <Card className="bg-surface/60 border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-medium text-muted uppercase tracking-widest">
            Quick Scenes
          </CardTitle>
          <Button variant="ghost" size="icon-sm" className="text-muted/60 hover:text-foreground">
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-2">
          {quickScenes.map((scene, i) => (
            <motion.button
              key={scene.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setActiveScene(scene.id)}
              className={`
                relative flex flex-col items-center gap-2 px-3 py-3 rounded-xl border transition-all duration-100
                text-left group
                ${scene.id === useSceneStore.getState().activeSceneId
                  ? 'border-primary/40 bg-primary/5 shadow-sm'
                  : 'border-border/50 bg-surface-elevated/50 hover:border-border hover:bg-surface-elevated'
                }
              `}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                style={
                  scene.visual?.accentColor
                    ? {
                        background: `${scene.visual.accentColor}18`,
                        color: scene.visual.accentColor,
                      }
                    : undefined
                }
              >
                {scene.name.charAt(0)}
              </div>
              <span className="text-xs font-medium text-foreground/90 truncate w-full text-center">
                {scene.name}
              </span>
              {scene.isFavorite && (
                <Badge variant="muted" className="text-[9px] py-0 px-1.5">
                  ★
                </Badge>
              )}
            </motion.button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function AutomationStatus() {
  const isPaused = useAppStore((s) => s.isReady ? false : false); // useAutomationStore in production
  const context = useContextStore((s) => s.context);

  return (
    <Card className="bg-surface/60 border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium text-muted uppercase tracking-widest">
          Automation
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-3">
          <div
            className={`w-2 h-2 rounded-full ${isPaused ? 'bg-muted' : 'bg-success'}`}
            style={!isPaused ? { boxShadow: '0 0 6px rgba(99,211,145,0.5)' } : undefined}
          />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              {isPaused ? 'Automation paused' : 'Automation active'}
            </p>
            <p className="text-xs text-muted">
              {context?.activeApplication
                ? `Watching ${context.activeApplication} for context changes`
                : 'Waiting for context signals'}
            </p>
          </div>
          {!isPaused && (
            <CheckCircle2 className="w-4 h-4 text-success" strokeWidth={2} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function OverviewPage() {
  return (
    <div className="h-full overflow-y-auto p-6 lg:p-8 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <TimeGreeting />
        </div>
        <div className="flex items-center gap-2 text-xs text-muted">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
          AuraOS running
        </div>
      </motion.div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <CurrentSceneCard />
          <ContextSummary />
        </div>
        <div className="space-y-4">
          <QuickScenes />
          <AutomationStatus />
        </div>
      </div>

      {/* Today's activity snippet — placeholder */}
      <Card className="bg-surface/60 border-border/50 opacity-60">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-surface-active flex items-center justify-center">
                <Clock className="w-4 h-4 text-muted/60" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground/70">Today's Activity</p>
                <p className="text-xs text-muted">Scene durations will appear here</p>
              </div>
            </div>
            <span className="text-xs text-muted/60">Connect to account to see history</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
