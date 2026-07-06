# CLAUDE.md

Guidance for Claude Code when working in this theme.

## What this is

Custom WooCommerce theme for the coin-container.de rebuild, running on the
`coin-container-new.local` Local by Flywheel site. Based on the pra-theme starter.

## Project docs & task queue (start here)

Everything about the project lives OUTSIDE this repo, in the project library:
`C:\Users\user\Documents\work\coin-container-new\`

- `задачі\00-роадмап.md` — task queue (T-XX) with statuses and dependencies
- `задачі\README.md` — execution protocol and task-card template
- `план-робіт.md` — overall stage plan; `звіти\`, `рішення\`, `питання\` — reports, decisions, open questions

Entry-point skill: **ccn-task**. Related skills: ccn-verify (run after any change,
always before commit), ccn-perf (before/after every perf change), ccn-commit
(commit conventions), ccn-acf (ACF conventions), wp (WP-CLI for Local sites).

## Hard rules

- Production coin-container.de is OFF LIMITS (deploy is a separate, user-driven stage).
- This repo is PUBLIC: no credentials, keys, dumps, or license keys in any commit.
- Languages: code/comments/docs — English; site content — German; gettext domain
  `coin-container` on every string (WPML-ready).
- Performance budget (Lighthouse mobile, homepage): score ≥ 99, LCP ≤ 1.9 s,
  ≤ 370 KB transfer, ≤ 20 requests. Vanilla JS only, everything deferred,
  fonts self-hosted.
- Admin-editable globals: single ACF "Site Settings" options page (tabs), read
  via the cached `ccn_setting()` helper only.
- ACF: field groups sync to `acf-json/` — commit together with templates.

## Tests

`cd tests && node js-smoke.mjs` — Playwright smoke, must be N/N PASS before any
commit. Add checks for every new interactive block. Base URL override: `CCN_BASE_URL`.
