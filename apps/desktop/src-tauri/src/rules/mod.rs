use crate::context::DesktopContext;
use crate::scenes::Scene;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Rule {
    pub id: String,
    #[serde(default)]
    pub name: String,
    pub conditions: Vec<Condition>,
    #[serde(default = "default_operator")]
    pub condition_operator: String,
    pub action: RuleAction,
    #[serde(default)]
    pub priority: i32,
    #[serde(default)]
    pub cooldown_ms: Option<u64>,
    #[serde(default = "default_true")]
    pub enabled: bool,
}

fn default_operator() -> String {
    "AND".to_string()
}

fn default_true() -> bool {
    true
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Condition {
    pub field: String,
    pub operator: String,
    pub value: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct RuleAction {
    #[serde(rename = "type")]
    pub kind: String,
    #[serde(default)]
    pub scene_id: Option<String>,
}

/// The normalized view of the desktop that rules are evaluated against.
#[derive(Debug, Clone, Default)]
pub struct RuleContext {
    pub active_application: Option<String>,
    pub window_title: Option<String>,
    pub hour: u32,
    pub time_of_day: String,
    pub charging: bool,
    pub battery_level: u8,
    pub media_playing: bool,
    pub media_player: Option<String>,
    pub idle_seconds: u64,
    pub platform: String,
    pub workspace: u32,
    pub manual_override: Option<String>,
}

impl RuleContext {
    /// Builds an evaluation context from a raw desktop snapshot.
    ///
    /// The active application id arrives already normalized by the platform
    /// adapter, so rules match on stable ids like "code".
    pub fn from_desktop(desktop: &DesktopContext, manual_override: Option<String>) -> Self {
        Self {
            active_application: desktop.active_application.as_ref().map(|a| a.name.clone()),
            window_title: desktop.window_title.clone(),
            hour: desktop.hour,
            time_of_day: format!("{:?}", desktop.time_of_day).to_lowercase(),
            charging: desktop.charging,
            battery_level: desktop.battery.as_ref().map(|b| b.level).unwrap_or(0),
            media_playing: desktop
                .media_state
                .as_ref()
                .map(|m| m.playing)
                .unwrap_or(false),
            media_player: desktop
                .media_state
                .as_ref()
                .and_then(|m| m.player.clone())
                .map(|p| crate::app_id::normalize_app_id(&p)),
            idle_seconds: desktop.idle_time_seconds,
            platform: desktop.platform.clone(),
            workspace: desktop.workspace,
            manual_override,
        }
    }
}

/// Cooldown bookkeeping, keyed by rule id.
#[derive(Debug, Default, Clone)]
pub struct Cooldowns {
    last_fired: HashMap<String, u64>,
}

impl Cooldowns {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn mark_fired(&mut self, rule_id: &str, now_ms: u64) {
        self.last_fired.insert(rule_id.to_string(), now_ms);
    }

    fn remaining_ms(&self, rule: &Rule, now_ms: u64) -> u64 {
        let Some(cooldown) = rule.cooldown_ms else {
            return 0;
        };
        let Some(last) = self.last_fired.get(&rule.id) else {
            return 0;
        };
        let elapsed = now_ms.saturating_sub(*last);
        cooldown.saturating_sub(elapsed)
    }
}

#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct TraceEntry {
    pub rule_id: String,
    pub matched: bool,
    pub priority: i32,
    pub reason: String,
}

#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Resolution {
    pub rule_id: Option<String>,
    pub scene_id: Option<String>,
    pub trace: Vec<TraceEntry>,
}

impl Resolution {
    fn empty(scene_id: Option<String>, trace: Vec<TraceEntry>) -> Self {
        Self {
            rule_id: None,
            scene_id,
            trace,
        }
    }
}

fn json_str(value: &serde_json::Value) -> Option<String> {
    value.as_str().map(|s| s.to_lowercase())
}

fn as_number(value: &serde_json::Value) -> Option<f64> {
    match value {
        serde_json::Value::Number(n) => n.as_f64(),
        serde_json::Value::String(s) => s.trim().parse::<f64>().ok(),
        _ => None,
    }
}

