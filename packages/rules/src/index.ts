import type { Rule, RuleEvaluationContext, Condition, ConditionField } from '@auraos/types';

export type { Rule, RuleEvaluationContext, Condition, ConditionField };
export { normalizeAppId, appDisplayName, KNOWN_APP_IDS } from './apps.js';

/** Reads a single context field, or undefined when the signal is unavailable. */
export function getFieldValue(
  field: ConditionField,
  context: RuleEvaluationContext
): string | number | boolean | string[] | null | undefined {
  switch (field) {
    case 'active_application':
      return context.activeApplication;
    case 'active_window_title':
      return context.activeWindowTitle;
    case 'time_of_day':
      return context.timeOfDay;
    case 'hour':
      return context.hour;
    case 'charging':
      return context.charging;
    case 'battery_level':
      return context.batteryLevel;
    case 'media_playing':
      return context.mediaPlaying;
    case 'media_player':
      return context.mediaPlayer;
    case 'idle_seconds':
      return context.idleSeconds;
    case 'platform':
      return context.platform;
    case 'workspace':
      return context.workspace;
    case 'manual_override':
      return context.manualOverride;
    default:
      return undefined;
  }
}

function toComparableNumber(value: unknown): number | null {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) {
    return Number(value);
  }
  return null;
}

/**
 * Applies a single comparison operator.
 *
 * Comparisons are intentionally forgiving about casing so rules authored as
 * "vscode" still match a context reporting "Visual Studio Code".
 */
export function evaluateCondition(
  condition: Condition,
  context: RuleEvaluationContext
): boolean {
  const fieldValue = getFieldValue(condition.field, context);
  if (fieldValue === undefined || fieldValue === null) return false;

  const { operator: op, value: target } = condition;

  switch (op) {
    case 'equals':
      return typeof fieldValue === 'string' && typeof target === 'string'
        ? fieldValue.toLowerCase() === target.toLowerCase()
        : fieldValue === target;

    case 'not_equals':
      return typeof fieldValue === 'string' && typeof target === 'string'
        ? fieldValue.toLowerCase() !== target.toLowerCase()
        : fieldValue !== target;

    case 'contains':
      return (
        typeof fieldValue === 'string' &&
        typeof target === 'string' &&
        fieldValue.toLowerCase().includes(target.toLowerCase())
      );

    case 'starts_with':
      return (
        typeof fieldValue === 'string' &&
        typeof target === 'string' &&
        fieldValue.toLowerCase().startsWith(target.toLowerCase())
      );

    case 'greater_than': {
      const left = toComparableNumber(fieldValue);
      const right = Array.isArray(target) ? Math.max(...target.map(Number)) : toComparableNumber(target);
      return left !== null && right !== null && left > right;
    }

    case 'less_than': {
      const left = toComparableNumber(fieldValue);
      const right = Array.isArray(target) ? Math.min(...target.map(Number)) : toComparableNumber(target);
      return left !== null && right !== null && left < right;
    }

    case 'between': {
      const left = toComparableNumber(fieldValue);
      if (!Array.isArray(target) || target.length !== 2) return false;
      const min = toComparableNumber(target[0]);
      const max = toComparableNumber(target[1]);
      return left !== null && min !== null && max !== null && left >= min && left <= max;
    }

    case 'in':
      return Array.isArray(target) && target.includes(String(fieldValue));

    case 'not_in':
      return Array.isArray(target) && !target.includes(String(fieldValue));

    default:
      return false;
  }
}

/** Evaluates every condition of a rule under its AND/OR operator. */
export function evaluateConditions(
  conditions: Condition[],
  operator: 'AND' | 'OR',
  context: RuleEvaluationContext
): boolean {
  if (conditions.length === 0) return false;
  const results = conditions.map((c) => evaluateCondition(c, context));
  return operator === 'AND' ? results.every(Boolean) : results.some(Boolean);
}

export function evaluateRule(rule: Rule, context: RuleEvaluationContext): boolean {
  if (!rule.enabled) return false;
  return evaluateConditions(rule.conditions, rule.conditionOperator, context);
}

export interface RuleMatch {
  rule: Rule;
  matched: boolean;
}

/** Evaluates rules and returns them sorted by descending priority. */
export function evaluateRules(
  rules: Rule[],
  context: RuleEvaluationContext
): RuleMatch[] {
  return rules
    .map((rule) => ({ rule, matched: evaluateRule(rule, context) }))
    .sort((a, b) => b.rule.priority - a.rule.priority);
}

export interface CooldownState {
  /** Epoch ms of the last time each rule was allowed to fire. */
  lastFired: Record<string, number>;
}

export function createCooldownState(): CooldownState {
  return { lastFired: {} };
}

export interface ResolutionResult {
  /** The rule that won, or null when nothing matched. */
  rule: Rule | null;
  sceneId: string | null;
  /** Human-readable trace for the rule debugger UI. */
  trace: Array<{ ruleId: string; matched: boolean; priority: number; reason: string }>;
}

/**
 * Picks the winning rule by priority, skipping rules still in cooldown.
 *
 * A manual override always wins outright: while the user has pinned a scene,
 * automation is suppressed entirely.
 */
export function resolveScene(
  rules: Rule[],
  context: RuleEvaluationContext,
  cooldown: CooldownState = createCooldownState(),
  now: number = Date.now()
): ResolutionResult {
  if (context.manualOverride) {
    return {
      rule: null,
      sceneId: context.manualOverride,
      trace: [{ ruleId: '', matched: false, priority: -1, reason: 'manual override' }],
    };
  }

  const trace: ResolutionResult['trace'] = [];

  for (const { rule, matched } of evaluateRules(rules, context)) {
    if (!matched) {
      trace.push({
        ruleId: rule.id,
        matched: false,
        priority: rule.priority,
        reason: 'conditions not met',
      });
      continue;
    }

    if (rule.cooldownMs) {
      const last = cooldown.lastFired[rule.id];
      if (last !== undefined && now - last < rule.cooldownMs) {
        trace.push({
          ruleId: rule.id,
          matched: true,
          priority: rule.priority,
          reason: `cooling down (${Math.ceil((rule.cooldownMs - (now - last)) / 1000)}s left)`,
        });
        continue;
      }
    }

    trace.push({
      ruleId: rule.id,
      matched: true,
      priority: rule.priority,
      reason: 'selected',
    });

    return {
      rule,
      sceneId: rule.action.sceneId ?? null,
      trace,
    };
  }

  return { rule: null, sceneId: null, trace };
}

/** Records a firing so its cooldown window starts. */
export function markFired(state: CooldownState, ruleId: string, now: number = Date.now()): void {
  state.lastFired[ruleId] = now;
}