#!/usr/bin/env bash
# test_agy_install.sh — unit/contract tests for the agy (Antigravity CLI) install
# integration (bead bd-47kjh.5.4). Asserts the installer step exists + is
# checksum-gated, the manifest is drift-free, and config/docs reference agy.
#
# Run: bash tests/unit/test_agy_install.sh
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$REPO_ROOT"

PASS=0 FAIL=0
ok()   { printf '  ✓ PASS: %s\n' "$1"; PASS=$((PASS+1)); }
no()   { printf '  ✗ FAIL: %s\n' "$1"; FAIL=$((FAIL+1)); }
check(){ if eval "$2"; then ok "$1"; else no "$1"; fi; }

echo "agy install contract tests"

# 1. KNOWN_INSTALLERS registers the antigravity installer URL (5.3).
check "security.sh registers antigravity installer" \
  "grep -q '\[antigravity\]=\"https://antigravity.google/cli/install.sh\"' scripts/lib/security.sh"

# 2. checksums.yaml has an antigravity entry with a sha256 (checksum-monitored).
check "checksums.yaml has antigravity url" \
  "grep -A2 '^  antigravity:' checksums.yaml | grep -q 'antigravity.google/cli/install.sh'"
check "checksums.yaml antigravity has sha256" \
  "grep -A2 '^  antigravity:' checksums.yaml | grep -qE 'sha256: \"[0-9a-f]{64}\"'"

# 3. The manifest declares the agents.antigravity module (recommended, default-on).
check "manifest declares agents.antigravity" \
  "grep -q 'id: agents.antigravity' acfs.manifest.yaml"
check "agents.antigravity uses the verified_installer (antigravity) path" \
  "awk '/id: agents.antigravity/{f=1} f&&/tool: antigravity/{print;exit}' acfs.manifest.yaml | grep -q 'tool: antigravity'"

# 4. The generated installer contains a checksum-gated agy install step.
check "generated install_agents.sh has install_agents_antigravity()" \
  "grep -q 'install_agents_antigravity()' scripts/generated/install_agents.sh"
check "agy install step is checksum-gated (verify_checksum)" \
  "awk '/install_agents_antigravity\(\)/{f=1} f&&/verify_checksum/{print;exit}' scripts/generated/install_agents.sh | grep -q verify_checksum"

# 5. agy is resolvable through the security layer (URL + checksum lookup).
check "get_checksum antigravity resolves to a 64-hex sha" \
  "bash -c 'source scripts/lib/security.sh >/dev/null 2>&1; export CHECKSUMS_FILE=checksums.yaml; load_checksums >/dev/null 2>&1; get_checksum antigravity' | grep -qE '^[0-9a-f]{64}$'"

# 6. Manifest drift is clean after generation (the recurring SHA256-drift hazard).
check "manifest drift is clean" \
  "bash scripts/check-manifest-drift.sh --quiet >/dev/null 2>&1"

# 7. Config/conventions reference agy (zshrc launcher + doctor check).
check "acfs.zshrc defines an agy() launcher" \
  "grep -q '^agy()' acfs/zsh/acfs.zshrc"
check "acfs.zshrc agy() pins the required model" \
  "grep -A2 '^agy()' acfs/zsh/acfs.zshrc | grep -q 'Gemini 3.1 Pro (High)'"
check "doctor checks for the agy alias" \
  "grep -q 'agent.alias.agy' scripts/lib/doctor.sh"

# 8. The shared e2e harness exists and self-tests clean (bd-47kjh.12).
check "agy e2e harness self-test passes" \
  "bash scripts/lib/agy_e2e_harness.sh --self-test >/dev/null 2>&1"

echo ""
echo "agy install contract: $PASS passed, $FAIL failed"
[[ "$FAIL" -eq 0 ]]
