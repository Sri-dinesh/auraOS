#!/usr/bin/env bash
#
# Builds the AuraOS Windows NSIS installer on Linux via cross-compilation.
#
# Tauri officially supports building on a Windows host; cross-compiling to the
# MSVC target from Linux works with NSIS but is "a last resort" per the Tauri
# docs, so CI on a Windows runner is still the recommended release path.
#
# This wraps the whole thing in the docker/Dockerfile.windows-cross image so no
# host toolchain (rustup Windows target, cargo-xwin, NSIS) is required.
#
# Usage: ./scripts/build-windows.sh [--skip-frontend]
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IMAGE="auraos-windows-cross:latest"
OUT_DIR="$ROOT/dist-release"

SKIP_FRONTEND=""
for arg in "$@"; do
  case "$arg" in
    --skip-frontend) SKIP_FRONTEND="1" ;;
    *) echo "unknown flag: $arg" >&2; exit 2 ;;
  esac
done

# Windows bundles need a real .ico; it is generated from the checked-in PNGs.
node "$ROOT/apps/desktop/src-tauri/icons/build-ico.mjs"

echo "==> Building cross-compile image"
docker build -f "$ROOT/docker/Dockerfile.windows-cross" -t "$IMAGE" "$ROOT/docker"

echo "==> Building frontend"
if [ -z "$SKIP_FRONTEND" ]; then
  # Call vite/tsc directly instead of via `pnpm --filter ... exec`: pnpm's
  # dependency-status check runs a full install first, which fails on ignored
  # Prisma build scripts and has nothing to do with bundling the frontend.
  (cd "$ROOT/apps/desktop" && ./node_modules/.bin/tsc --noEmit)
  (cd "$ROOT/apps/desktop" && ./node_modules/.bin/vite build)
else
  echo "   (skipped, reusing existing apps/desktop/dist)"
fi

if [ ! -f "$ROOT/apps/desktop/dist/index.html" ]; then
  echo "!! frontend build missing: apps/desktop/dist/index.html" >&2
  exit 1
fi

echo "==> Cross-compiling for Windows (cargo-xwin) and bundling with NSIS"
# The frontend is built on the host above, so the in-container step only runs
# cargo/NSIS. That keeps the bind-mounted node_modules out of pnpm's way and
# avoids reinstalling the JS toolchain for every platform build.
docker run --rm \
  -v "$ROOT:/src" \
  -v auraos-cargo-registry:/usr/local/cargo/registry \
  -v auraos-xwin-cache:/opt/xwin-cache \
  "$IMAGE" \
  bash -euo pipefail -c '
    cd /src/apps/desktop

    export PATH="/usr/local/cargo/bin:$PATH"
    export CC_x86_64_pc_windows_msvc=clang-cl
    export CXX_x86_64_pc_windows_msvc=clang-cl
    export AR_x86_64_pc_windows_msvc=llvm-lib

    # The Tauri CLI is a Node native addon, so run it through the host-installed
    # node_modules (bind-mounted, but only read from here). We call the wrapper
    # script directly to avoid a pnpm install inside the container.
    #
    # beforeBuildCommand is emptied because the frontend was built above and is
    # picked up through frontendDist ("../dist"). The CLI enables the
    # custom-protocol cargo feature itself, which is what embeds that frontend
    # into the binary (brotli-compressed) — without it the app window is blank.
    #
    # Icon paths in a merged config are resolved relative to src-tauri, and the
    # .ico is required for the Windows resource file.
    node node_modules/@tauri-apps/cli/tauri.js build \
      --runner cargo-xwin \
      --target x86_64-pc-windows-msvc \
      --bundles nsis \
      --config "{\"build\":{\"beforeBuildCommand\":\"\"},\"bundle\":{\"targets\":[\"nsis\"],\"icon\":[\"icons/32x32.png\",\"icons/128x128.png\",\"icons/icon.png\",\"icons/icon.ico\"]}}"
  '

BUNDLE_DIR="$ROOT/apps/desktop/src-tauri/target/x86_64-pc-windows-msvc/release/bundle/nsis"
if [ ! -d "$BUNDLE_DIR" ]; then
  echo "!! bundle directory not found: $BUNDLE_DIR" >&2
  exit 1
fi

mkdir -p "$OUT_DIR"
# shellcheck disable=SC2012
ls -1t "$BUNDLE_DIR"/*.exe | head -n 1 | xargs -I{} cp {} "$OUT_DIR/AuraOS-Setup.exe"

echo
echo "==> Built:"
ls -lh "$OUT_DIR/AuraOS-Setup.exe"