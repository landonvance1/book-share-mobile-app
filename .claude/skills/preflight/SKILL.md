---
allowed_tools:
  - "Bash(npx tsc *)"
  - "Bash(npm run lint *)"
  - "Bash(npm run test *)"
  - "Bash(npx expo export *)"
---

# Preflight Check Skill

A sanity check for Claude Code sessions before commits and PRs.

## When to Use

Invoke this skill:
- After completing a feature or significant code change
- Before creating a PR
- When you want to ensure quality gates pass
- After refactoring

## Checks

### Phase 1: Type Check
```bash
# TypeScript projects
npx tsc --noEmit 2>&1 | head -30
```

Report all type errors. Fix critical ones before continuing.

### Phase 2: Lint Check
```bash
# JavaScript/TypeScript
npm run lint 2>&1 | head -30
```

### Phase 3: Build Verification
```bash
# Check if project builds
npx expo export --platform ios 2>&1 | tail -20
```

If build fails, STOP and fix before continuing.

### Phase 4: Test Suite
```bash
# Run tests with coverage
npm run test -- --coverage 2>&1 | tail -50

# Check coverage threshold
```

Report:
- Total tests: X
- Passed: X
- Failed: X
- Coverage: X%

Review each changed file for:
- Unintended changes
- Missing error handling
- Potential edge cases

## Output Format

After running all phases, produce a preflight report:

```
PREFLIGHT REPORT
================

Build:     [PASS/FAIL]
Types:     [PASS/FAIL] (X errors)
Lint:      [PASS/FAIL] (X warnings)
Tests:     [PASS/FAIL] (X/Y passed, Z% coverage)

Overall:   [READY/NOT READY] for PR

Issues to Fix:
1. ...
2. ...
```