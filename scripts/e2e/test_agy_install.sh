#!/usr/bin/env bash
# test_agy_install.sh — e2e for the agy (Antigravity CLI) install path
# (bead bd-47kjh.5.4). Verifies agy is installed in ~/.local/bin, the installer
# is checksum-verifiable against checksums.yaml, agy is on PATH, and (if
# authenticated) a headless model-pinned round-trip works. Uses the shared
# agy e2e harness; SKIPS cleanly when agy is unavailable/unauthenticated.
#
# Run: bash scripts/e2e/test_agy_install.sh
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
# shellcheck disable=SC1091
source "$REPO_ROOT/scripts/lib/agy_e2e_harness.sh"
# shellcheck disable=SC1091
source "$REPO_ROOT/scripts/lib/security.sh" >/dev/null 2>&1 || true

agy_e2e_init "acfs-agy-install"

# 1. Binary present in the primary bin (the manifest installs to ~/.local/bin).
target_bin="${ACFS_BIN_DIR:-$HOME/.local/bin}"
if [[ -x "$target_bin/agy" || -x "$HOME/.local/bin/agy" ]] || command -v agy >/dev/null 2>&1; then
  agy_e2e_pass "agy binary present" install_present
else
  agy_e2e_skip "agy not installed (run the ACFS agents.antigravity module)" install_absent
  agy_e2e_summary; exit 0
fi

# 2. agy is on PATH and reports a version.
ver="$(agy --version 2>/dev/null | head -1)"
[[ -n "$ver" ]] && agy_e2e_pass "agy on PATH (v$ver)" on_path || agy_e2e_fail "agy not runnable from PATH" on_path

# 3. The installer is supply-chain-verifiable: checksums.yaml resolves a sha for it.
export CHECKSUMS_FILE="${CHECKSUMS_FILE:-$REPO_ROOT/checksums.yaml}"
load_checksums >/dev/null 2>&1 || true
sha="$(get_checksum antigravity 2>/dev/null || true)"
if [[ "$sha" =~ ^[0-9a-f]{64}$ ]]; then
  agy_e2e_pass "antigravity installer checksum present ($sha)" checksum_present
else
  agy_e2e_fail "antigravity installer checksum missing from checksums.yaml" checksum_present
fi

# 4. (Optional, auth-gated) a real headless round-trip on the pinned model.
if agy_e2e_skip_if_unauth "skipping live round-trip"; then
  out="$(agy_e2e_print 'Reply with exactly: OK')"
  if [[ -n "$out" ]]; then agy_e2e_pass "headless round-trip returned output" roundtrip
  else agy_e2e_fail "headless round-trip returned nothing" roundtrip; fi
  agy_e2e_assert_model "$out"
  conv="$(agy_e2e_newest_conversation)"
  [[ -n "$conv" ]] && agy_e2e_log info conversation_persisted "uuid=$conv"
fi

agy_e2e_summary
