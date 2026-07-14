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
  one "Site Settings" options page with tabs), Contact Form 7, Yoast SEO.
- Content blocks are ACF blocks registered in `blocks/acf-blocks.php` under
  custom inserter categories (COIN Banners / Lists / Products / Text); each
  block template lives in `blocks/<category>/<name>.php`, its fields in
  `acf-json/`, and per-block assets are enqueued only where the block is used.
  Legacy flexible-content sections (`sections/`) remain on the Sections
  template landings until they are migrated to blocks.
- Vanilla JS only, everything deferred; fonts self-hosted; no CSS frameworks,
  no jQuery.
- All strings wrapped in gettext with the `coin-container` text domain
  (WPML-ready); site content is German, code and docs are English.
- ACF field groups sync to `acf-json/` and are committed together with the
  templates that use them.
- Admin-editable globals live on the Site Settings page and are read through a
  single cached helper — editable content must never add render-blocking or
  external requests.

## Tests

Playwright smoke test (rendering, a11y basics, security hardening, zero JS errors):

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
