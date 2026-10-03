import { z } from 'zod';

export const conditionOperatorSchema = z.enum([
  'equals', 'not_equals', 'contains', 'starts_with',
  'greater_than', 'less_than', 'between', 'in', 'not_in',
]);

export const conditionFieldSchema = z.enum([
  'active_application', 'active_window_title', 'time_of_day', 'hour',
  'charging', 'battery_level', 'media_playing', 'media_player',
  'idle_seconds', 'platform', 'workspace', 'manual_override',
]);

export const conditionSchema = z.object({
  field: conditionFieldSchema,
  operator: conditionOperatorSchema,
  value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]),
}).refine(
  (c) => {
    if (c.operator === 'between') {
      return Array.isArray(c.value) && c.value.length === 2 && typeof c.value[0] === 'number' && typeof c.value[1] === 'number';
    }
    if (c.operator === 'in' || c.operator === 'not_in') {
      return Array.isArray(c.value) && c.value.length > 0;
    }
    return true;
  },
  { message: 'Value must match the operator requirements', path: ['value'] },
);

export const conditionGroupOperatorSchema = z.enum(['AND', 'OR']);

export const ruleActionTypeSchema = z.enum([
  'ACTIVATE_SCENE', 'DEACTIVATE_SCENE', 'SET_VOLUME', 'SET_BRIGHTNESS', 'SEND_NOTIFICATION',
]);

export const ruleActionSchema = z.object({
  type: ruleActionTypeSchema,
  sceneId: z.string().optional(),
  volume: z.number().min(0).max(1).optional(),
  brightness: z.number().min(0).max(100).optional(),
  notification: z.object({
    title: z.string().max(128),
    body: z.string().max(512),
  }).optional(),
}).refine(
  (a) => {
    switch (a.type) {
      case 'ACTIVATE_SCENE':
        return !!a.sceneId;
      case 'DEACTIVATE_SCENE':
        return !!a.sceneId;
      case 'SET_VOLUME':
        return typeof a.volume === 'number';
      case 'SET_BRIGHTNESS':
        return typeof a.brightness === 'number';
      case 'SEND_NOTIFICATION':
        return !!a.notification;
      default:
        return true;
    }
  },
  { message: 'Action type requires corresponding fields', path: ['sceneId'] },
);

export const ruleSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(64),
  description: z.string().max(256).optional(),
  conditions: z.array(conditionSchema).min(1),
  conditionOperator: conditionGroupOperatorSchema,
  action: ruleActionSchema,
  priority: z.number().int().min(0).max(1000),
  cooldownMs: z.number().int().min(0).max(3600000).optional(),
  enabled: z.boolean(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export const ruleCreateSchema = ruleSchema.partial({
  id: true,
  createdAt: true,
  updatedAt: true,
}).merge(z.object({
  id: z.string().optional(),
}));

export const ruleUpdateSchema = ruleSchema.partial();

export type Condition = z.infer<typeof conditionSchema>;
export type RuleFormData = z.infer<typeof ruleSchema>;
export type RuleCreateData = z.infer<typeof ruleCreateSchema>;
export type RuleUpdateData = z.infer<typeof ruleUpdateSchema>;
