export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

export interface ApplicationInfo {
  name: string;
  executable: string;
  windowTitle: string | null;
  pid: number;
  workspace?: number;
}

export interface BatteryState {
  level: number;
  charging: boolean;
  pluggedIn: boolean;
}

export interface MediaState {
  playing: boolean;
  player: string | null;
  title: string | null;
  artist: string | null;
  album: string | null;
  artworkUrl: string | null;
}

export interface DesktopContext {
  activeApplication: ApplicationInfo | null;
  windowTitle: string | null;
  timestamp: number;
  battery: BatteryState | null;
  charging: boolean;
  mediaState: MediaState | null;
  idleTimeSeconds: number;
  platform: string;
  workspace: number;
  timeOfDay: TimeOfDay;
  hour: number;
}

export type ContextChangedEvent = DesktopContext;

export interface ContextSignal {
  type: 'context://changed';
  payload: DesktopContext;
  source: 'system';
  timestamp: number;
}

export interface ActivityAggregate {
  sceneId: string;
  sceneName: string;
  durationSeconds: number;
  startedAt: number;
  endedAt: number;
}

export interface ContextDebugInfo {
  activeApplication: string | null;
  batteryLevel: number | null;
  charging: boolean | null;
  mediaPlaying: boolean | null;
  mediaPlayer: string | null;
  idleSeconds: number;
  timeOfDay: TimeOfDay | null;
  hour: number;
  workspace: number;
  platform: string;
}
