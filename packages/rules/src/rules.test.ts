import { describe, it, expect } from 'vitest';
import {
  evaluateCondition,
  evaluateRule,
  resolveScene,
  createCooldownState,
  markFired,
  normalizeAppId,
  appDisplayName,
} from './index.js';
import type { Rule, RuleEvaluationContext } from '@auraos/types';

function makeContext(overrides: Partial<RuleEvaluationContext> = {}): RuleEvaluationContext {
  return {
    activeApplication: null,
    activeWindowTitle: null,
    hour: 12,
    timeOfDay: 'afternoon',
    charging: false,
    batteryLevel: 80,
    mediaPlaying: false,
    mediaPlayer: null,
    idleSeconds: 0,
    platform: 'linux',
    workspace: 1,
    manualOverride: null,
    ...overrides,
  };
}

function makeRule(overrides: Partial<Rule> = {}): Rule {
  return {
    id: 'rule-1',
    name: 'Test rule',
    conditions: [{ field: 'active_application', operator: 'equals', value: 'code' }],
    conditionOperator: 'AND',
    action: { type: 'ACTIVATE_SCENE', sceneId: 'focus' },
    priority: 50,
    enabled: true,
    ...overrides,
  };
}

describe('evaluateCondition', () => {
  it('matches strings case-insensitively', () => {
    const context = makeContext({ activeApplication: 'Visual Studio Code' });
    expect(
      evaluateCondition({ field: 'active_application', operator: 'equals', value: 'visual studio code' }, context)
    ).toBe(true);
  });

  it('returns false when the signal is unavailable', () => {
    const context = makeContext({ activeApplication: null });
    expect(
      evaluateCondition({ field: 'active_application', operator: 'equals', value: 'code' }, context)
    ).toBe(false);
  });

  it('evaluates between as an inclusive numeric range', () => {
    const context = makeContext({ hour: 22 });
    expect(evaluateCondition({ field: 'hour', operator: 'between', value: [18, 23] }, context)).toBe(true);
    expect(evaluateCondition({ field: 'hour', operator: 'between', value: [18, 21] }, context)).toBe(false);
  });

  it('evaluates numeric comparisons against numbers', () => {
    const context = makeContext({ batteryLevel: 15 });
    expect(evaluateCondition({ field: 'battery_level', operator: 'less_than', value: 20 }, context)).toBe(true);
    expect(evaluateCondition({ field: 'battery_level', operator: 'greater_than', value: 20 }, context)).toBe(false);
  });

  it('supports contains for partial window-title matching', () => {
    const context = makeContext({ activeWindowTitle: 'index.ts — auraos' });
    expect(evaluateCondition({ field: 'active_window_title', operator: 'contains', value: 'index.ts' }, context)).toBe(true);
  });
});

describe('evaluateRule', () => {
  it('requires every condition under AND', () => {
    const rule = makeRule({
      conditions: [
        { field: 'active_application', operator: 'equals', value: 'code' },
        { field: 'hour', operator: 'between', value: [18, 23] },
      ],
    });
    expect(evaluateRule(rule, makeContext({ activeApplication: 'code', hour: 22 }))).toBe(true);
    expect(evaluateRule(rule, makeContext({ activeApplication: 'code', hour: 10 }))).toBe(false);
  });

  it('requires only one condition under OR', () => {
    const rule = makeRule({
      conditionOperator: 'OR',
      conditions: [
        { field: 'active_application', operator: 'equals', value: 'code' },
        { field: 'media_player', operator: 'equals', value: 'spotify' },
      ],
    });
    expect(evaluateRule(rule, makeContext({ activeApplication: 'code' }))).toBe(true);
    expect(evaluateRule(rule, makeContext({ mediaPlayer: 'Spotify' }))).toBe(true);
    expect(evaluateRule(rule, makeContext({ activeApplication: 'firefox' }))).toBe(false);
  });

  it('never matches a disabled rule', () => {
    expect(evaluateRule(makeRule({ enabled: false }), makeContext({ activeApplication: 'code' }))).toBe(false);
  });
});

