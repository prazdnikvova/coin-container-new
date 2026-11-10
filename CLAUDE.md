# CLAUDE.md

Guidance for Claude Code when working in this theme.

## What this is

Custom WooCommerce theme for the coin-container.de rebuild, running on the
`coin-container-new.local` Local by Flywheel site. Based on the pra-theme starter.

## Project docs & task queue (start here)

Everything about the project lives OUTSIDE this repo, in the project library:
`C:\Users\user\Documents\work\coin-container-new\`

- `tasks\00-roadmap.md` — task queue (T-XX) with statuses and dependencies
- `tasks\README.md` — execution protocol and task-card template
- `tasks\00-director.md` — the relaunch package (stages 13–14): environment
  constants and commands, the rules of every card, the acceptance checklist;
  its current state and baselines in `tasks\00-state.md`
- `work-plan.md` — overall stage plan; `reports\`, `decisions\`, `questions\` — reports, decisions, open questions

Entry-point skill: **ccn-task**. Related skills: ccn-verify (run after any change,
always before commit), ccn-perf (before/after every perf change), ccn-commit
(commit conventions), ccn-acf (ACF conventions), wp (WP-CLI for Local sites).

## Hard rules

- Production coin-container.de is OFF LIMITS (deploy is a separate, user-driven stage).
- This repo is PUBLIC: no credentials, keys, dumps, or license keys in any commit.
- Languages: code/comments/docs — English; site content — German (formal
  «Sie», site locale `de_DE_formal`); gettext domain `coin-container` on every
  string, German in `languages/`. English at `/en/` through TranslatePress
  free: gettext everywhere, no hardcoded strings, the SEO layer in
  `inc/trp-seo-en.php` (README "Languages").
- Performance budget (Lighthouse mobile, homepage): score ≥ 99, LCP ≤ 1.9 s,
  ≤ 370 KB transfer, ≤ 20 requests; `theme.css` and the front page document
  each ≤ 14 600 bytes sent gzip (the first TCP window, smoke "First TCP
  window"). Vanilla JS only, everything deferred, fonts self-hosted; jQuery
  only on the WooCommerce pages, for WooCommerce's own scripts.
- Admin-editable globals: single ACF "Site Settings" options page (tabs), read
  via the cached `ccn_setting()` helper only.
- Comments: off site-wide, as on production (`inc/disable-comments.php`) — no
  comments template, no `comments_template()` call, no comment reply script
  (smoke "Hygiene (T-60)").
- ACF: field groups sync to `acf-json/` — commit together with templates.
- Design: every colour/size/space/shadow/duration is a token from `theme.css`
  `:root`, documented in `DESIGN.md`; no raw hex outside `:root`; yellow and
  orange never as text on light (smoke "Design tokens").
- Markup: one `<header>`, `<main>`, `<footer>` and `<h1>` per page, every
  `<nav>` named, no skipped heading levels — README "Markup standard",
  enforced by the smoke test ("Structure invariants").
- Motion: only `opacity`/`transform`, content visible without JS, reduced
  motion switches it off, a new block root gets `data-motion="reveal"` —
  `DESIGN.md` "Motion", smoke "Motion invariants".
- Editor: page layouts are patterns in `patterns/` (category «Coin
  Container», German placeholders in brackets, no locks); the block set of
  pages and posts, the removal of core block styles and of the group's Row /
  Stack / Grid variations and the pattern helpers live in `inc/editor.php` —
  README "Patterns" and "Editor", smoke "Editor patterns and guardrails
  (T-52)". A block without its key content prints nothing on the page, only
  a hint in the editor. Editor strings stay English, the brand is «Coin»,
  never «COIN».
- Shop: production's B2B mode lives in `inc/b2b.php` (Site Settings → Shop →
  `b2b_mode`, on by default): its texts are production's (copy changes go
  through the editorial process), the order meta `_coin_b2b_confirm` = `ja`
  is production's key, and its CSS stays inline on product, cart and
  checkout — README "Shop", smoke "B2B shop (T-57a)", `tests/checkout-e2e.mjs`
  (places a real order). The attribute filters of the product categories
  (`inc/catalog-filter.php`) are server-side links to WooCommerce's
  `filter_<attribute>` / `query_type_<attribute>` query vars — no AJAX filter
  plugin, no JS; filtered listings are noindex; the category text stands
  under the grid; their CSS lives only in `assets/css/catalog-filter.css` —
  README "Shop", smoke "Catalog filters (T-57b)".
- Glossary: plain pages, as on production (the hub `/glossar/` and one child
  page per term), no post type and no data file: `inc/glossary.php` builds
  production's A–Z index under the hub text and the DefinedTermSet /
  DefinedTerm schema from the pages themselves (title, Rank Math meta
  description, permalink), without CSS or gettext of its own — README
  "Glossary", smoke "Glossary (T-57c)".

## Tests

`cd tests && node js-smoke.mjs` — Playwright smoke (about 12 minutes, one page
at a time: run nothing else against the site meanwhile), must be N/N PASS
before any commit. Add checks for every new interactive block.
`node checkout-e2e.mjs` — checkout end to end, places a real order. Variables
(`CCN_BASE_URL`, `CCN_E2E_PRODUCT`, `CCN_PATTERN_TEST` + `CCN_WP_AUTH`,
`CCN_PHP*` / `CCN_WP_*`): README "Tests".
