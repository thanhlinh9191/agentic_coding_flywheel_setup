# Guide to Reducing Vercel Credit Usage

This guide documents the API commands used to optimize Vercel credit consumption by disabling automatic deployments and enabling smart build skipping.

## Prerequisites

### 1. Find Your Vercel Token

The Vercel CLI stores your auth token at:
```bash
cat "/Users/$(whoami)/Library/Application Support/com.vercel.cli/auth.json"
```

Extract the token value from the JSON output.

### 2. Find Your Project and Team IDs

```bash
# List all projects to find the one you want
vercel project ls

# Get project details including ID
vercel project inspect <project-name>
```

The project ID format is `prj_...` and team ID is `team_...`

You can also get these from the `.vercel/project.json` file if the project is linked:
```bash
cat .vercel/project.json
```

## Configuration Commands

Set these variables for the commands below:
```bash
VERCEL_TOKEN="<your-token-from-auth.json>"
PROJECT_ID="<your-project-id>"
TEAM_ID="<your-team-id>"
```

### 1. Disable Automatic Deployments

This prevents Vercel from automatically deploying on every git push or PR:

```bash
curl -s -X PATCH "https://api.vercel.com/v9/projects/${PROJECT_ID}?teamId=${TEAM_ID}" \
  -H "Authorization: Bearer ${VERCEL_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "gitProviderOptions": {
      "createDeployments": "disabled"
    }
  }'
```

**Options for `createDeployments`:**
- `"enabled"` - Deploy on every push (default)
- `"disabled"` - Never auto-deploy (manual only)

### 2. Enable Affected Projects Detection

Skip deployments when no relevant files changed (useful for monorepos):

```bash
curl -s -X PATCH "https://api.vercel.com/v9/projects/${PROJECT_ID}?teamId=${TEAM_ID}" \
  -H "Authorization: Bearer ${VERCEL_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "enableAffectedProjectsDeployments": true
  }'
```

### 3. Set Custom Ignore Build Command

Add a script that determines whether to build based on changed files:

```bash
curl -s -X PATCH "https://api.vercel.com/v9/projects/${PROJECT_ID}?teamId=${TEAM_ID}" \
  -H "Authorization: Bearer ${VERCEL_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "commandForIgnoringBuildStep": "bash scripts/vercel-ignore-build.sh"
  }'
```

### 4. All-in-One Command

Apply all optimizations at once:

```bash
curl -s -X PATCH "https://api.vercel.com/v9/projects/${PROJECT_ID}?teamId=${TEAM_ID}" \
  -H "Authorization: Bearer ${VERCEL_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "gitProviderOptions": {
      "createDeployments": "disabled"
    },
    "enableAffectedProjectsDeployments": true,
    "commandForIgnoringBuildStep": "bash scripts/vercel-ignore-build.sh"
  }'
```

### 5. Verify Configuration

Check current project settings:

```bash
curl -s -X GET "https://api.vercel.com/v9/projects/${PROJECT_ID}?teamId=${TEAM_ID}" \
  -H "Authorization: Bearer ${VERCEL_TOKEN}" \
  -H "Content-Type: application/json" | jq '{
    name: .name,
    gitProviderOptions: .gitProviderOptions,
    enableAffectedProjectsDeployments: .enableAffectedProjectsDeployments,
    commandForIgnoringBuildStep: .commandForIgnoringBuildStep
  }'
```

## Ignore Build Script

Create `scripts/vercel-ignore-build.sh` in your project:

```bash
#!/bin/bash
# Vercel Ignored Build Step
# https://vercel.com/docs/project-configuration/vercel-json#ignorecommand
#
# Exit 0 = SKIP build (no relevant changes)
# Exit 1 = PROCEED with build (relevant changes detected)

set -e

echo "Checking if relevant files changed..."

PREV_SHA="${VERCEL_GIT_PREVIOUS_SHA:-HEAD~1}"
CURR_SHA="${VERCEL_GIT_COMMIT_SHA:-HEAD}"

# Paths that should trigger a rebuild (adjust for your project)
TRIGGER_PATHS=(
    "apps/web/"      # Your app directory
    "package.json"   # Root package.json
    "bun.lock"       # Lockfile
)

for path in "${TRIGGER_PATHS[@]}"; do
    if git diff --name-only "$PREV_SHA" "$CURR_SHA" 2>/dev/null | grep -q "^${path}"; then
        echo "Changes detected in: $path"
        exit 1  # Build
    fi
done

echo "No relevant changes - skipping build"
exit 0  # Skip
```

Also add to `vercel.json`:
```json
{
  "ignoreCommand": "bash scripts/vercel-ignore-build.sh"
}
```

## Manual Deployment

With automatic deployments disabled, deploy manually:

```bash
# Production deployment
vercel --prod

# Preview deployment
vercel
```

## Quick Reference

| Setting | API Field | Value | Effect |
|---------|-----------|-------|--------|
| Disable auto-deploy | `gitProviderOptions.createDeployments` | `"disabled"` | No deploys on push/PR |
| Smart skip | `enableAffectedProjectsDeployments` | `true` | Skip unchanged projects |
| Custom check | `commandForIgnoringBuildStep` | `"bash ..."` | Run script to decide |

## Restoring Automatic Deployments

If you want to re-enable automatic deployments:

```bash
curl -s -X PATCH "https://api.vercel.com/v9/projects/${PROJECT_ID}?teamId=${TEAM_ID}" \
  -H "Authorization: Bearer ${VERCEL_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "gitProviderOptions": {
      "createDeployments": "enabled"
    }
  }'
```

## Sources

- [Vercel Environments Documentation](https://vercel.com/docs/deployments/environments)
- [Vercel REST API](https://vercel.com/docs/rest-api)
- [Managing Deployments](https://vercel.com/docs/deployments/managing-deployments)
- [GitHub Discussion: Disable Preview Deployments](https://github.com/vercel/vercel/discussions/5878)
