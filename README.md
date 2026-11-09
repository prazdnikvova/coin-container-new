# Coin Container

[![CI](https://github.com/prazdnikvova/coin-container-new/actions/workflows/ci.yml/badge.svg)](https://github.com/prazdnikvova/coin-container-new/actions/workflows/ci.yml)

Custom WordPress/WooCommerce theme for [coin-container.de](https://coin-container.de) —
a performance-first rebuild of the existing Elementor-based site.

Built on the [pra-theme](https://github.com/prazdnikvova/pra-theme) starter
(clean template hierarchy, deferred assets with filemtime cache busting, security
hardening out of the box, i18n-ready, PHPCS + CI + Playwright smoke tests).

> Design reference: the previous site uses the purchased Transmax theme. This theme
> reproduces the visual design only — no Transmax code or assets are used.

## Performance budget

Benchmarked against the strongest competitor in the niche (Lighthouse mobile, homepage):

| Metric | Budget |
|---|---|
| Performance score | ≥ 99 |
| LCP | ≤ 1.9 s |
| Total transfer | ≤ 370 KB |
| Requests | ≤ 20 |

Every performance-affecting change is measured before/after (`npx lighthouse`,
mobile emulation) and the numbers go into the commit body.

## Stack & conventions

- WordPress + WooCommerce, ACF Pro (content as ACF blocks in the block editor,
  one "Site Settings" options page with tabs), Contact Form 7, Rank Math SEO
  (as on production; breadcrumbs and schema rules in `inc/seo.php`, `inc/schema.php`).
- Content blocks are ACF blocks registered in `blocks/acf-blocks.php` under
  custom inserter categories (COIN Banners / Lists / Products / Text); each
  block template lives in `blocks/<category>/<name>.php`, its fields in
  `acf-json/`. Blocks register as block API v3 / ACF Blocks v3 for the
  iframe editor of WP 7.1 (fields in the sidebar, previews in the canvas),
  and `theme.css` is also the editor style, so previews match the site. Every page is built from these blocks (front page, landings) or
  rendered by a plain template (legal pages, posts, shop); there is no
  flexible-content layer any more.
- Scoped assets: all block CSS lives in `assets/css/theme.css` and all theme
  JS in `assets/js/main.js` (none of the 18 blocks ships its own file today;
  the request forms' focus script `assets/js/forms.js` follows Contact Form
  7's own assets onto the pages with a form, `inc/assets-cleanup.php`).
  A block that ever needs one registers a script/style handle and lists it
  under `'assets'` in the registry; the handle is then enqueued only on pages
  that contain the block.
- Vanilla JS only, everything deferred; fonts self-hosted; no CSS frameworks,
  no jQuery.
- Motion: blocks opt in with `data-motion="reveal"` / `data-motion-stagger`;
  one IntersectionObserver in `main.js` and the "Motion" block at the end of
  `theme.css` do the rest. Content is visible without JS and with
  `prefers-reduced-motion`; hero and contact cards never move, the fixed
  header only compacts once scrolled ([`DESIGN.md`](DESIGN.md) "Motion",
  "Header").
- Design values are tokens in `assets/css/theme.css` (`:root`) — colours with
  measured contrast, one type scale, spacing, containers, radius, shadows,
  motion — documented in [`DESIGN.md`](DESIGN.md); `tests/contrast.cjs` is the
  WCAG calculator behind its tables.
- All strings wrapped in gettext with the `coin-container` text domain
  (WPML-ready); site content is German, code and docs are English.
- ACF field groups sync to `acf-json/` and are committed together with the
  templates that use them.
- Features of the production theme (`transmax-child`) are ported one file
  each into `inc/`, with the production behaviour and texts:
  `llms-txt.php` (the curated `/llms.txt`: answered by PHP as text/plain
  with `X-Robots-Tag: noindex`; in production a static copy is rewritten on
  every saved page or post, and the web server must send the noindex header
  for it, as production's root `.htaccess` does), `freshness.php` (the
  «Zuletzt aktualisiert» line of production's cluster and glossary pages,
  printed by the page templates after the content), `shortcodes.php` (the
  theme's only shortcode, `[ccn_dieselzuschlag]`: the diesel surcharge of
  Site Settings → Preise inside running text, as production's
  `[coin_dieselzuschlag]`), `price-table.php` (the price ranges of Site
  Settings → Preise for the `price-table` block, production's
  `inc/preise.php`).
- Admin-editable globals live on the Site Settings page and are read through a
  single cached helper — editable content must never add render-blocking or
  external requests. The one exception is the reviews widget block (live
  Google reviews and the Trustpilot TrustBox, as on production): its widget
  HTML comes from `/wp-json/ccn/v1/reviews` and its third-party scripts start
  only when the block comes near ([`DESIGN.md`](DESIGN.md) "Trust").

## Markup standard

Every page renders:

- exactly one `<header>` (the site banner in `header.php`), one
  `<main id="content" tabindex="-1">` (the skip-link target) and one
  `<footer>` (`footer.php`). Templates never wrap entry titles or meta in
  `<header>`/`<footer>`: they use `<div class="entry-header">` and
  `<div class="entry-footer">`, and `woocommerce/loop/header.php` does the
  same for WooCommerce. There is no second header for mobile or for the
  fixed/compact state — it is the same element.
- exactly one `<h1>`, then `h2` per section and `h3` inside it, without
  skipping a level. Footer and sidebar headings are fixed `h2`.
- a name on every `<nav>`, unique on the page and without the word
  "navigation" (screen readers add the role): `Hauptmenü` (header),
  `Rechtliches` (footer), `Schnellkontakt` (bottom action bar on phones),
  `Kategorien` (catalogue filter), the landing
  sidebar via `aria-labelledby` on its visible heading; WordPress and
  WooCommerce pagination bring their own labels. Search stays a
  `<form role="search">`.
- no `aria-label` on an element with visible text (it replaces the text for
  screen readers). Icon-only links are named by screen-reader text, and
  links that open a new tab say so ("(öffnet in neuem Tab)").
- anchor targets clear the fixed header (`scroll-padding-top` from
  `--ccn-header-total`); smooth scrolling only when the visitor has not asked
  for reduced motion.
- fewer than 800 DOM nodes in `<body>`.

Where the `<h1>` comes from:

| Page | Template | `<h1>` |
|---|---|---|
| Front page | `front-page.php` | title of the `home-hero` block (an `h2` wherever else the block is used) |
| Landing pages | `template-landing.php`, `template-landing-full.php` | page title in `template-parts/page-hero.php` |
| Other pages | `page.php` | page title |
| Post | `single.php` → `entry.php` | post title |
| Blog index | `home.php` | title of the page set as "Posts page" |
| Archives | `archive.php` | `the_archive_title()` |
| Search, 404 | `search.php`, `404.php` | fixed, translatable title |
| Shop, product categories | `woocommerce.php` → `woocommerce_content()` | WooCommerce page title |
| Product | `woocommerce.php` → `content-single-product.php` | product title |

Blocks: the root of every block template is a `<section>` that prints the
editor's "HTML anchor" as its `id`. A block's own heading is an `h2` and its
items are `h3`; `featured-products` cards turn `h3` only when the block has a
heading (without one they keep WooCommerce's `h2`), and `info-cards` has an
optional `h2` heading for when it opens a section right after the hero.

`tests/js-smoke.mjs` ("Structure invariants") enforces this on one page per
template; a new template adds its page there.

## Tests

Playwright smoke test (rendering, a11y basics, markup structure, security
hardening, zero JS errors):

```bash
cd tests
npm install   # first time only
node js-smoke.mjs
# override target: CCN_BASE_URL=http://your-site.local node js-smoke.mjs
```

The check count grows with the theme — every new interactive block adds its checks
here. Any FAIL blocks the commit.

CI (GitHub Actions) runs `php -l` on PHP 8.2/8.3 and PHPCS (security + i18n
ruleset) on every push.

## Author

**Volodymyr Prazdnikov** — [LinkedIn](https://www.linkedin.com/in/volodymyr-prazdnikov-2516451ab/)

License: GPL v3 (inherits from BlankSlate via pra-theme).
