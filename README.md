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
  custom inserter categories (Coin: Banners / Lists / Products / Text); each
  block template lives in `blocks/<category>/<name>.php`, its fields in
  `acf-json/`. Blocks register as block API v3 / ACF Blocks v3 for the
  iframe editor of WP 7.1 (fields in the sidebar, previews in the canvas),
  and `theme.css` is also the editor style, so previews match the site. Every page is built from these blocks (front page, landings) or
  rendered by a plain template (legal pages, posts, shop); there is no
  flexible-content layer any more.
- Scoped assets: block CSS lives in `assets/css/theme.css` and all theme JS
  in `assets/js/main.js`, with three exceptions: the request forms' focus
  script `assets/js/forms.js` follows Contact Form 7's own assets onto the
  pages with a form, the rare price-table and related-links blocks (plus
  «Ähnliche Beiträge» under posts) share `assets/css/content-cards.css`,
  loaded only where they show (`inc/assets-cleanup.php`; the blocks list the
  handle under `'assets'` in the registry), and the attribute filters of the
  product categories bring `assets/css/catalog-filter.css` to the categories
  that print them (see "Shop"). theme.css blocks every first
  paint, so sent gzip it stays within the first TCP window (≤ 14 600 bytes,
  smoke test); a component that only some pages show gets a scoped file.
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
- All strings wrapped in gettext with the `coin-container` text domain;
  site content is German, code and docs are English. Second language:
  English through TranslatePress free (see "Languages").
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
  `inc/preise.php`), `internal-links.php` (production's link plan: the
  size-page link at the end of a product summary, «Siehe auch:» after the
  grid of categories and the shop), `related.php` (link-card excerpts and
  «Ähnliche Beiträge» under posts), `rest-auth-header-fallback.php`
  (included first: REST clients send an Application Password as
  `X-WP-Authorization` where the host drops `Authorization`, as on the KAS
  hosting of production), `rewrites.php` (the child pages of the landing at
  the product category base, e.g. `/container-kaufen/buerocontainer-kaufen/`,
  answer as pages although WooCommerce owns that base: one rewrite rule per
  child, as production's `seo-migration-kaufen-hierarchie.php`; flush the
  rules once after adding or moving such a page), `b2b.php` (the B2B mode of
  the shop: «ab» before prices, the B2B note, the required confirmation at
  the checkout; see "Shop"), `catalog-filter.php` (the attribute filters of
  the product categories as server-side links instead of production's AJAX
  filter plugin, and the category text under the product grid; see "Shop"),
  `glossary.php` (the A–Z index of the glossary hub and its DefinedTermSet /
  DefinedTerm schema, read from the glossary pages; see "Glossary").
  Redirects of old addresses
  are not theme code: the project's 301 map goes to the web server
  ([`DESIGN.md`](DESIGN.md) "URLs and redirects").
- Comments are off site-wide, as on production (`inc/disable-comments.php`):
  no comments template, no `comments_template()` call and no comment reply
  script in the theme; comment feeds redirect, the REST route is closed to
  visitors.
