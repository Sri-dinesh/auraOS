# AuraOS

> Your desktop. Aware of your context.

AuraOS is a **context-aware desktop layer**. It watches what you are doing
locally — which app is focused, the time, battery, media, idle state — and
shifts your desktop's atmosphere (wallpaper, tint, effects, widgets, motion) to
match.

The defining architectural principle: **desktop intelligence stays local.**
The cloud handles authentication, sync, and presets only. AuraOS keeps working
when the servers — or your internet — are unavailable.

```
Rust/Tauri is the product engine. React is the control surface.
Fastify/Neon is the optional cloud layer.
```

---

## Status

Phase 0 (Foundation) and the core of Phase 2–4 are implemented and verified.
The Rust context/rules/scene engines and the React shell exist and pass tests;
the native integrations that need a live compositor or a running cloud database
are still stubs.

| Area | State |
|---|---|
| Monorepo, Turborepo, shared packages | done, typechecks clean |
| Rules engine (TS + Rust) | done, **52 tests passing** |
| Scene model + diffing | done |
| Context engine + platform adapters | done (Hyprland reference, sysfs battery/input) |
| System tray, global shortcut, single instance | done |
| Fastify API (scenes/rules/devices/presets/sync/users) | done, typechecks clean |
| Prisma 7 schema + generated client | done |
| React shell (6 screens, Raycast-inspired theme) | done, builds |
| Wallpaper engine, overlay renderer, scene builder UI | not started |
| Better Auth provider wiring (real OAuth credentials) | skeleton only |
| Database migrations against a real Postgres | not run |

---

## Requirements

- Node.js 20.19+ / 22.12+ / 24+
- pnpm 11+
- Rust 1.77.2+
- Linux GTK/WebKit dev headers for the desktop shell:
  `webkit2gtk-4.1 libgtk-3-dev libsoup-3.0-dev libjavascriptcoregtk-4.1-dev`
- `xdotool` (provides `libxdo`, required by the global-shortcut plugin)

On Arch:

```bash
sudo pacman -S webkit2gtk-4.1 gtk3 libsoup3 libxdo
```

---

## Getting started

```bash
pnpm install
pnpm --filter @auraos/validation build        # emits dist/ consumed by the API
pnpm --filter @auraos/api db:generate        # generate the Prisma client
cp .env.example apps/api/.env                # then fill in DATABASE_URL
```

### Run the desktop app

```bash
pnpm dev:desktop            # Vite only, browser preview
pnpm --filter @auraos/desktop tauri dev   # full desktop shell
```

### Run the API

```bash
pnpm dev:api                # http://localhost:3000, docs at /docs
```

The API needs a PostgreSQL database. Point `DATABASE_URL`/`DIRECT_URL` at one
(Neon works well), then:

```bash
pnpm --filter @auraos/api db:push
```

### Checks

```bash
pnpm typecheck                # TS across the workspace
pnpm --filter @auraos/rules test   # rules engine (24 tests)
pnpm test:rust                 # rules/scenes/adapters in Rust (28 tests)
cd apps/desktop/src-tauri && cargo check --lib   # full Rust crate
```

`pnpm test:rust` compiles only the pure-logic Rust modules, so it works even
without GTK/WebKit/`libxdo` installed.

### Build the Windows installer

```bash
./scripts/build-windows.sh            # -> dist-release/AuraOS-Setup.exe
./scripts/build-windows.sh --skip-frontend   # reuse existing apps/desktop/dist
```

The only host requirement is Docker. The build runs inside
`docker/Dockerfile.windows-cross`, which cross-compiles the Rust core for
`x86_64-pc-windows-msvc` with `cargo-xwin` and bundles an NSIS installer. The
frontend is built on the host first, then embedded into the binary (brotli) by
`tauri-build`, so the window is not blank.

Tauri treats cross-compiling to Windows from Linux as experimental, so a Windows
CI runner is still the better release path. Three host-specific details are
handled inside the image:

- NSIS from Debian bookworm is 3.08, which lacks `Include/Win/RestartManager.nsh`
  that Tauri's installer script requires. The image overlays NSIS 3.11's
  `Include`/`Stubs`/`Plugins` onto Debian's `makensis`.
- The Tauri CLI aborts on a Linux host when it cannot find an appindicator
  library, even for a Windows bundle, because the crate enables `tray-icon`.
- Windows bundles require a real `.ico`; `icons/build-ico.mjs` generates a
  multi-size one from the checked-in PNGs (the script calls it automatically).

---

## Repository layout

```
auraos/
├── apps/
│   ├── desktop/                  React + Vite UI, Rust/Tauri core
│   │   ├── src/                  app, components, pages, stores, hooks, lib
│   │   └── src-tauri/src/
│   │       ├── app_id.rs         OS app name -> stable rule id
│   │       ├── commands/         narrow, validated IPC surface
│   │       ├── context/          DesktopContext model + engine
│   │       ├── error.rs          structured errors for the UI
│   │       ├── platform/         per-OS signal adapters
│   │       ├── rules/            rules engine + priority resolution
│   │       ├── scenes/           scene model + change diffing
│   │       └── tray.rs           system tray
│   └── api/                      Fastify + Prisma + Better Auth
│       └── src/modules/          auth users scenes rules devices presets sync health
│                               each: route + service + repository
├── packages/
│   ├── contracts/                shared wire types
│   ├── types/                    Scene, Rule, Context, Device, Sync
│   ├── validation/               Zod schemas mirroring the API routes
│   ├── rules/                    rules engine (TS) + vitest suite
│   └── ui/                       shadcn-style primitives on Radix
├── prisma/schema.prisma
├── prisma.config.ts              Prisma 7 config (URLs live here, not the schema)
└── scripts/test-rust-core.sh
```

---

## Core concepts

**Context** — what is happening right now (active app, hour, battery, media,
idle, workspace). Assembled locally by the Rust platform adapters.

**Rule** — *when* something should happen. Generic conditions plus an action;
never a hard-coded `if (app === "vscode")`.

**Scene** — a complete desktop atmosphere: visual config, effects, widgets,
audio, and behaviour.

**Profile** — a collection of scenes and rules.

### Rules and priorities

Several rules can match at once. The highest priority wins:

```
Battery Saver  100
Gaming          90
Coding          60
Night           30
Default          0
```

A manual override short-circuits automation entirely. Cooldowns stop a rule
re-firing on every context poll. Every decision produces a trace, which is what
the rule debugger UI will render.

### App identifiers

Rules match on **stable ids**, never display names. `Visual Studio Code`,
`code`, `code.desktop`, and `org.gnome-terminal` all normalize to `code` and
`terminal` respectively. This normalization exists in both
`packages/rules/src/apps.ts` and `src-tauri/src/app_id.rs` and the two must be
kept in sync.

---

## Privacy

AuraOS is built so its privacy claims stay true:

- Window titles, browser titles, file names, and app history are processed
  **locally only** and are never uploaded.
- Cloud analytics are aggregate scene durations (`"Focus": 72 minutes`), never
  content.
- API telemetry is disabled in the Better Auth config.
- Non-sensitive preferences use Tauri Store; tokens belong in Stronghold.