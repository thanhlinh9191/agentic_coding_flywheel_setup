#!/usr/bin/env bats

load '../test_helper'

setup() {
    common_setup
}

teardown() {
    common_teardown
}

@test "try_step: preserves output from failing shell function" {
    local context_lib="$PROJECT_ROOT/scripts/lib/context.sh"

    run bash -c '
        set -euo pipefail
        source "$1"
        failing_step() {
            printf "%s\n" "function failure detail"
            return 42
        }

        status=0
        try_step "failing shell function" failing_step || status=$?

        printf "status=%s\n" "$status"
        printf "last_error_output=%s\n" "$LAST_ERROR_OUTPUT"
        trap -p RETURN
    ' _ "$context_lib"

    assert_success
    assert_output --partial "status=42"
    assert_output --partial "function failure detail"
    refute_output --partial "trap --"
}

@test "try_step: preserves caller RETURN trap" {
    local context_lib="$PROJECT_ROOT/scripts/lib/context.sh"

    run bash -c '
        set -euo pipefail
        source "$1"
        probe_return_trap() {
            trap "caller_return_seen=1" RETURN
            try_step "successful shell function" successful_step >/dev/null 2>&1
            trap -p RETURN
        }
        successful_step() {
            return 0
        }
        probe_return_trap
    ' _ "$context_lib"

    assert_success
    assert_output --partial "caller_return_seen=1"
}

@test "try_step_eval: preserves caller RETURN trap" {
    local context_lib="$PROJECT_ROOT/scripts/lib/context.sh"

    run bash -c '
        set -euo pipefail
        source "$1"
        probe_return_trap() {
            trap "caller_return_seen=1" RETURN
            try_step_eval "successful eval" "true" >/dev/null 2>&1
            trap -p RETURN
        }
        probe_return_trap
    ' _ "$context_lib"

    assert_success
    assert_output --partial "caller_return_seen=1"
}
