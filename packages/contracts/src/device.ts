export type Platform = 'windows' | 'linux' | 'macos';

export type Architecture = 'x86_64' | 'aarch64' | 'arm64';

export interface DeviceInfo {
  id: string;
  userId?: string;

  deviceName: string;
  platform: Platform;
  architecture: Architecture;
  osVersion: string;
  appVersion: string;

  lastSeenAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DeviceRegistrationPayload {
  deviceName: string;
  platform: Platform;
  architecture: Architecture;
  osVersion: string;
  appVersion: string;
}

export interface DeviceSyncState {
  deviceId: string;
  lastSyncTimestamp: number;
  pendingChanges: string[];
  dirtyCount: number;
}