/// Applies one comparison operator.
///
/// String comparisons are case-insensitive so rules authored against display
/// names keep matching normalized ids where they differ only by case.
pub fn evaluate_condition(condition: &Condition, context: &RuleContext) -> bool {
    let field_value = field_value(&condition.field, context);
    let Some(field_value) = field_value else {
        return false;
    };

    let target = &condition.value;

    match condition.operator.as_str() {
        "equals" => match (&field_value, target) {
            (FieldValue::Str(s), _) => json_str(target).map(|t| *s == t).unwrap_or(false),
            _ => field_value.eq(target),
        },
        "not_equals" => !evaluate_condition(
            &Condition {
                field: condition.field.clone(),
                operator: "equals".into(),
                value: target.clone(),
            },
            context,
        ),
        "contains" => match (&field_value, target) {
            (FieldValue::Str(s), _) => json_str(target).map(|t| s.contains(&t)).unwrap_or(false),
            _ => false,
        },
        "starts_with" => match (&field_value, target) {
            (FieldValue::Str(s), _) => json_str(target).map(|t| s.starts_with(&t)).unwrap_or(false),
            _ => false,
        },
        "greater_than" => {
            let left = field_value.as_f64();
            let right = match target {
                serde_json::Value::Array(items) => items
                    .iter()
                    .filter_map(as_number)
                    .fold(None, |acc: Option<f64>, v| {
                        Some(acc.map_or(v, |a| a.max(v)))
                    }),
                other => as_number(other),
            };
            matches!((left, right), (Some(l), Some(r)) if l > r)
        }
        "less_than" => {
            let left = field_value.as_f64();
            let right = match target {
                serde_json::Value::Array(items) => items
                    .iter()
                    .filter_map(as_number)
                    .fold(None, |acc: Option<f64>, v| {
                        Some(acc.map_or(v, |a| a.min(v)))
                    }),
                other => as_number(other),
            };
            matches!((left, right), (Some(l), Some(r)) if l < r)
        }
        "between" => {
            let left = field_value.as_f64();
            let bounds = target.as_array().and_then(|items| {
                if items.len() == 2 {
                    Some((as_number(&items[0])?, as_number(&items[1])?))
                } else {
                    None
                }
            });
            matches!((left, bounds), (Some(l), Some((min, max))) if l >= min && l <= max)
        }
        "in" => target
            .as_array()
            .map(|items| items.iter().any(|item| field_value.eq(item)))
            .unwrap_or(false),
        "not_in" => target
            .as_array()
            .map(|items| !items.iter().any(|item| field_value.eq(item)))
            .unwrap_or(false),
        _ => false,
    }
}

enum FieldValue {
    Str(String),
    Num(f64),
    Bool(bool),
}

impl FieldValue {
    fn as_f64(&self) -> Option<f64> {
        match self {
            FieldValue::Num(n) => Some(*n),
            FieldValue::Bool(b) => Some(if *b { 1.0 } else { 0.0 }),
            FieldValue::Str(s) => s.trim().parse().ok(),
        }
    }

    fn eq(&self, target: &serde_json::Value) -> bool {
        match self {
            FieldValue::Str(s) => json_str(target).map(|t| *s == t).unwrap_or(false),
            FieldValue::Num(n) => as_number(target).map(|t| *n == t).unwrap_or(false),
            FieldValue::Bool(b) => target.as_bool().map(|t| *b == t).unwrap_or(false),
        }
    }
}

fn field_value(field: &str, context: &RuleContext) -> Option<FieldValue> {
    let value = match field {
        "active_application" => context.active_application.clone().map(FieldValue::Str)?,
        "active_window_title" => context.window_title.clone().map(FieldValue::Str)?,
        "time_of_day" => FieldValue::Str(context.time_of_day.clone()),
        "hour" => FieldValue::Num(context.hour as f64),
        "charging" => FieldValue::Bool(context.charging),
        "battery_level" => FieldValue::Num(context.battery_level as f64),
        "media_playing" => FieldValue::Bool(context.media_playing),
        "media_player" => context.media_player.clone().map(FieldValue::Str)?,
        "idle_seconds" => FieldValue::Num(context.idle_seconds as f64),
        "platform" => FieldValue::Str(context.platform.clone()),
        "workspace" => FieldValue::Num(context.workspace as f64),
        "manual_override" => context.manual_override.clone().map(FieldValue::Str)?,
        _ => return None,
    };
    Some(value)
}

