import { useState } from 'react';
import {
  Settings,
  Monitor,
  Sparkles,
  Music,
  Cloud,
  Shield,
  Users,
  Info,
  Download,
  Check,
  ExternalLink,
  Keyboard,
  Globe,
  Moon,
  Zap,
} from 'lucide-react';
import { useSettingsStore, useAppStore } from '../stores';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  Button,
  Switch,
  Slider,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Separator,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@auraos/ui';

interface Section {
  id: string;
  label: string;
  icon: React.ElementType;
  description: string;
}

const sections: Section[] = [
  { id: 'general', label: 'General', icon: Settings, description: 'Startup, window, and shortcut preferences' },
  { id: 'appearance', label: 'Appearance', icon: Monitor, description: 'Visual effects, overlays, and motion' },
  { id: 'automation', label: 'Automation', icon: Zap, description: 'Rules, scenes, and triggers' },
  { id: 'audio', label: 'Audio', icon: Music, description: 'Ambient sound and media integration' },
  { id: 'sync', label: 'Sync', icon: Cloud, description: 'Cloud sync and account settings' },
  { id: 'privacy', label: 'Privacy', icon: Shield, description: 'Data collection and permissions' },
  { id: 'about', label: 'About', icon: Info, description: 'Version, updates, and licenses' },
];

