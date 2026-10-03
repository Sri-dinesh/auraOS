import { motion } from 'framer-motion';
import {
  BookMarked,
  Download,
  Upload,
  Share2,
  Star,
  Clock,
  Check,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { useSceneStore } from '../stores';
import { Card, CardContent, Button, Badge } from '@auraos/ui';
import type { Scene } from '@auraos/types';

interface PresetCardProps {
  scene: Scene;
  onInstall?: () => void;
  isInstalled?: boolean;
}

function PresetCard({ scene, onInstall, isInstalled }: PresetCardProps) {
  const accent = scene.visual?.accentColor ?? '#ff6363';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        group relative rounded-xl border overflow-hidden transition-all duration-200
        ${isInstalled
          ? 'bg-primary/5 border-primary/20'
          : 'bg-surface-elevated/40 border-border/50 hover:border-border hover:bg-surface-elevated/60'
        }
      `}
    >
      {/* Background */}
      <div
        className="absolute inset-0 z-0 opacity-70"
        style={{
          background: scene.visual?.wallpaper?.type === 'gradient'
            ? `linear-gradient(135deg, ${scene.visual.wallpaper.colors?.[0] ?? accent}, ${scene.visual.wallpaper.colors?.[1] ?? '#a855f7'})`
            : scene.visual?.backgroundTint
            ? `linear-gradient(135deg, ${scene.visual.backgroundTint}, ${scene.visual.backgroundTint}dd)`
            : 'linear-gradient(135deg, #2d2d30, #1a1a1c)',
        }}
      />

      <div className="relative z-10 p-4">
        <div className="flex items-start justify-between mb-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold shrink-0"
            style={{ background: `${accent}20`, color: accent }}
          >
            {scene.name.charAt(0)}
          </div>
          <div className="flex items-center gap-1">
            {scene.isFavorite && (
              <Badge variant="default" className="text-[9px] py-0 px-1.5">
                <Star className="w-3 h-3 fill-current" />
              </Badge>
            )}
            {isInstalled && (
              <Badge variant="success" className="text-[9px] py-0 px-1.5">
                <Check className="w-3 h-3" />
                Installed
              </Badge>
            )}
          </div>
        </div>

        <h4 className="text-sm font-semibold text-foreground mb-0.5">{scene.name}</h4>
        {scene.description && (
          <p className="text-xs text-muted/70 line-clamp-2 mb-3">{scene.description}</p>
        )}

        <div className="flex items-center gap-3 text-[10px] text-muted/60 mb-3">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            {scene.widgets?.length ?? 0} widgets
          </span>
          {scene.behavior && (
            <span className="flex items-center gap-1 capitalize">
              <Clock className="w-3 h-3" />
              {scene.behavior.animationIntensity}
            </span>
          )}
        </div>

        {!isInstalled ? (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center gap-1.5 text-xs border border-border/50 hover:border-border"
            onClick={onInstall}
          >
            <Download className="w-3.5 h-3.5" />
            Install Scene
            <ArrowRight className="w-3 h-3" />
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-xs text-muted/60 hover:text-foreground gap-1">
              <Share2 className="w-3.5 h-3.5" />
              Share
            </Button>
            <Button variant="ghost" size="sm" className="text-xs text-muted/60 hover:text-foreground gap-1">
              <Download className="w-3.5 h-3.5" />
              Export
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function LibraryPage() {
  const scenes = useSceneStore((s) => s.scenes);
  const addScene = useSceneStore((s) => s.addScene);

  const builtIn = scenes.filter((s) => s.isBuiltIn);
  const custom = scenes.filter((s) => !s.isBuiltIn);

  const handleInstall = (scene: Scene) => {
    // Mark as installed (not built-in)
    addScene({ ...scene, isBuiltIn: false, id: `installed_${scene.id}` });
  };

  const categories = [
    {
      name: 'Atmosphere',
      description: 'Mood-based scene collections',
      icon: Sparkles,
      items: builtIn.filter((s) => ['focus', 'chill', 'night'].includes(s.id)),
    },
    {
      name: 'Activity',
      description: 'Scenes for specific tasks',
      icon: Clock,
      items: builtIn.filter((s) => ['creative', 'music', 'gaming'].includes(s.id)),
    },
    {
      name: 'My Scenes',
      description: 'Your custom and downloaded scenes',
      icon: BookMarked,
      items: custom,
    },
  ];

  return (
    <div className="h-full overflow-y-auto p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Library</h1>
          <p className="text-sm text-muted mt-0.5">Browse, download, and manage scene presets</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" className="gap-1.5">
            <Upload className="w-4 h-4" />
            Import
          </Button>
          <Button variant="secondary" size="sm" className="gap-1.5">
            <Share2 className="w-4 h-4" />
            Export All
          </Button>
        </div>
      </div>

      {/* Categories */}
      {categories.map((cat) => (
        <section key={cat.name}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-7 h-7 rounded-lg bg-surface-active flex items-center justify-center">
              <cat.icon className="w-3.5 h-3.5 text-muted/70" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">{cat.name}</h2>
              <p className="text-xs text-muted">{cat.description}</p>
            </div>
            <Badge variant="muted" className="ml-auto text-[10px]">
              {cat.items.length}
            </Badge>
          </div>

          {cat.items.length === 0 ? (
            <Card className="bg-surface/40 border-border/40">
              <CardContent className="py-8 text-center">
                <div className="w-12 h-12 rounded-xl bg-surface-active flex items-center justify-center mx-auto mb-3">
                  <cat.icon className="w-6 h-6 text-muted/30" />
                </div>
                <p className="text-sm text-muted mb-1">No {cat.name.toLowerCase()} yet</p>
                <p className="text-xs text-muted/60">
                  {cat.name === 'My Scenes' ? 'Create or download scenes to see them here' : 'Check back later for new additions'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {cat.items.map((scene) => (
                <PresetCard
                  key={scene.id}
                  scene={scene}
                  isInstalled={!scene.isBuiltIn}
                  onInstall={() => handleInstall(scene)}
                />
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