describe('resolveScene', () => {
  // This is the worked example from the product plan (section 64).
  it('picks the highest-priority matching rule', () => {
    const rules: Rule[] = [
      makeRule({
        id: 'coding',
        priority: 60,
        conditions: [{ field: 'active_application', operator: 'equals', value: 'code' }],
        action: { type: 'ACTIVATE_SCENE', sceneId: 'focus' },
      }),
      makeRule({
        id: 'night',
        priority: 30,
        conditions: [{ field: 'time_of_day', operator: 'equals', value: 'night' }],
        action: { type: 'ACTIVATE_SCENE', sceneId: 'night' },
      }),
      makeRule({
        id: 'battery',
        priority: 100,
        conditions: [{ field: 'battery_level', operator: 'less_than', value: 20 }],
        action: { type: 'ACTIVATE_SCENE', sceneId: 'battery-saver' },
      }),
    ];

    const context = makeContext({
      activeApplication: normalizeAppId('Visual Studio Code'),
      hour: 22,
      timeOfDay: 'night',
      batteryLevel: 55,
    });

    const result = resolveScene(rules, context);
    expect(result.rule?.id).toBe('coding');
    expect(result.sceneId).toBe('focus');
  });

  it('lets a higher-priority rule win when both match', () => {
    const rules: Rule[] = [
      makeRule({ id: 'low', priority: 30, action: { type: 'ACTIVATE_SCENE', sceneId: 'night' } }),
      makeRule({ id: 'high', priority: 100, action: { type: 'ACTIVATE_SCENE', sceneId: 'battery-saver' } }),
    ];
    const result = resolveScene(rules, makeContext({ activeApplication: 'code' }));
    expect(result.sceneId).toBe('battery-saver');
  });

  it('returns no scene when nothing matches', () => {
    const result = resolveScene([makeRule()], makeContext({ activeApplication: 'firefox' }));
    expect(result.rule).toBeNull();
    expect(result.sceneId).toBeNull();
  });

  it('lets a manual override suppress automation', () => {
    const rules = [makeRule({ priority: 100, action: { type: 'ACTIVATE_SCENE', sceneId: 'focus' } })];
    const result = resolveScene(
      rules,
      makeContext({ activeApplication: 'code', manualOverride: 'chill' })
    );
    expect(result.rule).toBeNull();
    expect(result.sceneId).toBe('chill');
  });

  it('skips a rule that is still within its cooldown', () => {
    const rules = [
      makeRule({ id: 'hot', priority: 100, cooldownMs: 60_000, action: { type: 'ACTIVATE_SCENE', sceneId: 'focus' } }),
      makeRule({ id: 'fallback', priority: 10, action: { type: 'ACTIVATE_SCENE', sceneId: 'chill' } }),
    ];
    const context = makeContext({ activeApplication: 'code' });

    const state = createCooldownState();
    markFired(state, 'hot', 1_000);

    const result = resolveScene(rules, context, state, 10_000);
    expect(result.sceneId).toBe('chill');

    // Once the window elapses, the high-priority rule is eligible again.
    const later = resolveScene(rules, context, state, 61_001);
    expect(later.sceneId).toBe('focus');
  });

  it('produces a trace explaining why each rule did or did not win', () => {
    const rules = [
      makeRule({ id: 'match', priority: 60 }),
      makeRule({
        id: 'no-match',
        priority: 90,
        conditions: [{ field: 'media_playing', operator: 'equals', value: true }],
      }),
    ];
    const result = resolveScene(rules, makeContext({ activeApplication: 'code' }));
    const byId = Object.fromEntries(result.trace.map((t) => [t.ruleId, t]));

    expect(byId['match']?.reason).toBe('selected');
    expect(byId['no-match']?.reason).toBe('conditions not met');
  });
});