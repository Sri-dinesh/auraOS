export * from './scene.js';
export * from './rule.js';
export * from './context.js';
export * from './device.js';
export * from './sync.js';

import { sceneSchema, sceneCreateSchema, sceneUpdateSchema } from './scene.js';
import { ruleSchema, ruleCreateSchema, ruleUpdateSchema } from './rule.js';
import { desktopContextSchema } from './context.js';
import { deviceRegistrationSchema } from './device.js';
import { syncPushPayloadSchema, syncPullResponseSchema } from './sync.js';

export const apiSchemas = {
  scene: { create: sceneCreateSchema, update: sceneUpdateSchema, detail: sceneSchema },
  rule: { create: ruleCreateSchema, update: ruleUpdateSchema, detail: ruleSchema },
  context: { detail: desktopContextSchema },
  device: { register: deviceRegistrationSchema },
  sync: { push: syncPushPayloadSchema, pull: syncPullResponseSchema },
};
