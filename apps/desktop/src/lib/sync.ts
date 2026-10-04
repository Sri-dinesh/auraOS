import {
  devicesApi,
  syncApi,
  authApi,
  ApiError,
} from './api';
import { useSceneStore } from '../stores';
import { useAutomationStore } from '../stores';
import { useAppStore } from '../stores';
import { useSettingsStore } from '../stores';
import type { Scene, Rule } from '@auraos/types';

const DEVICE_ID_KEY = 'auraos_device_id';
const AUTH_TOKEN_KEY = 'auraos_token';
const SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

function getAuthToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }
}

interface DeviceInfo {
  deviceName: string;
  platform: string;
  architecture: string;
  osVersion: string;
  appVersion: string;
}

async function getDeviceInfo(): Promise<DeviceInfo> {
  const platform = navigator.platform;
  let osVersion = 'unknown';
  let architecture = 'unknown';

  if (platform.includes('Win')) {
    osVersion = 'Windows';
    architecture = platform.includes('64') ? 'x86_64' : 'x86';
  } else if (platform.includes('Mac')) {
    osVersion = 'macOS';
    architecture = platform.includes('Arm') ? 'arm64' : 'x86_64';
  } else if (platform.includes('Linux')) {
    osVersion = 'Linux';
    architecture = platform.includes('64') ? 'x86_64' : 'x86';
  }

  return {
    deviceName: 'AuraOS Device',
    platform: osVersion.toLowerCase(),
    architecture,
    osVersion,
    appVersion: '0.1.0',
  };
}

function mapApiSceneToFrontend(apiScene: Record<string, unknown>): Scene {
  return {
    id: apiScene.id as string,
    name: apiScene.name as string,
    description: apiScene.description as string | undefined,
    slug: apiScene.slug as string | undefined,
    visual: apiScene.visualConfig as Scene['visual'],
    audio: apiScene.audioConfig as Scene['audio'],
    widgets: apiScene.widgetConfig as Scene['widgets'],
    behavior: apiScene.behaviorConfig as Scene['behavior'],
    isBuiltIn: apiScene.isBuiltIn as boolean,
    isFavorite: apiScene.isFavorite as boolean,
    version: apiScene.version as number,
    createdAt: apiScene.createdAt as string,
    updatedAt: apiScene.updatedAt as string,
  };
}

function mapApiRuleToFrontend(apiRule: Record<string, unknown>): Rule {
  return {
    id: apiRule.id as string,
    name: apiRule.name as string,
    description: apiRule.description as string | undefined,
    conditions: apiRule.conditions as Rule['conditions'],
    conditionOperator: apiRule.operator as Rule['conditionOperator'],
    action: apiRule.action as Rule['action'],
    priority: apiRule.priority as number,
    cooldownMs: apiRule.cooldownMs as number | undefined,
    enabled: apiRule.enabled as boolean,
    createdAt: apiRule.createdAt as string,
    updatedAt: apiRule.updatedAt as string,
  };
}

function mapFrontendSceneToApi(scene: Scene): Record<string, unknown> {
  return {
    id: scene.id,
    name: scene.name,
    slug: scene.slug ?? scene.id,
    description: scene.description,
    visualConfig: scene.visual,
    audioConfig: scene.audio,
    widgetConfig: scene.widgets,
    behaviorConfig: scene.behavior,
    isBuiltIn: scene.isBuiltIn,
    isFavorite: scene.isFavorite,
    version: scene.version ?? 1,
    updatedAt: scene.updatedAt ?? new Date().toISOString(),
  };
}

function mapFrontendRuleToApi(rule: Rule): Record<string, unknown> {
  return {
    id: rule.id,
    name: rule.name,
    description: rule.description,
    conditions: rule.conditions,
    operator: rule.conditionOperator,
    action: rule.action,
    priority: rule.priority,
    cooldownMs: rule.cooldownMs,
    enabled: rule.enabled,
    updatedAt: rule.updatedAt ?? new Date().toISOString(),
  };
}