/// Evaluates every condition of a rule under its AND/OR operator.
pub fn evaluate_conditions(rule: &Rule, context: &RuleContext) -> bool {
    if rule.conditions.is_empty() {
        return false;
    }

    let results: Vec<bool> = rule
        .conditions
        .iter()
        .map(|c| evaluate_condition(c, context))
        .collect();

    if rule.condition_operator.eq_ignore_ascii_case("OR") {
        results.iter().any(|r| *r)
    } else {
        results.iter().all(|r| *r)
    }
}

pub fn evaluate_rule(rule: &Rule, context: &RuleContext) -> bool {
    rule.enabled && evaluate_conditions(rule, context)
}

/// Picks the winning rule by priority, skipping rules still in cooldown.
///
/// A manual override always wins outright: while the user has pinned a scene,
/// automation is suppressed entirely.
pub fn resolve_scene(
    rules: &[Rule],
    context: &RuleContext,
    cooldowns: &Cooldowns,
    now_ms: u64,
) -> Resolution {
    if let Some(pinned) = &context.manual_override {
        return Resolution::empty(
            Some(pinned.clone()),
            vec![TraceEntry {
                rule_id: String::new(),
                matched: false,
                priority: -1,
                reason: "manual override".into(),
            }],
        );
    }

    // Highest priority first. `sort_by_key` is stable, so rules that tie keep
    // their declared order and resolution stays deterministic.
    let mut ordered: Vec<&Rule> = rules.iter().collect();
    ordered.sort_by_key(|rule| std::cmp::Reverse(rule.priority));

    let mut trace = Vec::new();

    for rule in ordered {
        if !evaluate_rule(rule, context) {
            trace.push(TraceEntry {
                rule_id: rule.id.clone(),
                matched: false,
                priority: rule.priority,
                reason: "conditions not met".into(),
            });
            continue;
        }

        let remaining = cooldowns.remaining_ms(rule, now_ms);
        if remaining > 0 {
            trace.push(TraceEntry {
                rule_id: rule.id.clone(),
                matched: true,
                priority: rule.priority,
                reason: format!("cooling down ({}s left)", remaining.div_ceil(1000)),
            });
            continue;
        }

        trace.push(TraceEntry {
            rule_id: rule.id.clone(),
            matched: true,
            priority: rule.priority,
            reason: "selected".into(),
        });

        return Resolution {
            rule_id: Some(rule.id.clone()),
            scene_id: rule.action.scene_id.clone(),
            trace,
        };
    }

    Resolution::empty(None, trace)
}

