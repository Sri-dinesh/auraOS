export type SyncObjectType = 'scene' | 'rule' | 'preset' | 'preference';

export interface SyncEntity {
  id: string;
  type: SyncObjectType;
  version: number;
  updatedAt: string;
  deviceId: string;
  data: Record<string, unknown>;
  deleted?: boolean;
}

export interface SyncPushPayload {
  changes: SyncEntity[];
  deviceId: string;
  timestamp: number;
}

export interface SyncPullResponse {
  entities: SyncEntity[];
  serverTimestamp: string;
  conflicts: SyncConflict[];
}

export interface SyncConflict {
  id: string;
  type: SyncObjectType;
  localVersion: number;
  remoteVersion: number;
  localData: Record<string, unknown>;
  remoteData: Record<string, unknown>;
  resolved?: boolean;
}

export interface SyncStatus {
  online: boolean;
  lastSyncAt: string | null;
  pendingChanges: number;
  deviceId: string;
}

export interface SyncProtocolVersion {
  major: number;
  minor: number;
  revision: number;
}

export const CURRENT_SYNC_PROTOCOL_VERSION: SyncProtocolVersion = {
  major: 1,
  minor: 0,
  revision: 0,
};