export function SettingsPage() {
  const settings = useSettingsStore();
  const updateSetting = useSettingsStore((s) => s.updateSetting);
  const loadSettings = useSettingsStore((s) => s.loadSettings);
  const isOnline = useAppStore((s) => s.isOnline);

  const [activeSection, setActiveSection] = useState('general');

  const currentSection = sections.find((s) => s.id === activeSection) ?? sections[0]!;

  // Load saved settings on mount (stub)
  useState(() => {
    // In production: load from Tauri Store
    loadSettings({
      soundEnabled: true,
      notificationsEnabled: true,
      autostartEnabled: true,
      startMinimized: true,
      restoreOnLaunch: true,
      reduceMotion: false,
      highContrast: false,
      performanceMode: 'auto',
      globalShortcut: 'CommandOrControl+Shift+Space',
      syncEnabled: true,
      privacyTelemetryEnabled: false,
      setSelectedSceneOnApp: null,
    });
  });

  return (
    <div className="h-full overflow-y-auto p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-muted mt-0.5">{currentSection.description}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted">
          <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-success' : 'bg-destructive'}`} />
          {isOnline ? 'Online' : 'Offline'}
        </div>
      </div>

      {/* Section tabs */}
      <Tabs value={activeSection} onValueChange={setActiveSection}>
        <TabsList className="bg-surface/60 border-border/50 w-full overflow-x-auto">
          {sections.map((s) => (
            <TabsTrigger
              key={s.id}
              value={s.id}
              className="gap-2 text-xs whitespace-nowrap rounded-lg px-3 py-1.5"
            >
              <s.icon className="w-3.5 h-3.5" />
              {s.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* General */}
        <TabsContent value="general" className="mt-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Startup & Window</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Globe className="w-4 h-4 text-muted/60" />
                  <div>
                    <p className="text-sm font-medium">Launch at login</p>
                    <p className="text-xs text-muted">Start AuraOS when you log in</p>
                  </div>
                </div>
                <Switch checked={settings.autostartEnabled} onCheckedChange={(v: boolean) => updateSetting('autostartEnabled', v)} />
              </div>
              <Separator className="bg-border/30" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Settings className="w-4 h-4 text-muted/60" />
                  <div>
                    <p className="text-sm font-medium">Start minimized</p>
                    <p className="text-xs text-muted">Run in system tray on launch</p>
                  </div>
                </div>
                <Switch checked={settings.startMinimized} onCheckedChange={(v: boolean) => updateSetting('startMinimized', v)} />
              </div>
              <Separator className="bg-border/30" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Monitor className="w-4 h-4 text-muted/60" />
                  <div>
                    <p className="text-sm font-medium">Restore previous scene</p>
                    <p className="text-xs text-muted">Reapply the last scene on startup</p>
                  </div>
                </div>
                <Switch checked={settings.restoreOnLaunch} onCheckedChange={(v: boolean) => updateSetting('restoreOnLaunch', v)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Global Shortcut</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Keyboard className="w-4 h-4 text-muted/60" />
                <div className="flex-1">
                  <p className="text-sm font-medium mb-1">Quick Switcher</p>
                  <p className="text-xs text-muted">Press to open scene switcher from anywhere</p>
                </div>
                <kbd className="px-3 py-1.5 rounded-lg bg-surface-elevated border border-border/50 text-sm text-foreground font-mono cursor-pointer hover:bg-surface-active transition-colors">
                  {settings.globalShortcut}
                </kbd>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted">
                <Keyboard className="w-3.5 h-3.5" />
                Change shortcut
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">System Tray</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Show in tray menu</p>
                    <p className="text-xs text-muted">Show current scene and quick actions</p>
                  </div>
                  <Switch checked={true} onCheckedChange={() => {}} />
                </div>
                <Separator className="bg-border/30" />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Show notifications</p>
                    <p className="text-xs text-muted">Scene change and update notifications</p>
                  </div>
                  <Switch checked={settings.notificationsEnabled} onCheckedChange={(v: boolean) => updateSetting('notificationsEnabled', v)} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance */}
        <TabsContent value="appearance" className="mt-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Effects & Motion</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Zap className="w-4 h-4 text-muted/60" />
                  <div>
                    <p className="text-sm font-medium">Enable particles</p>
                    <p className="text-xs text-muted">Ambient particle effects in scenes</p>
                  </div>
                </div>
                <Switch checked={true} onCheckedChange={() => {}} />
              </div>
              <Separator className="bg-border/30" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-4 h-4 text-muted/60" />
                  <div>
                    <p className="text-sm font-medium">Enable glow effects</p>
                    <p className="text-xs text-muted">Accent color glow overlays</p>
                  </div>
                </div>
                <Switch checked={true} onCheckedChange={() => {}} />
              </div>
              <Separator className="bg-border/30" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Moon className="w-4 h-4 text-muted/60" />
                  <div>
                    <p className="text-sm font-medium">Enable vignette</p>
                    <p className="text-xs text-muted">Darken edges of the screen</p>
                  </div>
                </div>
                <Switch checked={true} onCheckedChange={() => {}} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Motion Sensitivity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Reduce motion</p>
                  <p className="text-xs text-muted">Respect OS reduced motion preference</p>
                </div>
                <Switch checked={settings.reduceMotion} onCheckedChange={(v: boolean) => updateSetting('reduceMotion', v)} />
              </div>
              <Separator className="bg-border/30" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">High contrast mode</p>
                  <p className="text-xs text-muted">Increase contrast for accessibility</p>
                </div>
                <Switch checked={settings.highContrast} onCheckedChange={(v: boolean) => updateSetting('highContrast', v)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Performance Mode</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Performance mode</p>
                  <p className="text-xs text-muted">How AuraOS adjusts effects based on system load</p>
                </div>
              </div>
              <Select
                value={settings.performanceMode}
                onValueChange={(v: string) => updateSetting('performanceMode', v as typeof settings.performanceMode)}
              >
                <SelectTrigger className="w-full bg-surface/80 border-border/50 mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="performance">Performance — Full effects, 60 FPS</SelectItem>
                  <SelectItem value="balanced">Balanced — Reduced particles, 30 FPS</SelectItem>
                  <SelectItem value="battery-saver">Battery Saver — Minimal effects</SelectItem>
                  <SelectItem value="auto">Auto — Based on power state</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
            <CardFooter>
              <p className="text-xs text-muted">
                {settings.performanceMode === 'auto'
                  ? 'AuraOS will switch automatically when charging vs on battery'
                  : `Currently set to ${settings.performanceMode.replace('-', ' ')} mode`}
              </p>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Automation */}
        <TabsContent value="automation" className="mt-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Rules Engine</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Zap className="w-4 h-4 text-muted/60" />
                    <div>
                      <p className="text-sm font-medium">Enable automation</p>
                      <p className="text-xs text-muted">Let AuraOS switch scenes automatically</p>
                    </div>
                  </div>
                  <Switch checked={true} onCheckedChange={() => {}} />
                </div>
                <Separator className="bg-border/30" />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Default scene</p>
                    <p className="text-xs text-muted">Fallback when no rules match</p>
                  </div>
                  <Select>
                    <SelectTrigger className="w-[140px] bg-surface/80 border-border/50 text-xs">
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="focus">Deep Focus</SelectItem>
                      <SelectItem value="chill">Chill</SelectItem>
                      <SelectItem value="creative">Creative Flow</SelectItem>
                      <SelectItem value="music">Music</SelectItem>
                      <SelectItem value="gaming">Gaming</SelectItem>
                      <SelectItem value="night">Night</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audio */}
        <TabsContent value="audio" className="mt-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Ambient Audio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Music className="w-4 h-4 text-muted/60" />
                  <div>
                    <p className="text-sm font-medium">Enable ambient sound</p>
                    <p className="text-xs text-muted">Play ambient sounds per scene</p>
                  </div>
                </div>
                <Switch checked={settings.soundEnabled} onCheckedChange={(v: boolean) => updateSetting('soundEnabled', v)} />
              </div>
              <Separator className="bg-border/30" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Default volume</p>
                  <p className="text-xs text-muted">Ambient sound volume level</p>
                </div>
                <div className="flex items-center gap-3">
              <Slider
                min={0}
                max={100}
                value={50}
                onValueChange={() => {}}
                formatLabel={(v: number) => `${v}%`}
                className="w-24"
              />
                  <span className="text-xs text-muted w-8 text-right">50%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sync */}
        <TabsContent value="sync" className="mt-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Cloud Sync</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Cloud className="w-4 h-4 text-muted/60" />
                    <div>
                      <p className="text-sm font-medium">Enable cloud sync</p>
                      <p className="text-xs text-muted">Sync scenes and rules across devices</p>
                    </div>
                  </div>
                  <Switch checked={settings.syncEnabled} onCheckedChange={(v: boolean) => updateSetting('syncEnabled', v)} />
                </div>
                <Separator className="bg-border/30" />
                {settings.syncEnabled ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Last synced</p>
                        <p className="text-xs text-muted">Just now</p>
                      </div>
                      <Badge variant="success" className="gap-1">
                        <Check className="w-3 h-3" />
                        Synced
                      </Badge>
                    </div>
                    <Button variant="ghost" size="sm" className="gap-1.5 text-muted">
                      <Download className="w-3.5 h-3.5" />
                      Sync now
                    </Button>
                  </>
                ) : (
                  <div className="text-sm text-muted">
                    Enable cloud sync to access your scenes from any device
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Devices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-surface-elevated/50 border border-border/30">
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 text-muted/60" />
                    <div>
                      <p className="text-sm font-medium">Dinesh Arch Laptop</p>
                      <p className="text-xs text-muted">Linux · x86_64 · AuraOS 0.1.0</p>
                    </div>
                  </div>
                  <Badge variant="success" className="text-[9px]">Connected</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy */}
        <TabsContent value="privacy" className="mt-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Diagnostics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className="w-4 h-4 text-muted/60" />
                    <div>
                      <p className="text-sm font-medium">Share anonymous diagnostics</p>
                      <p className="text-xs text-muted">Help us improve AuraOS with crash reports and performance data</p>
                    </div>
                  </div>
                  <Switch checked={settings.privacyTelemetryEnabled} onCheckedChange={(v: boolean) => updateSetting('privacyTelemetryEnabled', v)} />
                </div>
                <Separator className="bg-border/30" />
                <p className="text-xs text-muted/70 leading-relaxed">
                  AuraOS processes context locally. We never upload window titles, browsing history, or file names.
                  Diagnostics include only scene usage durations and crash logs.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Permissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { label: 'Active application detection', granted: true },
                  { label: 'Media playback monitoring', granted: true },
                  { label: 'Wallpaper control', granted: true },
                  { label: 'System notifications', granted: false },
                  { label: 'Global shortcut registration', granted: true },
                  { label: 'Autostart', granted: true },
                ].map((perm) => (
                  <div
                    key={perm.label}
                    className="flex items-center justify-between py-2 px-3 rounded-lg bg-surface-elevated/50 border border-border/30"
                  >
                    <span className="text-sm text-foreground/90">{perm.label}</span>
                    {perm.granted ? (
                      <Badge variant="success" className="text-[9px] gap-1">
                        <Check className="w-3 h-3" />
                        Granted
                      </Badge>
                    ) : (
                      <Button variant="ghost" size="sm" className="text-xs text-muted/60">
                        <ExternalLink className="w-3 h-3" />
                        Request
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* About */}
        <TabsContent value="about" className="mt-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">AuraOS</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-aura flex items-center justify-center glow-aura">
                  <Settings className="w-6 h-6 text-background" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-lg font-semibold">AuraOS</p>
                  <p className="text-sm text-muted">Version 0.1.0 · Alpha</p>
                </div>
              </div>
              <Separator className="bg-border/30 my-4" />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted text-xs uppercase tracking-wider mb-1">API</p>
                  <p className="text-foreground/80">http://localhost:3000</p>
                </div>
                <div>
                  <p className="text-muted text-xs uppercase tracking-wider mb-1">Sync</p>
                  <p className="text-foreground/80">{isOnline ? 'Connected' : 'Offline'}</p>
                </div>
                <div>
                  <p className="text-muted text-xs uppercase tracking-wider mb-1">Architecture</p>
                  <p className="text-foreground/80">x86_64</p>
                </div>
                <div>
                  <p className="text-muted text-xs uppercase tracking-wider mb-1">OS</p>
                  <p className="text-foreground/80">Linux</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Updates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Check for updates</p>
                  <p className="text-xs text-muted">Check for the latest version of AuraOS</p>
                </div>
                <Button variant="secondary" size="sm" className="gap-1.5">
                  <Download className="w-3.5 h-3.5" />
                  Check
                </Button>
              </div>
              <Separator className="bg-border/30" />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">Automatic updates</span>
                <Switch checked={true} onCheckedChange={() => {}} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Licenses</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted space-y-2 max-h-48 overflow-y-auto">
              {[
                { name: 'Tauri', license: 'Apache 2.0' },
                { name: 'React', license: 'MIT' },
                { name: 'Framer Motion', license: 'MIT' },
                { name: 'Radix UI', license: 'MIT' },
                { name: 'Tailwind CSS', license: 'MIT' },
                { name: 'Prisma', license: 'Apache 2.0' },
                { name: 'Fastify', license: 'MIT' },
                { name: 'Better Auth', license: 'MIT' },
                { name: 'Zustand', license: 'MIT' },
                { name: 'TanStack Query', license: 'MIT' },
                { name: 'Lucide React', license: 'ISC' },
                { name: 'Class Variance Authority', license: 'MIT' },
              ].map((pkg) => (
                <div key={pkg.name} className="flex justify-between py-1">
                  <span className="text-foreground/70">{pkg.name}</span>
                  <span className="text-muted/60">{pkg.license}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