/// Looks up a scene by id.
pub fn find_scene<'a>(scenes: &'a [Scene], scene_id: &str) -> Option<&'a Scene> {
    scenes.iter().find(|s| s.id == scene_id)
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn make_rule(
        id: &str,
        priority: i32,
        field: &str,
        operator: &str,
        value: serde_json::Value,
    ) -> Rule {
        Rule {
            id: id.into(),
            name: id.into(),
            conditions: vec![Condition {
                field: field.into(),
                operator: operator.into(),
                value,
            }],
            condition_operator: "AND".into(),
            action: RuleAction {
                kind: "ACTIVATE_SCENE".into(),
                scene_id: Some(id.into()),
            },
            priority,
            cooldown_ms: None,
            enabled: true,
        }
    }

    fn context() -> RuleContext {
        RuleContext {
            active_application: Some("code".into()),
            window_title: Some("App.tsx — auraos".into()),
            hour: 22,
            time_of_day: "night".into(),
            charging: false,
            battery_level: 55,
            media_playing: false,
            media_player: None,
            idle_seconds: 0,
            platform: "linux".into(),
            workspace: 1,
            manual_override: None,
        }
    }

    #[test]
    fn matches_the_worked_example_from_the_plan() {
        // Plan section 64: App=VS Code, Time=22:45, Battery=55%.
        let rules = vec![
            make_rule("coding", 60, "active_application", "equals", json!("code")),
            make_rule("night", 30, "time_of_day", "equals", json!("night")),
            make_rule("battery", 100, "battery_level", "less_than", json!(20)),
        ];

        let resolution = resolve_scene(&rules, &context(), &Cooldowns::new(), 0);
        assert_eq!(resolution.rule_id.as_deref(), Some("coding"));
        assert_eq!(resolution.scene_id.as_deref(), Some("coding"));
    }

    #[test]
    fn higher_priority_rule_wins_when_several_match() {
        let rules = vec![
            make_rule("low", 30, "time_of_day", "equals", json!("night")),
            make_rule("high", 100, "active_application", "equals", json!("code")),
        ];
        let resolution = resolve_scene(&rules, &context(), &Cooldowns::new(), 0);
        assert_eq!(resolution.rule_id.as_deref(), Some("high"));
    }

    #[test]
    fn no_match_yields_no_scene() {
        let rules = vec![make_rule(
            "coding",
            60,
            "active_application",
            "equals",
            json!("firefox"),
        )];
        let resolution = resolve_scene(&rules, &context(), &Cooldowns::new(), 0);
        assert!(resolution.rule_id.is_none());
        assert!(resolution.scene_id.is_none());
    }

    #[test]
    fn manual_override_suppresses_automation() {
        let rules = vec![make_rule(
            "coding",
            100,
            "active_application",
            "equals",
            json!("code"),
        )];
        let mut ctx = context();
        ctx.manual_override = Some("chill".into());

        let resolution = resolve_scene(&rules, &ctx, &Cooldowns::new(), 0);
        assert!(resolution.rule_id.is_none());
        assert_eq!(resolution.scene_id.as_deref(), Some("chill"));
    }

    #[test]
    fn cooldown_blocks_a_rule_then_expires() {
        let mut hot = make_rule("hot", 100, "active_application", "equals", json!("code"));
        hot.cooldown_ms = Some(60_000);
        let fallback = make_rule("fallback", 10, "time_of_day", "equals", json!("night"));
        let rules = vec![hot, fallback];

        let mut cooldowns = Cooldowns::new();
        cooldowns.mark_fired("hot", 1_000);

        let ctx = context();
        let during = resolve_scene(&rules, &ctx, &cooldowns, 10_000);
        assert_eq!(during.scene_id.as_deref(), Some("fallback"));

        let after = resolve_scene(&rules, &ctx, &cooldowns, 61_001);
        assert_eq!(after.scene_id.as_deref(), Some("hot"));
    }

    #[test]
    fn disabled_rules_never_match() {
        let mut r = make_rule("coding", 60, "active_application", "equals", json!("code"));
        r.enabled = false;
        assert!(!evaluate_rule(&r, &context()));
    }

    #[test]
    fn and_requires_every_condition_or_requires_one() {
        let mut r = make_rule("coding", 60, "active_application", "equals", json!("code"));
        r.conditions.push(Condition {
            field: "hour".into(),
            operator: "between".into(),
            value: json!([18, 23]),
        });

        assert!(evaluate_rule(&r, &context()));
        assert!(!evaluate_rule(
            &r,
            &RuleContext {
                hour: 10,
                ..context()
            }
        ));

        r.condition_operator = "OR".into();
        assert!(evaluate_rule(
            &r,
            &RuleContext {
                hour: 10,
                ..context()
            }
        ));
    }

    #[test]
    fn trace_explains_each_decision() {
        let rules = vec![
            make_rule("coding", 60, "active_application", "equals", json!("code")),
            make_rule("music", 90, "media_playing", "equals", json!(true)),
        ];
        let resolution = resolve_scene(&rules, &context(), &Cooldowns::new(), 0);

        let by_id: HashMap<&str, &TraceEntry> = resolution
            .trace
            .iter()
            .map(|t| (t.rule_id.as_str(), t))
            .collect();

        assert_eq!(by_id["coding"].reason, "selected");
        assert_eq!(by_id["music"].reason, "conditions not met");
    }

    #[test]
    fn between_is_inclusive() {
        let r = make_rule("range", 10, "battery_level", "between", json!([50, 60]));
        assert!(evaluate_rule(&r, &context()));
        assert!(!evaluate_rule(
            &r,
            &RuleContext {
                battery_level: 49,
                ..context()
            }
        ));
    }

    #[test]
    fn parses_rules_from_camel_case_json() {
        let raw = r#"{
            "id": "coding",
            "name": "VS Code",
            "conditions": [{ "field": "active_application", "operator": "equals", "value": "code" }],
            "conditionOperator": "AND",
            "action": { "type": "ACTIVATE_SCENE", "sceneId": "focus" },
            "priority": 60,
            "enabled": true
        }"#;

        let parsed: Rule = serde_json::from_str(raw).expect("should parse");
        assert_eq!(parsed.action.scene_id.as_deref(), Some("focus"));
        assert_eq!(parsed.condition_operator, "AND");
        assert_eq!(parsed.priority, 60);
    }
}