- Admin-editable globals live on the Site Settings page and are read through a
  single cached helper — editable content must never add render-blocking or
  external requests. The one exception is the reviews widget block (live
  Google reviews and the Trustpilot TrustBox, as on production): its widget
  HTML comes from `/wp-json/ccn/v1/reviews` and its third-party scripts start
  only when the block comes near ([`DESIGN.md`](DESIGN.md) "Trust"). The
  company data of the JSON-LD (`inc/schema.php`) come from Site Settings too,
  the coordinates included (Contacts → Latitude / Longitude; while either is
  empty or invalid, the theme's fallback).

## Languages

German is the site language: locale `de_DE_formal`, so WordPress,
WooCommerce and Contact Form 7 address the reader with «Sie», as the site
does. English lives at `/en/` through TranslatePress free (one extra
language), set up like production's K62 pilot: `<html lang="en">`, hreflang
`de` / `en` plus `x-default` = German from TranslatePress itself, British
English with German number and price formats.

- `languages/`: the `.pot` of the theme and the German `.po`/`.mo` (with a
  copy for the formal locale), see `languages/README.md`.
- `inc/trp-compat.php` (included right after the REST header fallback,
  before the rest of `inc/`): the current-language helpers, 512M of memory
  for the English render (TranslatePress parses the whole page in its output
  buffer), TranslatePress' own front-end assets dequeued, shop e-mails in
  German, customer data kept out of the dictionary, Contact Form 7 responses
  translated.
- `inc/trp-seo-en.php`: Rank Math's title, description, og/twitter texts and
  canonical of English pages from the meta `_coin_en_title` /
  `_coin_en_description` of the page, post, product or category (German
  without it), `og:locale` `en_GB`, and `/sitemap-en.xml` (listed in
  `sitemap_index.xml`).
- `inc/trp-dictionary-rest.php`: `GET /wp-json/coin/v1/trp-strings`, the
  dictionary for the translation pipeline (read only, translation editor
  capability, Application Password).
- `template-parts/language-switcher.php`: «DE | EN» in the top bar and in the
  mobile menu, without TranslatePress markup or assets
  ([`DESIGN.md`](DESIGN.md) "Languages").

Deploy: upload the `inc/trp-*.php` files before `functions.php`, which
requires them, then save the permalinks once (TranslatePress' `/en/` and the
`/sitemap-en.xml` rule).

## Shop

### B2B mode

The web shop sells to businesses, tradespeople, public bodies and legal
persons only (§ 14 BGB); private customers get an individual offer. Ported
from production (`transmax-child/inc/b2b-shop.php`) to `inc/b2b.php` (T-57a,
required only with WooCommerce) and switched in Site Settings → Shop → «B2B
mode» (true/false, on by default; until the field is saved the theme reads
it as on). Off, prices, cart and checkout are WooCommerce's own.

- **Prices:** no price suffix, whatever WooCommerce's tax settings hold (the
  option and the suffix HTML are both emptied: the net-price statement lives
  in the note, production decision 20.09.2026), and «ab» before every price
  WooCommerce prints through `get_price_html()` — cards, the product page,
  related products, the featured-products block, the admin product list.
  On sale the word stands before the current amount and WooCommerce's
  screen-reader sentence reads «Aktueller Preis: ab …». Line prices of cart
  and checkout and Rank Math's JSON-LD Offer price stay without it.
- **Note** «Verkauf ausschließlich an Unternehmer …» with the way for
  private customers: on the product page (`woocommerce_single_product_summary`
  25), the cart (`woocommerce_before_cart`, so not on an empty cart) and the
  checkout (`woocommerce_checkout_before_customer_details`). Its link is Site
  Settings `anfrage_url` while that points at `/container-angebot-anfordern/`
  (production's target), else that page's permalink. Styles inline on those
  pages only (`<style id="ccn-b2b-css">`, at most 300 bytes, tokens;
  DESIGN.md "Shop: B2B note").
- **Checkout:** the required box `coin_b2b_confirm` «Ich bestelle als
  Unternehmer …» after the order notes; without it WooCommerce refuses the
  order with production's notice. The order keeps `_coin_b2b_confirm` = `ja`
  (production's meta key and value: one key for the orders and exports of
  both sites), shown after the billing address in the order screen, also
  when the mode is off later.
- **Texts:** production's, byte for byte, as German gettext source strings
  (`de_DE.po`: msgstr = msgid); English comes from the TranslatePress
  dictionary. Copy changes go through the editorial process for both sites,
  not into this file.
- **Tests:** smoke section "B2B shop (T-57a)" and `tests/checkout-e2e.mjs`
  (see Tests).

### Catalog filters

Production filters its product archives with the BeRocket plugin «AJAX
Product Filters»: Zustand, Containertyp, Größe. `inc/catalog-filter.php`
(T-57b, required only with WooCommerce) gives every product category the
same three groups without a plugin and without JS:

- **Links, not a form:** each term links to WooCommerce's own layered-nav
  query, e.g. `?filter_zustand=neuwertig&query_type_zustand=or&filter_grosse=20-fus&query_type_grosse=or`:
  OR inside a group, AND between groups, applied by `WC_Query` on every
  product archive (the attributes stay non-public: no attribute archives).
  A link adds its term to the current choice or, once chosen
  (`aria-current`), removes it; the sort order stays, the listing goes back
  to page 1, and WooCommerce's pagination keeps the filter.
- **Groups:** attribute => name in production's order and names (filter
  `ccn_catalog_filter_groups`; the attribute «typ» is shown as
  «Containertyp», as production does). A group lists the terms that the
  published, visible products of the category and its subcategories carry,
  in the attribute's own order in WooCommerce (menu order, then the name),
  each with its count in the category without filters. Empty groups, and
  categories without such terms (Containerzubehör), print nothing.
