---
name: project-feature-flow
description: Use for this repository when implementing a feature, bug fix, refactor, UI change, or other code change. Follow the project workflow from context gathering and ambiguity checks through implementation, version/log sync, build/lint verification, and final summary. Trigger when the user asks to add, fix, modify, optimize, refactor, or implement code in this Vue/Vite project.
---

# Project Feature Flow

## Core Rule

Do not rush into coding when the request is ambiguous. If the goal, affected behavior, UX expectation, data contract, versioning impact, or acceptance criteria is unclear, ask the user a concise clarifying question before editing files.

Use best judgment only when the ambiguity is low risk and the existing code/docs clearly imply the intended behavior. State the assumption before or after the change.

## Workflow

1. Read `AGENTS.md` first.
2. Read task-relevant docs:
    - `AI_GUIDE.md` for non-trivial feature, API, layout, or store changes.
    - `README.md` for project positioning or backend usage.
    - `docs/更新日志.md` when the change is user-visible or version-related.
    - `docs/版本策略.md` before any code or release metadata change.
    - `docs/ai-plans/README.md` plus the matching `docs/ai-plans/<slug>.md` when the user wants to continue a multi-session plan, says goal mode, or the request clearly matches an `active` plan. Execute only the current step.
3. Inspect the nearest relevant source files before deciding an approach.
4. Check for ambiguity:
    - Ask the user before coding if multiple valid behaviors exist.
    - Ask before changing production backend URLs, routing mode, deployment workflow, dependencies, auth/token behavior, or public API assumptions.
    - Ask before choosing a large refactor when a smaller scoped fix could work.
5. Implement narrowly, following existing Vue, Element Plus, Pinia, SCSS, and request-layer patterns.
6. For code changes, synchronize release metadata:
    - Read the current local date.
    - Read `docs/版本策略.md`, then decide whether the release increments major, minor, or patch. Do not infer minor from `feat` alone.
    - Use public format `Vmajor.minor.patch.yyyymmdd` in `docs/更新日志.md` and `src/apis/httpInstance.ts` export `sbVersion`.
    - Use SemVer-compatible `major.minor.patch+yyyymmdd` in `package.json`. `pnpm-lock.yaml` does not store the root release version and is not a version sync point.
    - Treat one task/release batch as one bump. Append to an existing heading only when it is the same unreleased version, not merely the same date.
    - Preserve legacy `YY.MM.DD` changelog headings instead of rewriting history.
7. Verify:
    - Run `pnpm run lint`, `pnpm run typecheck`, and `pnpm run build` unless the change is docs-only or a blocker is clear.
    - For UI changes, review desktop and mobile breakpoints statically and leave actual visual acceptance to the user.
    - Unless the user explicitly requests it in the current task, do not run `pnpm run dev`, `pnpm run preview`, or another project server; do not open or control a browser; and do not use screenshots, recordings, or pixel comparison for visual verification.
8. Review the final diff for unrelated edits, generated files, secrets, and version/log consistency.
9. Final response should summarize what changed, verification results, note that no browser preview was performed for UI work, and report any remaining risk or skipped checks.

## Project-Specific Guardrails

- Do not copy `dpahjdoiaw` into third-party clients, bots, scripts, or docs examples.
- Do not edit `dist/`, `.pnpm-store/`, `node_modules/`, or `tsconfig.node.tsbuildinfo`.
- Do not silently modify user-created unrelated changes in the working tree.
- Keep `AGENTS.md` current when project workflow or agent expectations change.
