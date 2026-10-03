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
  conflicts: Array<{
    id: string;
    type: SyncObjectType;
    localVersion: number;
    remoteVersion: number;
    localData: Record<string, unknown>;
    remoteData: Record<string, unknown>;
    resolved?: boolean;
  }>;
}

export interface SyncStatus {
  online: boolean;
  lastSyncAt: string | null;
  pendingChanges: number;
  deviceId: string;
}
