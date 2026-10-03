import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Zap,
  Plus,
  Trash2,
  Edit3,
  Play,
  Pause,
  Clock,
  
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  Battery,
  Music,
  Monitor,
} from 'lucide-react';
import { useAutomationStore, useSceneStore, useContextStore } from '../stores';
import { Card, CardContent, Button, Input, Switch, Slider } from '@auraos/ui';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@auraos/ui';
import { Badge } from '@auraos/ui';
import { Separator } from '@auraos/ui';
import type { Rule, Condition, ConditionOperator, ConditionField } from '@auraos/types';

const conditionFields: { value: ConditionField; label: string; icon: React.ElementType; options?: string[] }[] = [
  { value: 'active_application', label: 'Active App', icon: Zap },
  { value: 'active_window_title', label: 'Window Title', icon: Edit3 },
  { value: 'time_of_day', label: 'Time of Day', icon: Clock, options: ['morning', 'afternoon', 'evening', 'night'] },
  { value: 'hour', label: 'Hour', icon: Clock, options: Array.from({ length: 24 }, (_, i) => i.toString()) },
  { value: 'charging', label: 'Charging', icon: Battery },
  { value: 'battery_level', label: 'Battery Level', icon: Battery },
  { value: 'media_playing', label: 'Media Playing', icon: Music },
  { value: 'media_player', label: 'Media Player', icon: Music },
  { value: 'idle_seconds', label: 'Idle Time', icon: Zap },
  { value: 'platform', label: 'Platform', icon: Monitor, options: ['windows', 'linux', 'macos'] },
  { value: 'workspace', label: 'Workspace', icon: Monitor },
  { value: 'manual_override', label: 'Manual Override', icon: Edit3 },
];

const conditionOperators: { value: ConditionOperator; label: string }[] = [
  { value: 'equals', label: 'equals' },
  { value: 'not_equals', label: 'not equals' },
  { value: 'contains', label: 'contains' },
  { value: 'starts_with', label: 'starts with' },
  { value: 'greater_than', label: 'greater than' },
  { value: 'less_than', label: 'less than' },
  { value: 'between', label: 'between' },
  { value: 'in', label: 'is in' },
  { value: 'not_in', label: 'not in' },
];

