export type ConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'starts_with'
  | 'greater_than'
  | 'less_than'
  | 'between'
  | 'in'
  | 'not_in';

export type ConditionField =
  | 'active_application'
  | 'active_window_title'
  | 'time_of_day'
  | 'hour'
  | 'charging'
  | 'battery_level'
  | 'media_playing'
  | 'media_player'
  | 'idle_seconds'
  | 'platform'
  | 'workspace'
  | 'manual_override';

export interface Condition {
  field: ConditionField;
  operator: ConditionOperator;
  value: string | number | boolean | string[];
}

export type ConditionGroupOperator = 'AND' | 'OR';

export interface ConditionGroup {
  conditions: Condition[];
  operator: ConditionGroupOperator;
}

export type RuleActionType = 'ACTIVATE_SCENE' | 'DEACTIVATE_SCENE' | 'SET_VOLUME' | 'SET_BRIGHTNESS' | 'SEND_NOTIFICATION';

export interface RuleAction {
  type: RuleActionType;
  sceneId?: string;
  volume?: number;
  brightness?: number;
  notification?: {
    title: string;
    body: string;
  };
}

export interface Rule {
  id: string;
  name: string;
  description?: string;

  conditions: Condition[];
  conditionOperator: ConditionGroupOperator;

  action: RuleAction;

  priority: number;

  cooldownMs?: number;

  enabled: boolean;

  createdAt?: string;
  updatedAt?: string;
}

export interface RuleTriggerResult {
  matched: boolean;
  ruleId: string | null;
  sceneId: string | null;
  reason: string;
  timestamp: number;
}

export interface RuleEvaluationContext {
  activeApplication: string | null;
  activeWindowTitle: string | null;
  hour: number;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  charging: boolean;
  batteryLevel: number;
  mediaPlaying: boolean;
  mediaPlayer: string | null;
  idleSeconds: number;
  platform: string;
  workspace: number;
  manualOverride: string | null;
}