- **Counts:** one SQL query per category (the term relationships of the
  three taxonomies, catalogue visibility respected), cached for a day in
  the transient `ccn_catalog_filter_<generation>_<category id>`. A saved
  product, a product's changed category, visibility or filter terms, an
  edited, deleted or reordered term and a product's status change raise the
  option `ccn_catalog_filter_gen`, so every category counts afresh.
- **Markup:** one `<details class="ccn-filter">` after the category strip
  (`woocommerce_before_shop_loop` 26, before the sort order), closed until a
  filter is active; a `<fieldset>` with its `<legend>` per group; the links
  `rel="nofollow"`; «Zurücksetzen» back to the category while filtered. A
  choice without products keeps the filter above WooCommerce's notice
  (`woocommerce_no_products_found` 5).
- **SEO:** a filtered listing (any `filter_*` or `query_type_*`, also
  WooCommerce's `min_price`, `max_price`, `rating_filter`) is `noindex,
  follow`, and its canonical URL is the category
  (`rank_math/frontend/robots`, `rank_math/frontend/canonical`; Rank Math
  prints no canonical tag on a noindex page by design, its og:url carries
  the category). The category itself stays indexed; no sitemap lists a
  filter URL.
- **Category text under the grid** (production's
  `transmax-child/inc/product-order.php`): on product taxonomy archives
  WooCommerce's description moves from under the h1 to
  `woocommerce_after_shop_loop` 20, after the pagination and before
  «Siehe auch:» (25), and shows on the first page only, without a filter or
  a sort order the visitor picked. A category without products keeps it
  under the h1. The shop page is untouched.
- **Styles:** `assets/css/catalog-filter.css` (at most 1 500 bytes, tokens
  only) after theme.css, only on a category that prints the filter
  (`inc/assets-cleanup.php`); DESIGN.md "Shop: filters".
- **Tests:** smoke section "Catalog filters (T-57b)".

## Glossary

The Container-Glossar is plain pages, as on production: the hub
`/glossar/` (top-level page, slug `glossar`) and one child page per term,
`/glossar/<slug>/` (23 today). No post type and no data file: production
builds its index and schema from `transmax-child/inc/glossar-terms.php`,
the rebuild reads the pages (`inc/glossary.php`, T-57c).

- **One source:** the name of a term is the title of its child page, its
  short definition the page's Rank Math meta description (production's
  one-sentence «short»; Rank Math variables resolved, the first sentence of
  the text without one), its address the permalink. A term is added by
  publishing a child page of the hub with a meta description: index and
  schema pick it up at once. Hub text, term texts and meta stay content.
- **A–Z index** (production's `the_content` filter of
  `seo-migration-glossar.php`): under the hub text, in the main query only,
  an `<h2>` per first letter (others under «#») with its `<ul>`, letters and
  names in production's natural order (`strnatcasecmp`), one «<a>Name</a> –
  definition» per list item. Markup and order are production's, without its
  wrapper and inline styles: the headings and lists are prose of
  `.entry-content` like the hub text (the 68ch measure included); no CSS and
  no gettext of its own (DESIGN.md "Glossary").
- **Schema** (production's `seo-rankmath.php` 3d, `rank_math/json_ld` 99):
  the hub carries a `DefinedTermSet` (`<hub>#definedtermset`,
  «Container-Glossar», publisher `/#organization`) with every term in page
  order (menu order, then ID), each child page a `DefinedTerm` (`<url>#definedterm`,
  name, description, url, its set) — production's keys in production's
  order. On `/en/` TranslatePress turns the addresses into `/en/…`.
