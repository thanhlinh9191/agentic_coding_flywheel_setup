#!/usr/bin/env bash
# shellcheck disable=SC1091,SC2034
# ============================================================
# Test script for zsh.sh
# Run: bash scripts/lib/test_zsh.sh
# ============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

source "$SCRIPT_DIR/zsh.sh"

TESTS_PASSED=0
TESTS_FAILED=0

test_pass() {
    local name="$1"
    echo -e "\033[32m[PASS]\033[0m $name"
    ((++TESTS_PASSED))
}

test_fail() {
    local name="$1"
    local reason="${2:-}"
    echo -e "\033[31m[FAIL]\033[0m $name"
    [[ -n "$reason" ]] && echo "       Reason: $reason"
    ((++TESTS_FAILED))
}

with_temp_home() {
    local test_name="$1"
    shift
    local old_home="$HOME"
    local temp_home=""

    temp_home="$(mktemp -d)"
    HOME="$temp_home" "$@"
    local status=$?
    HOME="$old_home"
    return "$status"
}

stub_zsh_logging() {
    log_detail() { :; }
    log_success() { :; }
    log_error() { :; }
}

test_install_zsh_plugins_fails_when_autosuggestions_clone_fails() {
    stub_zsh_logging
    git() {
        return 42
    }

    if install_zsh_plugins >/dev/null 2>&1; then
        return 1
    fi

    [[ ! -d "$HOME/.oh-my-zsh/custom/plugins/zsh-autosuggestions" ]]
}

test_install_powerlevel10k_fails_when_clone_fails_after_creating_dir() {
    stub_zsh_logging
    git() {
        mkdir -p "$HOME/.oh-my-zsh/custom/themes/powerlevel10k"
        return 42
    }

    if install_powerlevel10k >/dev/null 2>&1; then
        return 1
    fi
}

test_install_zsh_plugins_fails_when_syntax_highlighting_clone_fails() {
    stub_zsh_logging
    mkdir -p "$HOME/.oh-my-zsh/custom/plugins/zsh-autosuggestions"

    git() {
        return 42
    }

    if install_zsh_plugins >/dev/null 2>&1; then
        return 1
    fi

    [[ ! -d "$HOME/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting" ]]
}

test_install_zsh_plugins_succeeds_when_all_plugins_present() {
    stub_zsh_logging
    mkdir -p "$HOME/.oh-my-zsh/custom/plugins/zsh-autosuggestions"
    mkdir -p "$HOME/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting"

    git() {
        return 42
    }

    install_zsh_plugins >/dev/null 2>&1
}

run_test() {
    local name="$1"
    if with_temp_home "$name" "$name"; then
        test_pass "$name"
    else
        test_fail "$name"
    fi
    unset -f git log_detail log_success log_error 2>/dev/null || true
}

main() {
    run_test test_install_powerlevel10k_fails_when_clone_fails_after_creating_dir
    run_test test_install_zsh_plugins_fails_when_autosuggestions_clone_fails
    run_test test_install_zsh_plugins_fails_when_syntax_highlighting_clone_fails
    run_test test_install_zsh_plugins_succeeds_when_all_plugins_present

    echo ""
    echo "Results: $TESTS_PASSED passed, $TESTS_FAILED failed"
    [[ "$TESTS_FAILED" -eq 0 ]]
}

main "$@"