export async function registerDevice(): Promise<string | null> {
  const deviceId = getDeviceId();
  const token = getAuthToken();

  if (!token) {
    console.log('[Sync] No auth token, skipping device registration');
    return null;
  }

  try {
    const deviceInfo = await getDeviceInfo();
    await devicesApi.register({
      ...deviceInfo,
      deviceName: `${deviceInfo.deviceName} (${deviceId.slice(0, 8)})`,
    });
    console.log('[Sync] Device registered:', deviceId);
    return deviceId;
  } catch (err) {
    if (err instanceof ApiError && err.statusCode === 401) {
      console.log('[Sync] Auth expired, clearing token');
      setAuthToken(null);
      useAppStore.getState().setAuthenticated(false);
    }
    console.error('[Sync] Device registration failed:', err);
    return null;
  }
}

export async function syncWithServer(): Promise<boolean> {
  const token = getAuthToken();
  const settings = useSettingsStore.getState();

  if (!token || !settings.syncEnabled) {
    return false;
  }

  const deviceId = getDeviceId();
  let success = false;

  try {
    // Pull latest from server
    const pullResult = await syncApi.pull();
    console.log('[Sync] Pulled', pullResult.entities.length, 'entities');

    // Apply pulled scenes
    for (const entity of pullResult.entities) {
      if (entity.type === 'scene') {
        const scene = mapApiSceneToFrontend(entity.data as Record<string, unknown>);
        // Check if already exists
        const existing = useSceneStore.getState().scenes.find((s) => s.id === scene.id);
        if (existing) {
          useSceneStore.getState().updateScene(scene.id, scene);
        } else {
          useSceneStore.getState().addScene(scene);
        }
      }
    }

    // Apply pulled rules
    for (const entity of pullResult.entities) {
      if (entity.type === 'rule') {
        const rule = mapApiRuleToFrontend(entity.data as Record<string, unknown>);
        const existing = useAutomationStore.getState().rules.find((r) => r.id === rule.id);
        if (existing) {
          useAutomationStore.getState().updateRule(rule.id, rule);
        } else {
          useAutomationStore.getState().addRule(rule);
        }
      }
    }

    // Push local changes
    const scenes = useSceneStore.getState().scenes;
    const rules = useAutomationStore.getState().rules;

    const changes = [
      ...scenes.map((s) => ({
        id: s.id,
        type: 'scene' as const,
        version: s.version ?? 1,
        updatedAt: s.updatedAt ?? new Date().toISOString(),
        deviceId,
        data: mapFrontendSceneToApi(s),
      })),
      ...rules.map((r) => ({
        id: r.id,
        type: 'rule' as const,
        version: 1,
        updatedAt: r.updatedAt ?? new Date().toISOString(),
        deviceId,
        data: mapFrontendRuleToApi(r),
      })),
    ];

    if (changes.length > 0) {
      await syncApi.push(changes);
    }

    success = true;
  } catch (err) {
    if (err instanceof ApiError && err.statusCode === 401) {
      console.log('[Sync] Auth expired during sync');
      setAuthToken(null);
      useAppStore.getState().setAuthenticated(false);
    }
    console.error('[Sync] Sync failed:', err);
  }

  return success;
}

let syncInterval: ReturnType<typeof setInterval> | null = null;

export function startSyncLoop(): void {
  if (syncInterval) return;

  // Initial sync
  syncWithServer();

  // Periodic sync
  syncInterval = setInterval(() => {
    syncWithServer();
  }, SYNC_INTERVAL_MS);

  // Also sync when online status changes
  window.addEventListener('online', () => {
    useAppStore.getState().setOnline(true);
    syncWithServer();
  });

  window.addEventListener('offline', () => {
    useAppStore.getState().setOnline(false);
  });

  console.log('[Sync] Sync loop started');
}

export function stopSyncLoop(): void {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
}

export async function login(email: string, password: string): Promise<boolean> {
  try {
    const result = await authApi.signIn(email, password);
    if (result?.token) {
      setAuthToken(result.token);
      useAppStore.getState().setAuthenticated(true);
      await registerDevice();
      startSyncLoop();
      return true;
    }
  } catch (err) {
    console.error('[Sync] Login failed:', err);
  }
  return false;
}

export function logout(): void {
  setAuthToken(null);
  useAppStore.getState().setAuthenticated(false);
  stopSyncLoop();
}

export function isAuthenticated(): boolean {
  return !!getAuthToken();
}

export { getDeviceId, getAuthToken };