function ConditionRow({
  condition,
  onUpdate,
  onRemove,
  isLast,
}: {
  condition: Condition;
  onUpdate: (c: Condition) => void;
  onRemove: () => void;
  isLast: boolean;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="flex gap-2">
      {/* Remove / expand */}
      <div className="flex flex-col items-center gap-1 pt-5">
        <button
          className="w-6 h-6 rounded-md flex items-center justify-center text-muted/40 hover:text-muted transition-colors"
          onClick={onRemove}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
        {!isLast && (
          <div className="w-px h-4 bg-border/50" />
        )}
      </div>

      {/* Condition card */}
      <motion.div
        className={`
          flex-1 bg-surface-elevated/60 border border-border/50 rounded-lg p-3
          ${expanded ? 'opacity-100' : 'opacity-70'}
        `}
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        transition={{ duration: 0.15 }}
      >
        <div className="flex items-center gap-2 mb-2">
          <button
            className="w-5 h-5 rounded flex items-center justify-center text-muted/50 hover:text-muted transition-colors"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <span className="text-[10px] uppercase tracking-wider text-muted/60 font-medium">
            WHEN
          </span>
        </div>

        {expanded && (
          <div className="space-y-3">
            {/* Field */}
            <Select
              value={condition.field}
              onValueChange={(v) => onUpdate({ ...condition, field: v as ConditionField })}
            >
              <SelectTrigger className="w-full bg-surface/80 border-border/50 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {conditionFields.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    <div className="flex items-center gap-2">
                      <f.icon className="w-3.5 h-3.5 text-muted/60" />
                      {f.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Operator */}
            <Select
              value={condition.operator}
              onValueChange={(v) => onUpdate({ ...condition, operator: v as ConditionOperator })}
            >
              <SelectTrigger className="w-full bg-surface/80 border-border/50 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {conditionOperators.map((op) => (
                  <SelectItem key={op.value} value={op.value}>
                    {op.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Value */}
            {(condition.field === 'time_of_day' || condition.field === 'platform') && (
              <Select
                value={String(condition.value)}
                onValueChange={(v) => onUpdate({ ...condition, value: v })}
              >
                <SelectTrigger className="w-full bg-surface/80 border-border/50 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {conditionFields.find((f) => f.value === condition.field)?.options?.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt.charAt(0).toUpperCase() + opt.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {condition.field === 'hour' && (
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={0}
                  max={23}
                  value={Number(condition.value)}
                  onChange={(e) => onUpdate({ ...condition, value: Number(e.target.value) })}
                  className="flex-1 bg-surface/80 border-border/50 text-sm"
                  placeholder="0-23"
                />
                <span className="text-xs text-muted/60 self-center">o'clock</span>
              </div>
            )}

            {condition.field === 'battery_level' && (
              <div className="flex items-center gap-2">
                <Slider
                  min={0}
                  max={100}
                  value={Number(condition.value)}
                  onValueChange={(v) => onUpdate({ ...condition, value: v })}
                  formatLabel={(v) => `${v}%`}
                  className="flex-1"
                />
              </div>
            )}

            {(condition.field === 'charging' || condition.field === 'media_playing') && (
              <div className="flex items-center gap-3">
                <Switch
                  checked={Boolean(condition.value)}
                  onCheckedChange={(checked) => onUpdate({ ...condition, value: checked })}
                />
                <span className="text-sm text-muted/80">
                  {condition.field === 'charging' ? (condition.value ? 'is charging' : 'not charging') : (condition.value ? 'is playing' : 'not playing')}
                </span>
              </div>
            )}

            {condition.field === 'active_application' && (
              <Input
                value={String(condition.value)}
                onChange={(e) => onUpdate({ ...condition, value: e.target.value })}
                className="w-full bg-surface/80 border-border/50 text-sm"
                placeholder="e.g. code, firefox, spotify"
              />
            )}

            {condition.field === 'active_window_title' && (
              <Input
                value={String(condition.value)}
                onChange={(e) => onUpdate({ ...condition, value: e.target.value })}
                className="w-full bg-surface/80 border-border/50 text-sm"
                placeholder="Window title pattern"
              />
            )}

            {condition.field === 'idle_seconds' && (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  value={Number(condition.value)}
                  onChange={(e) => onUpdate({ ...condition, value: Number(e.target.value) })}
                  className="w-24 bg-surface/80 border-border/50 text-sm"
                />
                <span className="text-sm text-muted/80">seconds idle</span>
              </div>
            )}

            {(condition.field === 'media_player') && (
              <Input
                value={String(condition.value)}
                onChange={(e) => onUpdate({ ...condition, value: e.target.value })}
                className="w-full bg-surface/80 border-border/50 text-sm"
                placeholder="e.g. spotify, vlc, firefox"
              />
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}

function RuleCard({
  rule,
  onUpdate,
  onRemove,
}: {
  rule: Rule;
  onUpdate: (r: Rule) => void;
  onRemove: () => void;
}) {
  const scenes = useSceneStore((s) => s.scenes);
  const context = useContextStore((s) => s.context);
  const activeRuleId = useAutomationStore((s) => s.activeRuleId);
  const isActiveRule = activeRuleId === rule.id;

  const matched = evaluateRuleMatch(rule, context);

  return (
    <Card className={`
      border ${matched ? 'border-primary/20 bg-primary/5' : 'border-border/60 bg-surface/60'}
      transition-colors
    `}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-md bg-surface-active flex items-center justify-center shrink-0">
              <Zap className="w-3.5 h-3.5 text-muted/60" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-medium text-foreground truncate">{rule.name}</h4>
                {rule.enabled ? (
                  <Badge variant="success" className="text-[9px] py-0 px-1.5">ON</Badge>
                ) : (
                  <Badge variant="muted" className="text-[9px] py-0 px-1.5">OFF</Badge>
                )}
                {matched && (
                  <Badge variant="default" className="text-[9px] py-0 px-1.5 animate-pulse">
                    MATCH
                  </Badge>
                )}
                {isActiveRule && (
                  <Badge variant="success" className="text-[9px] py-0 px-1.5">
                    ACTIVE
                  </Badge>
                )}
              </div>
              {rule.description && (
                <p className="text-xs text-muted truncate mt-0.5">{rule.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              className="w-7 h-7 rounded flex items-center justify-center text-muted/50 hover:text-foreground transition-colors"
              onClick={() => onUpdate({ ...rule, enabled: !rule.enabled })}
              title={rule.enabled ? 'Disable' : 'Enable'}
            >
              {rule.enabled ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <button
              className="w-7 h-7 rounded flex items-center justify-center text-muted/50 hover:text-muted transition-colors"
              onClick={onRemove}
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Conditions */}
        <Separator className="bg-border/30 my-2" />

        <div className="space-y-1.5">
          {rule.conditions.map((cond, i) => (
            <ConditionRow
              key={`${rule.id}-${i}`}
              condition={cond}
              
              isLast={i === rule.conditions.length - 1}
              onUpdate={(c) => onUpdate({
                ...rule,
                conditions: rule.conditions.map((cc, ci) => (ci === i ? c : cc)),
              })}
              onRemove={() => onUpdate({
                ...rule,
                conditions: rule.conditions.filter((_, ci) => ci !== i),
              })}
            />
          ))}
        </div>

        {/* Operator toggle */}
        <div className="flex items-center justify-center gap-2 mt-3">
          <button
            className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
              rule.conditionOperator === 'AND'
                ? 'border-primary/40 bg-primary/10 text-primary'
                : 'border-border/50 bg-surface/80 text-muted/60 hover:border-border'
            }`}
            onClick={() => onUpdate({ ...rule, conditionOperator: 'AND' })}
          >
            AND
          </button>
          <span className="text-[10px] text-muted/40">all conditions must match</span>
          <button
            className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
              rule.conditionOperator === 'OR'
                ? 'border-primary/40 bg-primary/10 text-primary'
                : 'border-border/50 bg-surface/80 text-muted/60 hover:border-border'
            }`}
            onClick={() => onUpdate({ ...rule, conditionOperator: 'OR' })}
          >
            OR
          </button>
          <span className="text-[10px] text-muted/40">any condition matches</span>
        </div>

        {/* Then action */}
        <Separator className="bg-border/30 my-2" />

        <div className="flex items-center gap-2 text-xs text-muted">
          <span>THEN</span>
          <span className="text-foreground/80 font-medium">
            Activate: <span className="text-foreground">{rule.action.sceneId ? scenes.find(s => s.id === rule.action.sceneId)?.name ?? rule.action.sceneId : '—'}</span>
          </span>
          {rule.priority !== 0 && (
            <Badge variant="outline" className="text-[9px] ml-auto">
              priority {rule.priority}
            </Badge>
          )}
        </div>

        {/* Priority slider */}
        <div className="mt-2">
          <Slider
            min={0}
            max={100}
            value={rule.priority}
            onValueChange={(v) => onUpdate({ ...rule, priority: v })}
            formatLabel={(v) => `priority ${v}`}
            className="w-full"
          />
        </div>

        {/* Cooldown */}
        {rule.cooldownMs && (
          <div className="mt-2 flex items-center gap-2 text-[10px] text-muted/70">
            <Clock className="w-3 h-3" />
            <span>Cooldown: {Math.round(rule.cooldownMs / 1000)}s</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function evaluateRuleMatch(rule: Rule, context: ReturnType<typeof useContextStore.getState>['context']): boolean {
  if (!rule.enabled || !context) return false;
  if (rule.conditions.length === 0) return false;

  const results = rule.conditions.map((cond) => {
    const fieldValue = getFieldValue(cond.field, context);
    return evaluateOp(cond.operator, fieldValue, cond.value);
  });

  return rule.conditionOperator === 'AND'
    ? results.every(Boolean)
    : results.some(Boolean);
}

function getFieldValue(field: ConditionField, ctx: ReturnType<typeof useContextStore.getState>['context']) {
  if (!ctx) return undefined;
  switch (field) {
    case 'active_application': return ctx.activeApplication?.name ?? null;
    case 'active_window_title': return ctx.windowTitle;
    case 'time_of_day': return ctx.timeOfDay;
    case 'hour': return ctx.hour;
    case 'charging': return ctx.charging;
    case 'battery_level': return ctx.battery?.level ?? 0;
    case 'media_playing': return ctx.mediaState?.playing ?? false;
    case 'media_player': return ctx.mediaState?.player ?? null;
    case 'idle_seconds': return ctx.idleTimeSeconds;
    case 'platform': return ctx.platform;
    case 'workspace': return ctx.workspace;
    case 'manual_override': return null;
    default: return undefined;
  }
}

function evaluateOp(op: ConditionOperator, fieldValue: unknown, target: Condition['value']): boolean {
  if (fieldValue === undefined || fieldValue === null) return false;
  const fv = fieldValue;
  switch (op) {
    case 'equals': return fv === target;
    case 'not_equals': return fv !== target;
    case 'contains': return typeof fv === 'string' && String(fv).toLowerCase().includes(String(target).toLowerCase());
    case 'starts_with': return typeof fv === 'string' && String(fv).toLowerCase().startsWith(String(target).toLowerCase());
    case 'greater_than':
      if (Array.isArray(target)) return typeof fv === 'number' && fv > Math.max(...target.map(Number));
      return typeof fv === 'number' && fv > Number(target);
    case 'less_than':
      if (Array.isArray(target)) return typeof fv === 'number' && fv < Math.min(...target.map(Number));
      return typeof fv === 'number' && fv < Number(target);
    case 'between':
      if (Array.isArray(target) && target.length === 2)
        return typeof fv === 'number' && fv >= Number(target[0]) && fv <= Number(target[1]);
      return false;
    case 'in': return Array.isArray(target) && target.map(String).includes(String(fv));
    case 'not_in': return Array.isArray(target) && !target.map(String).includes(String(fv));
    default: return false;
  }
}

export function AutomationsPage() {
  const rules = useAutomationStore((s) => s.rules);
  const addRule = useAutomationStore((s) => s.addRule);
  const removeRule = useAutomationStore((s) => s.removeRule);
  const updateRule = useAutomationStore((s) => s.updateRule);
  const scenes = useSceneStore((s) => s.scenes);
  const context = useContextStore((s) => s.context);
  const isPaused = useAutomationStore((s) => s.isPaused);
  const setPaused = useAutomationStore((s) => s.setPaused);
  const matchedCount = context
    ? rules.filter((r) => evaluateRuleMatch(r, context)).length
    : 0;

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'enabled'>('all');

  const filtered = rules.filter((r) => {
    if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === 'enabled' && !r.enabled) return false;
    if (filter === 'active' && (!context || !evaluateRuleMatch(r, context))) return false;
    return true;
  });

  const newRuleId = `rule_${Date.now()}`;

  const handleCreateRule = () => {
    const defaultScene = scenes.find((s) => s.id === 'focus') ?? scenes[0];
    const newRule: Rule = {
      id: newRuleId,
      name: 'New Automation',
      description: '',
      conditions: [
        {
          field: 'active_application',
          operator: 'equals',
          value: 'code',
        },
      ],
      conditionOperator: 'AND',
      action: {
        type: 'ACTIVATE_SCENE',
        sceneId: defaultScene?.id ?? '',
      },
      priority: 50,
      cooldownMs: 5000,
      enabled: true,
    };
    addRule(newRule);
  };

  return (
    <div className="h-full overflow-y-auto p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Automations</h1>
          <p className="text-sm text-muted mt-0.5">
            {rules.length} rule{rules.length !== 1 ? 's' : ''}
            {matchedCount > 0 ? ` · ${matchedCount} matching now` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setPaused(!isPaused)} className="gap-2">
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            {isPaused ? 'Resume' : 'Pause'}
          </Button>
          <Button onClick={handleCreateRule} className="gap-2">
            <Plus className="w-4 h-4" />
            New Automation
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/60" />
          <Input
            placeholder="Search rules..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-surface-elevated/50 border-border/50"
          />
        </div>
        <div className="flex gap-2">
          <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <SelectTrigger className="w-[140px] bg-surface-elevated/50 border-border/50 text-xs">
              <Filter className="w-3.5 h-3.5 mr-1.5 text-muted/60" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All rules</SelectItem>
              <SelectItem value="enabled">Enabled</SelectItem>
              <SelectItem value="active">Matching now</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Rules */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-surface-active flex items-center justify-center mb-4">
            <Zap className="w-8 h-8 text-muted/30" strokeWidth={1.5} />
          </div>
          <p className="text-sm font-medium text-muted mb-1">No automations yet</p>
          <p className="text-xs text-muted/60 mb-4">Create rules to automatically switch scenes</p>
          <Button variant="secondary" size="sm" onClick={handleCreateRule} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Automation
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((rule, i) => (
            <motion.div
              key={rule.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <RuleCard
                rule={rule}
                onUpdate={(r) => updateRule(rule.id, r)}
                onRemove={() => removeRule(rule.id)}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Quick add preset */}
      {!search && filtered.length === 0 && (
        <Card className="border-border/40 bg-surface/40">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-surface-active flex items-center justify-center">
                  <Zap className="w-4 h-4 text-muted/60" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground/80">Quick presets</p>
                  <p className="text-xs text-muted">Common automation patterns</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleCreateRule} className="gap-1">
                <Plus className="w-3.5 h-3.5" />
                Add
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
