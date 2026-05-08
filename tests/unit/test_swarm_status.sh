#!/usr/bin/env bash
# ============================================================
# Unit tests for acfs swarm status collector
# ============================================================

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SWARM_STATUS_SH="$REPO_ROOT/scripts/lib/swarm_status.sh"

TESTS_PASSED=0
TESTS_FAILED=0
ARTIFACT_DIR="${ACFS_SWARM_STATUS_TEST_ARTIFACTS_DIR:-${TMPDIR:-/tmp}/acfs-swarm-status-test-artifacts-$(date +%Y%m%d-%H%M%S)-$$}"

mkdir -p "$ARTIFACT_DIR"

pass() {
    TESTS_PASSED=$((TESTS_PASSED + 1))
    echo "PASS: $1"
}

fail() {
    TESTS_FAILED=$((TESTS_FAILED + 1))
    echo "FAIL: $1"
    [[ -n "${2:-}" ]] && echo "  Reason: $2"
}

write_artifact() {
    local name="$1"
    local content="$2"
    printf '%s\n' "$content" > "$ARTIFACT_DIR/$name"
}

make_stub_dir() {
    local stub_dir
    stub_dir="$(mktemp -d)"
    printf '%s\n' "$stub_dir"
}

write_executable() {
    local path="$1"
    local body="$2"
    printf '%s\n' "$body" > "$path"
    chmod +x "$path"
}

test_no_tool_environment_warns() {
    local output
    output="$(PATH="/usr/bin:/bin" ACFS_SWARM_STATUS_TIMEOUT=1 bash "$SWARM_STATUS_SH" --json)"
    write_artifact "no_tool_environment.json" "$output"

    jq -e '
      .schema_version == 1 and
      .status == "warn" and
      .probes.beads.available == false and
      .probes.bv.available == false and
      .probes.rch.available == false and
      (.warnings | length) > 0
    ' <<<"$output" >/dev/null || return 1

    pass "no_tool_environment_warns"
}

test_stubbed_tools_pass() {
    local stub_dir
    stub_dir="$(make_stub_dir)"

    write_executable "$stub_dir/ntm" '#!/usr/bin/env bash
[[ "$1" == "--robot-status" ]] || exit 2
echo "{\"sessions\":[{\"name\":\"main\"}]}"'

    write_executable "$stub_dir/tmux" '#!/usr/bin/env bash
[[ "$1" == "list-sessions" ]] || exit 2
printf "main\t3\nworkers\t2\n"'

    write_executable "$stub_dir/am" '#!/usr/bin/env bash
[[ "$1 $2 $3" == "doctor check --json" ]] || exit 2
echo "{\"healthy\":true}"'

    write_executable "$stub_dir/br" '#!/usr/bin/env bash
case "$*" in
  "ready --json") echo "{\"issues\":[{\"id\":\"bd-a\"}],\"total\":1}" ;;
  "list --status in_progress --json") echo "{\"issues\":[],\"total\":0}" ;;
  "list --status open --json") echo "{\"issues\":[{\"id\":\"bd-a\"},{\"id\":\"bd-b\"},{\"id\":\"bd-c\"}],\"total\":3}" ;;
  *) exit 2 ;;
esac'

    write_executable "$stub_dir/bv" '#!/usr/bin/env bash
[[ "$1" == "--robot-next" ]] || exit 2
echo "{\"recommendation\":{\"id\":\"bd-a\"}}"'

    write_executable "$stub_dir/rch" '#!/usr/bin/env bash
[[ "$1 $2" == "status --json" ]] || exit 2
echo "{\"daemon\":{\"running\":true},\"queue\":{\"active\":0}}"'

    local output
    output="$(PATH="$stub_dir:/usr/bin:/bin" ACFS_SWARM_STATUS_TIMEOUT=1 bash "$SWARM_STATUS_SH" --json)"
    write_artifact "stubbed_tools.json" "$output"

    jq -e '
      .status == "pass" and
      .probes.ntm.available == true and
      .probes.ntm.robot_status_ok == true and
      .probes.ntm.tmux_session_count == 2 and
      .probes.ntm.tmux_window_count == 5 and
      .probes.agent_mail.status == "pass" and
      .probes.agent_mail.healthy == true and
      .probes.beads.ready_count == 1 and
      .probes.beads.in_progress_count == 0 and
      .probes.beads.open_count == 3 and
      .probes.bv.robot_ok == true and
      .probes.rch.status_json_ok == true
    ' <<<"$output" >/dev/null || return 1

    pass "stubbed_tools_pass"
}

test_timeout_becomes_structured_warning() {
    local stub_dir
    stub_dir="$(make_stub_dir)"

    write_executable "$stub_dir/ntm" '#!/usr/bin/env bash
sleep 2
echo "{\"sessions\":[]}"'

    local output
    output="$(PATH="$stub_dir:/usr/bin:/bin" ACFS_SWARM_STATUS_TIMEOUT=1 bash "$SWARM_STATUS_SH" --json)"
    write_artifact "timeout_warning.json" "$output"

    jq -e '
      .status == "warn" and
      .probes.ntm.status == "warn" and
      any(.probes.ntm.warnings[]; contains("ntm --robot-status failed or timed out"))
    ' <<<"$output" >/dev/null || return 1

    pass "timeout_becomes_structured_warning"
}

test_human_output() {
    local output
    output="$(PATH="/usr/bin:/bin" ACFS_SWARM_STATUS_TIMEOUT=1 bash "$SWARM_STATUS_SH")"
    write_artifact "human_output.txt" "$output"

    grep -Fq "ACFS Swarm Status" <<<"$output" || return 1
    grep -Fq "Status:" <<<"$output" || return 1
    grep -Fq "Warnings:" <<<"$output" || return 1

    pass "human_output"
}

run_test() {
    local name="$1"
    if "$name"; then
        return 0
    fi
    fail "$name"
}

main() {
    command -v jq >/dev/null 2>&1 || {
        echo "jq is required for swarm status tests" >&2
        exit 1
    }

    run_test test_no_tool_environment_warns
    run_test test_stubbed_tools_pass
    run_test test_timeout_becomes_structured_warning
    run_test test_human_output

    echo "Results: $TESTS_PASSED passed, $TESTS_FAILED failed"
    echo "Artifacts: $ARTIFACT_DIR"
    [[ $TESTS_FAILED -eq 0 ]]
}

main "$@"
