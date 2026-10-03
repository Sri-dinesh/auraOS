import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Star,
  StarOff,
  Plus,
  Trash2,
  Play,
  Edit3,
  Search,
  Filter,
  ChevronRight,
} from 'lucide-react';
import { useSceneStore, useOverlayStore, useAppStore } from '../stores';
import { Button, Badge, Input } from '@auraos/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@auraos/ui';
import type { Scene } from '@auraos/types';

interface SceneCardProps {
  scene: Scene;
  isActive: boolean;
  isFavorited: boolean;
  onActivate: () => void;
  onToggleFavorite: () => void;
}

function SceneCard({ scene, isActive, isFavorited, onActivate, onToggleFavorite }: SceneCardProps) {
  const accent = scene.visual?.accentColor ?? '#ff6363';
  const intensity = scene.behavior?.animationIntensity ?? 'medium';
  const hasOverlay = scene.visual?.overlayOpacity ? scene.visual.overlayOpacity > 0 : false;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`
        group relative rounded-xl border bg-surface overflow-hidden transition-all duration-200
        ${isActive
          ? 'border-primary/30 shadow-lg shadow-primary/5'
          : 'border-border/60 hover:border-border hover:shadow-sm'
        }
      `}
    >
      {/* Preview gradient */}
      <div
        className="absolute inset-0 z-0 opacity-80"
        style={{
          background: scene.visual?.wallpaper?.type === 'gradient'
            ? `linear-gradient(135deg, ${scene.visual.wallpaper.colors?.[0] ?? accent}, ${scene.visual.wallpaper.colors?.[1] ?? '#a855f7'})`
            : scene.visual?.backgroundTint
            ? `linear-gradient(135deg, ${scene.visual.backgroundTint}, ${scene.visual.backgroundTint}dd)`
            : `linear-gradient(135deg, #1a1a1a, #2d2d30)`,
        }}
      />

      {/* Accent watermark */}
      <div
        className="absolute top-3 right-3 z-10 w-6 h-6 rounded-full blur-sm"
        style={{ background: accent, opacity: 0.3 }}
      />

      {/* Scene preview icon */}
      <div className="absolute top-3 left-3 z-10">
        <Badge variant="outline" className="bg-background/70 backdrop-blur-sm text-xs gap-1">
          {scene.slug}
        </Badge>
      </div>

      {/* Actions overlay */}
      <div className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-between px-3 py-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-1">
          <button
            onClick={onActivate}
            className={`
              w-7 h-7 rounded-md flex items-center justify-center transition-colors
              ${isActive ? 'bg-primary/30 text-primary' : 'bg-background/70 backdrop-blur-sm text-white/80 hover:bg-background/90'}
            `}
            title={isActive ? 'Active' : 'Activate'}
          >
            <Play className="w-3.5 h-3.5" fill={isActive ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={onToggleFavorite}
            className={`
              w-7 h-7 rounded-md flex items-center justify-center transition-colors text-[11px]
              ${isFavorited ? 'text-amber-400' : 'text-white/40 hover:text-white/70'}
            `}
          >
            {isFavorited ? <Star className="w-3.5 h-3.5 fill-current" /> : <StarOff className="w-3.5 h-3.5" />}
          </button>
          <div className="w-px h-4 bg-white/20 mx-1" />
          <button
            className="w-7 h-7 rounded-md flex items-center justify-center bg-background/70 backdrop-blur-sm text-white/60 hover:text-white transition-colors"
            title="Edit scene"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            className="w-7 h-7 rounded-md flex items-center justify-center bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
            title="Delete scene"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
        <ChevronRight className="w-4 h-4 text-white/40" />
      </div>

      {/* Content */}
      <div className="relative z-10 p-4 pb-8">
        <div className="text-center mb-4">
          <div
            className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center text-xl font-bold mb-2"
            style={{
              background: `${accent}20`,
              color: accent,
            }}
          >
            {scene.name.charAt(0)}
          </div>
          <h3 className="text-sm font-semibold text-white/90">{scene.name}</h3>
          {scene.description && (
            <p className="text-xs text-white/50 mt-0.5 line-clamp-2">{scene.description}</p>
          )}
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-center gap-3 text-[10px] text-white/40">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            {intensity}
          </span>
          {hasOverlay && (
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
              {Math.round(scene.visual?.overlayOpacity ?? 0 * 100)}% overlay
            </span>
          )}
          {scene.widgets && scene.widgets.length > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
              {scene.widgets.length} widget{scene.widgets.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function ScenesPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'favorite' | 'active'>('all');

  const scenes = useSceneStore((s) => s.scenes);
  const activeSceneId = useSceneStore((s) => s.activeSceneId);
  const setActiveScene = useSceneStore((s) => s.setActiveScene);
  const addScene = useSceneStore((s) => s.addScene);
  const updateScene = useSceneStore((s) => s.updateScene);

  const isAuthenticated = useAppStore((s) => s.isAuthenticated);

  const filteredScenes = useMemo(() => {
    let result = [...scenes];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description?.toLowerCase().includes(q) ||
          s.slug?.toLowerCase().includes(q)
      );
    }

    switch (filter) {
      case 'favorite':
        result = result.filter((s) => s.isFavorite);
        break;
      case 'active':
        result = result.filter((s) => s.id === activeSceneId);
        break;
    }

    return result;
  }, [scenes, search, filter, activeSceneId]);

  const handleToggleFavorite = (scene: Scene) => {
    updateScene(scene.id, { isFavorite: !scene.isFavorite });

    // Sync to cloud if authenticated
    if (isAuthenticated) {
      // scenesApi.setFavorite(scene.id, !scene.isFavorite)
    }
  };

  const handleActivate = (scene: Scene) => {
    // Deactivate current
    if (activeSceneId) {
      const prev = scenes.find((s) => s.id === activeSceneId);
      if (prev) {
        // Notify Rust
      }
    }

    setActiveScene(scene.id);
    useOverlayStore.getState().applySceneVisuals(scene);

    // Sync to cloud
    if (isAuthenticated) {
      // scenesApi.update(scene.id, { lastUsedAt: new Date().toISOString() })
    }
  };

  const handleCreateScene = () => {
    const newScene: Scene = {
      id: `scene_${Date.now()}`,
      name: 'New Scene',
      slug: `scene-${Date.now()}`,
      visual: {
        backgroundTint: '#202123',
        overlayOpacity: 0.15,
        accentColor: '#ff6363',
        effects: {
          particles: { enabled: true, type: 'dust', density: 3, speed: 0.3, opacity: 0.4 },
          glow: { enabled: true, color: '#ff6363', intensity: 0.15, radius: 120 },
        },
      },
      behavior: {
        animationIntensity: 'medium',
        performanceMode: 'balanced',
      },
      isBuiltIn: false,
      isFavorite: false,
      widgets: [{ id: 'clock', type: 'clock', position: 'top-right', size: 'small', enabled: true }],
    };
    addScene(newScene);
    setActiveScene(newScene.id);
  };

  return (
    <div className="h-full overflow-y-auto p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Scenes</h1>
          <p className="text-sm text-muted mt-0.5">Choose or create desktop atmospheres</p>
        </div>
        <Button onClick={handleCreateScene} className="gap-2">
          <Plus className="w-4 h-4" />
          New Scene
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/60" />
          <Input
            placeholder="Search scenes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-surface-elevated/50 border-border/50"
          />
        </div>
        <div className="flex gap-2">
          <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <SelectTrigger className="w-[140px] bg-surface-elevated/50 border-border/50 text-xs">
              <Filter className="w-3.5 h-3.5 mr-1.5 text-muted/60" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All scenes</SelectItem>
              <SelectItem value="favorite">Favorites</SelectItem>
              <SelectItem value="active">Active only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Scene grid */}
      {filteredScenes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-surface-active flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-muted/30" strokeWidth={1.5} />
          </div>
          <p className="text-sm font-medium text-muted mb-1">No scenes found</p>
          <p className="text-xs text-muted/60 mb-4">
            {search ? 'Try a different search term' : 'Create your first scene to get started'}
          </p>
          {!search && (
            <Button variant="secondary" size="sm" onClick={handleCreateScene} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Scene
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredScenes.map((scene) => (
            <SceneCard
              key={scene.id}
              scene={scene}
              isActive={scene.id === activeSceneId}
              isFavorited={scene.isFavorite ?? false}
              onActivate={() => handleActivate(scene)}
              onToggleFavorite={() => handleToggleFavorite(scene)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
