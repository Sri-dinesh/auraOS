#!/usr/bin/env bash
# Runs the pure-logic Rust tests without linking GTK/WebKit.
#
# Tauri's global-shortcut plugin needs libxdo, which is not always present on a
# dev machine. The logic under test (rules engine, scene diffing, app-id
# normalization, Hyprland payload parsing) has no Tauri dependency, so we
# compile just those modules into a throwaway crate and run their #[cfg(test)]
# suites there.
#
# Usage: scripts/test-rust-core.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$ROOT/apps/desktop/src-tauri/src"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

mkdir -p "$WORK/src/platform" "$WORK/src/context"
cp "$SRC/app_id.rs" "$SRC/error.rs" "$WORK/src/"
cp "$SRC/rules/mod.rs" "$WORK/src/rules.rs"
cp "$SRC/scenes/mod.rs" "$WORK/src/scenes.rs"
cp "$SRC/platform/linux.rs" "$WORK/src/platform/"

# The real context module, not a hand-written stand-in. A duplicate here once
# carried the same snake_case serde bug as the real code and so never caught
# the mismatch against the camelCase TS types.
cp "$SRC/context/mod.rs" "$WORK/src/context/mod.rs"
# context/mod.rs declares `pub mod engine;`, which needs the platform adapters.
# Nothing under test calls it, so an empty module keeps the real definitions
# compiling without dragging in Tauri.
: > "$WORK/src/context/engine.rs"

# rustc will not run #[cfg(test)] modules unless the crate root declares them.
cat > "$WORK/Cargo.toml" <<EOF
[package]
name = "auraos-core-tests"
version = "0.1.0"
edition = "2021"

[features]
default = []
tauri-host = []

[dependencies]
serde = { version = "1", features = ["derive"] }
serde_json = "1"
thiserror = "2"
EOF

# `rules` and `scenes` only need the context types, which are copied verbatim
# from the real crate above, so no stand-in is required here.
cat > "$WORK/src/lib.rs" <<'EOF'
#![allow(dead_code)]

// `rules` and `platform::linux` both refer to crate::context.
pub mod context;
pub mod app_id;
pub mod error;
pub mod rules;
pub mod scenes;

/// Trimmed stand-in for the adapter trait in `platform/mod.rs`.
pub trait SignalProvider: Send + Sync {
    fn active_application(&self) -> Option<crate::context::ApplicationInfo> {
        None
    }
    fn workspace(&self) -> Option<u32> {
        None
    }
}

#[path = "platform/linux.rs"]
pub mod platform_linux;
EOF

rm -f "$WORK/src/context.rs"


cd "$WORK"
cargo test --lib 2>&1 | tail -40