- **Cost:** two SQL queries on the hub (the children, their meta in one
  query), at most one on a child page; no transient, so nothing to flush.
- «Zuletzt aktualisiert» on the child pages is `inc/freshness.php` (T-56).
- **Tests:** smoke section "Glossary (T-57c)".

## Patterns

Page layouts the team starts from (T-52), one file each in `patterns/`
(WordPress registers the theme's patterns folder itself), all in the pattern
category «Coin Container» (`inc/editor.php`):

| Pattern | Post types | Blocks |
|---|---|---|
| «Coin: Service landing page» (`landing-service.php`) | page | intro, text section (light), info cards ×3, FAQ ×3, form card, CTA banner |
| «Coin: Product landing page» (`landing-product.php`) | page | intro, featured products (light), text + image, price table, trust bar, CTA banner |
| «Coin: Contact page» (`contact.php`) | page | form card with the contacts beside it, text section |
| «Coin: Article» (`article.php`) | post, page | paragraph, heading, paragraph, image, heading, list, paragraph |

- A new page offers them at once (WordPress's starter patterns: `Block Types:
  core/post-content`), later the inserter has them under Patterns → Coin
  Container. Core's own patterns (`core-block-patterns` support) and the
  wordpress.org pattern directory (`should_load_remote_block_patterns`) are
  off, so the Patterns tab shows the theme's four only.
- Content: German placeholders in square brackets (`ccn_placeholder()`,
  «[Überschrift]», «[Text]» …), never a fact, figure, price, product name or
  phone number. Images, the form and the products are picked in the block
  sidebar; prices, the phone, the CTA button and the trust chips come from
  Site Settings. A placeholder on a published page fails the smoke test.
- No locks: neither `templateLock` nor a block `lock` — the team adds,
  removes and moves sections. One CTA banner and one form card per page is a
  rule of the project library (`block-pages-instructions.md`).
- Adding a pattern: `patterns/<slug>.php` with the header `Title` («Coin:
  …», English like every editor string), `Slug` (`coin-container/<slug>`),
  `Categories` (`coin-container`), `Block Types` (`core/post-content`),
  `Post Types`, `Viewport Width` (1200) and an English `Description`. ACF
  blocks through `ccn_pattern_block()` with the field keys of `acf-json/`
  (`ccn_block_data()`, `ccn_block_rows()` for repeaters: without the
  `_field` references the sidebar shows the fields empty); core blocks as the
  markup the editor saves (else the editor reports invalid content). Then
  `wp i18n make-pot` + `wp i18n update-po` (`languages/README.md`) and the
  file name in `T52_PATTERNS` of the smoke test.
- WordPress caches the list of pattern files (their headers) for 30 minutes
  per theme version (site transient `wp_theme_files_patterns-*`): after a
  pattern is added, renamed or its header changed, run
  `wp eval 'wp_get_theme()->delete_pattern_cache();'` — locally and on the
  deploy. The blocks of a pattern are read from its file every time.

## Editor

`inc/editor.php` keeps the block editor of pages and posts to what the theme
styles (T-52; [`DESIGN.md`](DESIGN.md) "Editor"):

- **Allowed blocks** (`ccn_allowed_block_types()` on
  `allowed_block_types_all`): every `acf/*` block of the registry (a new
  block is in at once) plus `ccn_editor_core_blocks()` — paragraph, heading,
  list and list item, image, quote, table, separator, group. Custom HTML and
  Shortcode only for users with `unfiltered_html`. A page or post also keeps
  every block its content already holds (older posts with buttons, media &
  text, social icons, spacers or Rank Math's FAQ block; the Classic block of
  classic content), so nothing in it turns uneditable; converting those is a
  card of its own. Products, the WooCommerce pages (shop, cart, checkout,
  account), other post types and editors without a post keep WordPress's set.
- **Another core block:** add it to `ccn_editor_core_blocks()` once
  `theme.css` styles it, and to DESIGN.md "Editor".
- **Block styles:** the theme registers none (`theme.css` has no
  `is-style-*` class); core's styles of image, quote, separator and table are
  removed in the editor only (`ccn_editor_block_styles()`: an inline script on
  the post editor screen after `wp-edit-post`), so the Styles panel never
  offers a look the site does not have. The same script drops the Row, Stack
  and Grid variations of the group block (T-60): the plain group stays, stored
  groups keep working. Nothing of it reaches the front end.
- **Empty blocks:** a block without its key content prints nothing on the
  front end, and its editor preview shows a hint instead — home hero without
  title and image, intro and text + image without a heading, text section
  without photo, heading and text, services and stats without heading and
  items (T-60), like info cards, FAQ and the form card before them.
- **Inserter examples** (`'example'`, `ccn_block_example()`): placeholder data
  for the ten blocks that render from their own fields or Site Settings
  (intro, text section, text + image, info cards, numbered list, FAQ, CTA
  banner, services, stats, price table). Blocks that query products or posts,
  start third-party scripts or need a chosen form or media have none
  (home hero, contact cards, featured products, news, trust bar, reviews
  widget, logos, form card, related links, gallery rail).
- Palette, font sizes and spacing in the editor come from `theme.json`
  (DESIGN.md "Editor parity").

## Markup standard

Every page renders:

- exactly one `<header>` (the site banner in `header.php`), one
  `<main id="content" tabindex="-1">` (the skip-link target) and one
  `<footer>` (`footer.php`). Templates never wrap entry titles or meta in
  `<header>`/`<footer>`: they use `<div class="entry-header">` and
  `<div class="entry-footer">`. WooCommerce's archive header
  (`loop/header.php`, a `<header>`) never renders: `woocommerce.php` prints
  the shop and category titles through `woocommerce_content()`, without it.
  There is no second header for mobile or for the fixed/compact state — it
  is the same element.
- exactly one `<h1>`, then `h2` per section and `h3` inside it, without
  skipping a level. Footer and sidebar headings are fixed `h2`.
- a name on every `<nav>`, unique on the page and without the word
  "navigation" (screen readers add the role): `Hauptmenü` (header),
  `Rechtliches` (footer), `Schnellkontakt` (bottom action bar on phones),
  `Kategorien` (catalogue filter), the landing
  sidebar via `aria-labelledby` on its visible heading, the size-page links
  of a product via `aria-labelledby` on their visible title, the
  `related-links` block via `aria-labelledby` on its h2; WordPress and
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

Checkout end to end (`node checkout-e2e.mjs`): product → cart → checkout with
cash on delivery. In B2B mode the order is refused without the confirmation
(production's notice) and goes through with it; its `_coin_b2b_confirm` meta
is read through WP-CLI (`CCN_PHP`, `CCN_PHP_INI`, `CCN_WP_CLI` for the
`wp-cli.phar`, `CCN_WP_PATH`; without them the PHP, php.ini and folder of the
Local by Flywheel site whose domain is the host of `CCN_BASE_URL`). Every run
places one real order in the site's database.

CI (GitHub Actions) runs `php -l` on PHP 8.2/8.3 and PHPCS (security + i18n
ruleset) on every push.

## Author

**Volodymyr Prazdnikov** — [LinkedIn](https://www.linkedin.com/in/volodymyr-prazdnikov-2516451ab/)

License: GPL v3 (inherits from BlankSlate via pra-theme).
