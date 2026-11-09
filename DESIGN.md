# Coin Container design system

Single source of truth for design values in this theme. Every value lives as a
custom property in `assets/css/theme.css` (`:root`, top of the file) and is
documented here. New CSS uses tokens only; a design card that adds or changes a
token updates this file in the same commit.

Sources: the donor site's Elementor kit (palette, fonts), the design review and
brief of the relaunch package (A6 §3, §6), the motion inventory (A5 §4). Brand
stays as it is: four brand colours, DM Sans + Nunito Sans 400/700, no new fonts.

## Tokens

### Colour

Contrast = WCAG 2.x, measured with `node tests/contrast.cjs --tokens` (sRGB
relative luminance, never rounded up). AA: 4.5:1 normal text, 3:1 large text
(≥ 24px, or ≥ 18.66px bold) and UI parts.

| Token | Value | Role | Contrast |
|---|---|---|---|
| `--ccn-color-primary` | `#f7c600` | brand yellow: fills, buttons, badges, accent lines, text on dark | as text on white **1.61:1 — forbidden**; `#202020` on it 10.11:1; on `#141414` 11.43:1 |
| `--ccn-color-primary-text` | `#a88400` | yellow-family **large** text only (heading accent tails) | 3.52:1 on `#fff`, 3.28:1 on `#f7f7f7` (fails 4.5) |
| `--ccn-color-primary-text-strong` | `#8a6b00` | yellow-family text at any size (eyebrows, small labels) | 5.01:1 on `#fff`, 4.68:1 on `#f7f7f7` |
| `--ccn-color-secondary` | `#605e5e` | secondary text, borders, top bar | 6.44:1 on `#fff`, 6.01:1 on `#f7f7f7`; white on it 6.44:1 |
| `--ccn-color-text` | `#202020` | body text | 16.29:1 on `#fff`, 15.20:1 on `#f7f7f7` |
| `--ccn-color-accent` | `#ff7d44` | brand orange: fills/badges only, with `#202020` text | `#202020` on it 6.41:1; as text on white **2.53:1 — forbidden** |
| `--ccn-color-accent-text` | `#b24a1c` | orange-family text on light (link hover) | 5.39:1 on `#fff`, 5.04:1 on `#f7f7f7` |
| `--ccn-color-dark` | `#141414` | dark surfaces (footer, strips) | white on it 18.42:1 |
| `--ccn-color-light` | `#f7f7f7` | light section backgrounds, hairlines | — |
| `--ccn-color-white` | `#fff` | — | — |
| `--ccn-color-link` | `= --ccn-color-text` | links in running text, always underlined | 16.29:1 |
| `--ccn-color-focus` | `= --ccn-color-text` | focus ring (styles arrive with the button/focus card) | 10.11:1 against yellow, 16.29:1 against white |
| `--ccn-color-border` | `#e5e5e5` | dividers (sidebar heading, `hr`) | decorative |
| `--ccn-color-surface` | `= --ccn-color-light` | card/section surface | — |
| `--ccn-color-text-on-dark` | `#d5d5d5` | footer text | 12.55:1 on `#141414` |
| `--ccn-color-text-on-dark-muted` | `#a5a5a5` | copyright line | 7.47:1 on `#141414` |
| `--ccn-color-error` | `#b3261e` | error accent: the bar of WooCommerce error notices (T-49); form errors, the invalid field border and the error bar of the form message (T-51) | 6.53:1 on `#fff`, 6.10:1 on `#f7f7f7`, 5.56:1 on `#fde8e8` |
| `--ccn-color-error-surface` | `#fde8e8` | WooCommerce error notice | `#202020` on it 13.88:1 |

How the text variants were chosen (T-45, step 1): candidates from the design
review were measured, then darkened in steps of 4 % HSL lightness until they
reached 4.5:1 on both `#fff` and `#f7f7f7`:

| Candidate | On `#fff` | On `#f7f7f7` | Result |
|---|---|---|---|
| `#8a6b00` | 5.01:1 | 4.68:1 | passes as is → `--ccn-color-primary-text-strong` |
| `#c4511f` | 4.62:1 | 4.31:1 | fails on `#f7f7f7`; one step darker `#b24a1c` 5.39 / 5.04 → `--ccn-color-accent-text` |
| `#a88400` | 3.52:1 | 3.28:1 | large text only → stays `--ccn-color-primary-text` |
| `#605e5e` | 6.44:1 | 6.01:1 | passes |

Reproduce: `node tests/contrast.cjs --darken '#c4511f' --on '#ffffff,#f7f7f7'`.

Raw `rgba()` is allowed only for transparency effects that are not palette
colours: photo overlays (`rgba(20,20,20,.1–.7)`: gradients of the heroes, `.65` over the photo CTA),
hairlines and text on dark strips (`rgba(255,255,255,.12/.15/.18/.85/.9)`), the
glass header (`rgba(255,255,255,.46)`) and the skip-link focus halo
(`rgba(0,0,0,.6)`). Raw hex outside `:root`: none (the smoke test enforces it).

### Type

Two families, already self-hosted (latin subset, `font-display:swap`):
`--ccn-font-heading` DM Sans 700, `--ccn-font-body` Nunito Sans 400/700.

| Token | Value | 360px | 1440px | Used by |
|---|---|---|---|---|
| `--ccn-fs-h1` | `clamp(2rem, 1.4rem + 2.6vw, 3.25rem)` | 32px | 52px (from ~1140px) | every page title: home hero, landing hero band, `page.php`, posts, archives, shop, product |
| `--ccn-fs-h2` | `clamp(1.625rem, 1.2rem + 1.6vw, 2.5rem)` | 26px | 40px (from 1300px) | section headings of all blocks, content `h2`, WooCommerce section `h2` |
| `--ccn-fs-h3` | `clamp(1.25rem, 1.1rem + .5vw, 1.5rem)` | 20px | 24px (from 1280px) | `h3`; component titles whatever their tag (sidebar heading, form card) |
| `--ccn-fs-lead` | `clamp(1.125rem, 1.05rem + .3vw, 1.25rem)` | 18px | 20px | hero subtitle |
| `--ccn-fs-body` | `1rem`, `1.125rem` from 64rem | 16px | 18px | body text |
| `--ccn-fs-small` | `.875rem` | 14px | 14px | uppercase buttons, copyright, hero trust row |
| `--ccn-lh-tight` | `1.15` | | | `h1` |
| `--ccn-lh-heading` | `1.2` | | | `h2`–`h6` |
| `--ccn-lh-body` | `1.6` | | | body |

Rules:

- The size follows the role, not the tag: a page title is always `--ccn-fs-h1`
  (the home hero prints `h2` in the editor and is still sized as a title), a
  section heading `--ccn-fs-h2`, a component title (sidebar widget, form card)
  `--ccn-fs-h3`. Dense card titles (product loop, news cards) keep their own
  small size until the card pass.
- Running text is capped at `68ch` (`.rich-text`, and the paragraphs, lists,
  quotes and headings directly inside `.entry-content`); grids, tables, forms
  and WooCommerce markup are never capped.
- The header and the product grids keep 16px metrics when body text grows to
  18px (`.site-header`, `ul.products`): the header stays at 16px by design
  (T-47, see Header); the grids are decided by the card/catalogue cards
  (T-48, T-49).
- No text below 14px except badges, eyebrow labels and the top bar (the
  13.6px news date, numbered-list text and catalogue sub-filter are
  `--ccn-fs-small` since T-48).

### Spacing, containers, shape

| Token | Value |
|---|---|
| `--ccn-space-1` … `--ccn-space-9` | 4, 8, 12, 16, 24, 32, 48, 64, 96 px (in rem) |
| `--ccn-container` | 1200px — content |
| `--ccn-container-wide` | 1400px — services strip |
| `--ccn-container-prose` | 720px — prose/forms |
| `--ccn-radius-sm` / `-md` / `-lg` | 4 / 8 / 12 px |
| `--ccn-shadow-1` | `0 2px 8px rgba(0,0,0,.06)` — sticky header |
| `--ccn-shadow-2` | `0 6px 24px rgba(0,0,0,.08)` — cards, contact cards, sidebar and form cards, dropdowns |
| `--ccn-shadow-3` | `0 8px 24px rgba(0,0,0,.12)` — photo collage, hover lift |
| `--ccn-topbar-h` | 2.5rem — desktop top bar |
| `--ccn-header-h` / `--ccn-header-h-compact` | header row: 4rem below 64rem, 5rem from 64rem / 4rem once scrolled |
| `--ccn-header-total` | space the fixed header takes at the top of the page: `= --ccn-header-h` below 64rem (64px), top bar + row from 64rem (120px) |
| `--ccn-tap` | 2.75rem — 44px tap target (header icons, hero phone line, trust links) |

Container utility (`theme.css`, "Layout primitives"):

```css
.ccn-container{max-width:var(--ccn-container);margin-inline:auto;padding-inline:var(--ccn-space-4)}
.ccn-container--wide{max-width:var(--ccn-container-wide)}
.ccn-container--prose{max-width:var(--ccn-container-prose)}
```

Every block's inner wrapper and the header, footer, landing and WooCommerce
wrappers carry `ccn-container` next to their own class (the own class keeps
layout rules such as grids and vertical padding). Gutter today: 16px on every
width; the brief's target 16 / 24 / 32px (<768 / 768–1279 / ≥1280) arrives
with the layout cards.

Breakpoints stay literal in `@media` (custom properties do not work there):
`36rem` (576px), `48rem` (768px), `64rem` (1024px), `80rem` (1280px, product
grid only).

### Layout

No page scrolls sideways at 360, 768, 1280 or 1440px (smoke "Components (a)":
the six key pages, the blog index, the search results and Containerzubehör).

- `img, svg, video, iframe` never exceed their box (`max-width: 100%`,
  `height: auto` for images and video); `body` has `overflow-wrap:
  break-word` for long unbreakable lines; cards break anywhere.
- Grid tracks that hold content are `minmax(0, 1fr)`, never a bare `1fr`
  (a `1fr` track grows to its widest child: the landing column was 378px
  wide at 360).
- Product grid (`ul.products`: shop, categories, product search, the
  featured-products block): the theme's grid, not WooCommerce's float widths
  (22 % / 48 % of a grid cell made 38–65px cards). At most 1 / 2 / 3 / 4
  columns from 0 / 36 / 64 / 80rem (`--ccn-cols`), never a card under 16rem,
  so the narrower landing column holds 2 columns at 1280–1440:
  `repeat(auto-fill, minmax(min(100%, max(16rem, (100% - (cols - 1) × gap) / cols)), 1fr))`,
  gap `--ccn-space-5`. WooCommerce's clearfix pseudo-elements are off (they
  took grid cells); the grid clears the floated result count and ordering.
- Catalogue order (shop and product categories, as on production):
  discounted products first, then menu order and title; a sort order the
  visitor picks (`?orderby=`) is left alone (`inc/woocommerce.php`, T-49).
- Posts, blog index and archives keep the 820px reading column; shop,
  categories and product search use the full container.
- One gutter: the landing column (`.ccn-landing.ccn-container`) and the text
  + image block of the full-width landing carry the 16px gutter, so a block's
  own `.ccn-container` inside adds none (T-49: the product card on Container
  kaufen is 328px at 360, as on the front page, was 296px).

## Editor parity

The block editor shows the same colours and sizes as the site.

- `theme.json` (version 3) hands the tokens to Gutenberg: a palette of 8
  brand colours (`ccn-*` slugs; the editor gets the any-size yellow text
  `#8a6b00` instead of the large-text-only `#a88400`, so a colour picked for
  small text still passes AA), no custom colours, gradients or duotone; font
  sizes small/body/lead/h3/h2/h1, the two font families and spacing sizes
  1–9 as references to the `--ccn-*` tokens (no custom values; the clamps
  live in `theme.css`, so `fluid` is off); content width 720px, wide 1200px;
  `appearanceTools` off.
- Front end: WordPress prints no `global-styles` (`inc/assets-cleanup.php`;
  with `theme.json` it would be ~14 KB inline on every page, because core
  keeps its default presets for old content). `theme.css` carries what the
  editor can add instead: the `.has-ccn-*-color` / `-background-color`,
  `.has-*-font-size` and `.has-ccn-*-font-family` classes, the spacing
  preset variables, the base flex/grid layout rules and the element-button
  reset core used to print.
- The smoke test keeps both files in sync: palette hex = colour tokens,
  every size/family/spacing preset references an existing token, layout
  widths = container tokens, every preset class exists in `theme.css`.
- Editor canvas (always an iframe on WP 7.1): `theme.css` is the editor style
  (`add_editor_style`), so ACF block previews use the front-end CSS; inside
  the iframe the editor style is not prefixed (only its `url()`s are
  rebased), so the element reset never beats the editor's own class rules.
  `assets/css/editor.css` (editor only) lets ACF sections span the canvas,
  which theme.json's `contentSize` would otherwise cap at 720px; constrained
  groups get the same 720px on the front end from `theme.css`.
- ACF blocks register with `api_version` 3 and `acf_block_version` 3 and
  without the edit/preview toggle (`supports.mode` false): fields live in
  the sidebar, the canvas always shows the rendered preview.

## Colour rules

1. Yellow and orange are never text on a light background. Yellow is a fill
   or an accent line; text on it is `#202020`; white on yellow is forbidden.
2. Yellow-family text: `--ccn-color-primary-text` for large text only,
   `--ccn-color-primary-text-strong` for anything smaller. Orange-family text:
   `--ccn-color-accent-text`.
3. Links in running text are `--ccn-color-link` and underlined; hover turns
   them `--ccn-color-accent-text`. The current/hovered main menu item is dark
   text with a 3px yellow bar underneath, not yellow text.
4. Text ≥ 4.5:1, large text ≥ 3:1, focus ring and UI parts ≥ 3:1 — measured,
   not estimated.
5. Text over photos is checked separately (the colour-only probe cannot see the
   photo): overlay under the text, sample points under the heading.
6. Hover on dark or grey surfaces (footer, top bar, dark contact card, dark
   sections): white or `--ccn-color-light` plus an underline, never yellow
   text (yellow on `#605e5e` is 3.99:1). Yellow on dark stays for large text,
   numbers, icons and fills.

## Components

Specs come from the design brief (A6 §6.4); each card that builds a component
replaces its "planned" line with the implemented spec.

| # | Component | Acceptance criteria (short) | Card | Status |
|---|---|---|---|---|
| C1 | Hero (home) | h1 with the keyword (text as on production), 1 primary + 1 secondary CTA, phone link, rating line; on 360×800 h1 ≤ 4 lines and CTA, phone, rating inside 800px | T-47 | built — see Hero |
| C2 | Mobile action bar | bottom bar 56px below 768px: Anrufen (`tel:`) + Anfrage, safe-area inset, targets ≥ 44px | T-47 | built — see Action bar |
| C3 | Sticky header | ≤ 64px on 360; 80px → 64px after scroll with `--ccn-shadow-1`; phone icon 44×44 below 1024px; CLS 0 | T-47 | built — see Header |
| C4 | Product/service cards | radius 8–12px, rest `--ccn-shadow-1` + 1px border, hover/focus lift 2px + `--ccn-shadow-3`, image 4:3, title ≤ 3 lines, button ≥ 44px and on one line at 360 | T-48 | built — see Cards |
| C5 | Buttons | rest/hover/focus-visible (+ active/disabled), height ≥ 44px, verb labels, one primary per screen | T-48 | built — see Buttons |
| C6 | Section heading + eyebrow | eyebrow only where it carries information (category), 13px uppercase, `--ccn-color-primary-text-strong`; otherwise the accent tail of the heading | T-48 | rule in force: no section carries a category label today, so headings keep their accent tails and no eyebrow is printed |
| C7 | Stats | real figures only, dark surface with yellow numbers; `tabular-nums`, count once and final values with reduced motion are in place (T-46, see Motion) | T-48 | built: `--ccn-color-dark` band, numbers `--ccn-color-primary` (11.43:1), labels `--ccn-color-light`, final value in the HTML; 2 columns at 360 (an odd last item spans both), 3 from 48rem, one row from 64rem; front page = the five production counters |
| C8 | Trust block | rating with count (live widgets as on production), quotes, partner logos, years/volume line; before the final CTA | T-50 | built — see Trust, FAQ, Logos: static chips (one renderer) in the hero, trust bar, product page and footer; live Google reviews + TrustBox behind a 1200px facade before the CTA banner; logos block; quotes only through the live widgets (no static reviews) |
| C9 | CTA banner | one per page, yellow band with `#202020` text, h2 + Anfrage + phone | T-48 | built: without a photo the yellow band, h2, the block's button (`.btn-dark`; empty → Site Settings `hero_cta_text` / `anfrage_url`) and the phone (`.btn-secondary`); with a photo the photo under `rgba(20,20,20,.65)` (white text ≥ 4.5:1 on any photo), optional logo, `.btn-primary` and `.btn-outline-light` |
| C10 | Request form | ≤ 4 required fields, visible labels, errors under the field with `aria-describedby`, consent after the fields, submit ≥ 48px | T-51 | built: block `acf/form-card` + CF7 340/341, see Forms |
| C11 | Footer | dark, location/container-type columns, one icon set, targets ≥ 44px, text ≥ 4.5:1 | T-48 | built (targets, icons, badge slot) — see Footer; the location/container-type columns come with the menu migration (T-53c) |
| C12 | Single product (360) | gallery visible at once, h1/price/CTA in the first 760px, badge/price/button on tokens | T-49 | built — see Product page |

## Header

`header.php`: one fixed `<header id="header">` on every page (T-47, A6 C3).

| State | Below 64rem | From 64rem |
|---|---|---|
| Top of the page | 64px row: logo 40px high, phone, cart, search, burger | grey top bar 40px (phone, e-mail, social) over an 80px row: logo 56px, menu, cart, search |
| `.is-stuck` (scrolled more than 8px) | the same 64px row, white, `--ccn-shadow-1` | one 64px row: top bar folded (`max-height` 0, `opacity` 0, then `visibility: hidden`), row padding 8px → 0, logo `scale(.8)`; white, `--ccn-shadow-1` |

- `position: fixed` plus `body { padding-top: var(--ccn-header-total) }`
  (64px below 64rem, 120px from 64rem): the header changes height without
  moving the page, so the compact state shifts no layout (Lighthouse CLS 0).
  The hairline under the white header is a 1px shadow, so the row is exactly
  64px.
- **Exception to the motion rule** (only `opacity`/`transform` move): the
  top bar's `max-height` and the row's `padding` transition in
  `--ccn-dur-base` / `--ccn-ease-out`. Allowed only here, because the header
  is fixed and nothing else reflows; the logo shrinks with `transform`.
- State comes from the sentinel observer of `main.js` (see Motion, Runtime 5);
  no scroll listener.
- Over a hero (`body.ccn-transparent-header`: front page and both landing
  templates) the header starts as glass — `rgba(255,255,255,.46)` +
  `blur(8px)` — and turns white with `.is-stuck`. Hero sections slide under
  the row (`margin-top: calc(-1 * var(--ccn-header-h))`); from 64rem the solid
  top bar stays above the photo.
- Tap targets: phone, cart, search and burger are 44×44px (`--ccn-tap`).
- Top bar links: white on `--ccn-color-secondary` (6.44:1); hover underlines
  instead of turning yellow (yellow on that grey is 3.99:1, below 4.5:1 for
  13px text). The social icons stay yellow (UI graphics, ≥ 3:1) and turn
  white on hover.
- DOM order = visual order: logo, menu, phone, cart, search, burger. The
  burger sits after the menu, so opening it moves focus to the first menu
  link; Escape closes the menu and returns focus to the burger.
- Phone link `a.site-phone` (below 64rem; from 64rem the number is in the top
  bar): icon only, named by screen-reader text «Anrufen: <number>»; `tel:`
  keeps the digits and `+` of the Site Settings phone (`ccn_phone_href()`).
- Mobile menu: drops below the row and scrolls inside itself
  (`max-height: 100dvh − row`, `overscroll-behavior: contain`), so every item
  is reachable under a fixed header.
- Anchors: `scroll-padding-top: calc(var(--ccn-header-total) + 1rem)`.
  Logged in: `top: var(--wp-admin--admin-bar--height)` keeps the header below
  the admin bar.

## Hero

Home hero block (`blocks/banners/home-hero.php`, T-47, A6 C1 and §6.7). Copy
as on production (h1, button labels, trust row: `transmax-child/inc/hero-trust.php`).

- Order: h1 (`--ccn-fs-h1`), optional subtitle, actions
  (`template-parts/hero-cta.php`: primary `.btn-primary` with a decorative
  «+», optional secondary `.btn-outline-light`, phone line), trust row
  (`template-parts/trust-row.php`). The landing hero band
  (`template-parts/page-hero.php`, every landing template) prints the same
  actions under its h1: the global button from Site Settings → Calls to
  action (`hero_cta_text`, `hero_cta_url`, empty URL = `anfrage_url`) and
  the phone line; on 360×800 kaufen and mieten show header, h1, CTA and
  phone in the first screen (4 of 4). A page whose first block is the form
  card (`ccn_page_leads_with_form()`: decided by the content, not by a slug;
  the contact pages) prints no button there, only the phone line: the form
  right under the band is its call to action (T-51, see Forms).
- Below 48rem (the 360×800 first screen): the photo box is `aspect-ratio: 4/5`
  and grows with its content; text starts 24px under the header row;
  buttons full width (primary 48px, secondary 44px); phone line and trust
  links 44px high (`--ccn-tap`); the bottom padding clears the contact cards
  that overlap the hero by 3rem. Measured: header 64px, h1 4 lines, CTA,
  phone and trust row above the action bar — 5 of 5 conditions of A6 §6.7.
- From 48rem: text left over the port photo, buttons in a row (both 48px),
  trust row on one line.
- Overlay: from 48rem the horizontal gradient (`.6 → .15`); below 48rem a
  vertical one — `.1` at the very top (the glass header carries a dark logo
  and dark icons, so the photo under it stays light), `.6` at the bottom of
  the header row, `.7` at the bottom (white text); the landing hero band uses
  the same overlay below 48rem (its h1 sits higher once the band carries the
  button and the phone line). Sampled with the texts hidden (20 points each),
  white text at the worst point: home ≥ 11:1 on 360 and ≥ 5:1 on 1440,
  landing band ≥ 5.1:1 on 360 and ≥ 4.3:1 on 1440 (h1, large text); logo
  grey `#605e5e` against the glass ≥ 3.6:1 on average on the three glass
  pages. A dark top gradient (`.45 → 0` over the top
  quarter) was measured and dropped: it lowers the logo contrast (360:
  4.52 → 4.43, 1440: 3.92 → 3.65), the logo being dark on light glass.
- Trust row (Site Settings → Vertrauen, each item only from filled values):
  Trustpilot band label («Hervorragend» from 4.5, «Sehr gut» from 4.0, as on
  production), five 16px boxes with the last one filled in proportion, the
  count and the Trustpilot mark; Google: the count, the rating only when
  filled in; badge: its text with an inline shield (`currentColor`, yellow
  check), the badge image's alt as screen-reader text. Names come from
  visible plus screen-reader text, never `aria-label`: «Hervorragend 13
  Bewertungen auf Trustpilot, 4,5 von 5 Sternen (öffnet in neuem Tab)».
- Nothing in the hero loads a file besides its image: icons, stars and marks
  are inline SVG. Third-party marks (Trustpilot boxes and star, the Google
  G) are artwork and keep their brand colours inside the SVG (`#00b67a`,
  `#dcdce6`, the four Google colours) — not tokens, never used elsewhere.
- Links over the photo are white with a `--ccn-color-primary` hover and no
  underline; buttons keep the `.btn` states (the button system is T-48).
- LCP: the image (eager, `fetchpriority=high`, preloaded) as before; nothing
  in the hero animates.

## Action bar

`footer.php`, `ccn_action_bar()` in `functions.php` (T-47, A6 C2): one
`<nav class="ccn-action-bar" aria-label="Schnellkontakt">` with two links
and no JS.

- Below 48rem only: `position: fixed` at the bottom, 56px (4px + 48px
  buttons + 4px) plus `env(safe-area-inset-bottom)`; two equal columns —
  «Anrufen» (`.btn-dark`, `tel:` from the Site Settings phone) and «Anfrage»
  (`.btn-primary`, Site Settings `anfrage_url`, the request page). White
  surface with a 1px `--ccn-color-border` line on top (a shadow, so the
  height stays 56px).
- `body.ccn-has-action-bar` reserves the same height at the bottom of the
  page below 48rem, so the footer never ends under the bar. From 48rem the
  bar is `display: none` and nothing is reserved.
- Not rendered at all on cart, checkout and account pages, nor on the page
  that `anfrage_url` points to.
- Stacking: `z-index` 900 — under the header (1000) and its mobile menu, so
  an open menu always covers the bar, never the other way round; under the
  cookie banner of the deploy (CookieHub sits far above).
- One floating element only: no side tabs, chat bubbles or Quick Contact on
  phones next to it (Quick Contact is T-58 and must take this bar into
  account).

## Buttons

`theme.css` "Buttons" (T-48, A6 C5 and §6.1-4): `.btn` plus one variant.
WooCommerce (`.button`, `.single_add_to_cart_button`, `.checkout-button`,
`.wc-block-components-button`) and CF7 (`.wpcf7-submit`) buttons take the same
rules through extra selectors; on WooCommerce pages a
`.woocommerce :is(a,button,input).button.button` rule beats WooCommerce's own
`.woocommerce a.button` and the purple `.button.alt`.

| Variant | Rest | Hover | Used for |
|---|---|---|---|
| `.btn-primary`, WooCommerce and CF7 buttons | `--ccn-color-primary` / `#202020` (10.11:1) | `#202020` / white (16.29:1) | the main action of a screen |
| `.btn-secondary` | transparent, 2px `#202020` border, `#202020` text | `#202020` / white | second action (phone in the CTA band) |
| `.btn-dark` | `--ccn-color-secondary` / white (6.44:1), uppercase 14px | yellow / `#202020` | intro, landing request card, "Anrufen", CTA band |
| `.btn-light` | `--ccn-color-light` / `#202020`, uppercase 14px | yellow / `#202020` | text + image block |
| `.btn-outline-light` | 2px white border, white text | white / `#202020` | over photos (hero, T-47) |

States, every variant:

- Size: `min-height: var(--ccn-tap)` (44px), padding `--ccn-space-3`
  `--ccn-space-6`, 2px border, `--ccn-radius-sm`; `.btn-lg` 48px (hero and
  action bar buttons are 48px, T-47). Product-card buttons fill the card
  width on one line.
- Hover and focus-visible: the colours above plus the lift (`translateY(-2px)`,
  `--ccn-shadow-3`, `--ccn-dur-fast`, see Motion).
- Focus-visible: `outline: 3px solid var(--ccn-color-focus)` with
  `outline-offset: 2px` on every focusable element, not only buttons; white on
  dark surfaces (footer, top bar, hero, landing hero band, dark contact card,
  dark sections, stats, photo CTA). `main:focus` (skip-link target) has none.
- Active: `filter: brightness(.92)` (8 % darker), no lift.
- Disabled (`:disabled`, `.disabled`, `[aria-disabled="true"]`):
  `--ccn-color-border` fill, `--ccn-color-secondary` text (5.11:1),
  `cursor: not-allowed`, no lift.
- `tel:` links: the reset is `a:where([href^="tel"]) { color: inherit }`
  (specificity 0,0,1), so every button or class colour wins over it.
- Labels are verbs and come from the content (texts as on production).

## Cards

`.ccn-card` (C4): white surface, `#202020` text, 1px `--ccn-color-border`,
`--ccn-radius-md`, `--ccn-shadow-1`; on hover or focus-within it lifts 2px
with `--ccn-shadow-3` (Motion). Used by news cards, info cards, service cards,
the landing request card ("Jetzt anfragen") and product cards
(`ul.products > li.product` shares the rule, no WooCommerce template override).

- Product card: padding `--ccn-space-3`; image box 4:3, `object-fit: contain`
  on `--ccn-color-surface` (renders now; real photos arrive with the
  migration, OPEN #72); title at most 3 lines (`line-clamp`); price on one
  line with `tabular-nums`; the button fills the width, stays on one line and
  sits at the bottom; sale badge top left inside the image. The square image
  is drawn at 3/4 of its box, so the thumbnail's `sizes` is
  `(max-width: 575px) calc(75vw - 44px), (max-width: 1023px) calc(38vw - 40px), 270px`
  without WordPress's `auto` (`inc/woocommerce.php`): phones load the 500px file.
- Service card: 48px yellow circle with an outline icon, `h3`, text always
  visible (no numbers: the services carry no sequence).
- Featured products at 360: one column, no rail (T-48 decision, measured on
  the front page: stacked, the four offers take 1,732px and the page is
  8,773px; a rail would save 1,267px (page 7,506px) but show one offer of
  four at a time). The rail stays for the news cards.

## Sections

Every content block's root `<section>` carries `ccn-section`
(`ccn_section_classes()`, `blocks/acf-blocks.php`) and, for the seven blocks
with a `background` field (intro, text section, text + image, info cards,
numbered list, news, featured products), `ccn-section--{default|light|dark|yellow}`
(select field, default `default`; old content without the field renders as
`default`). Services (`--ccn-color-light`), stats (`--ccn-color-dark`) and the
CTA banner (yellow band or photo) have a fixed surface.

| Background | Surface | Text | Use |
|---|---|---|---|
| `default` | page white | `#202020` | text sections |
| `light` | `--ccn-color-light` | `#202020`; `.btn-light` turns white | product grids, services, breaks between white sections |
| `dark` | `--ccn-color-dark` | white; muted text `--ccn-color-text-on-dark`, accent tails yellow, links white + underline on hover, white focus ring; cards inside stay white | stats, short emphasis |
| `yellow` | `--ccn-color-primary` | `#202020` (muted text and accent tails too), primary button turns `#202020` | short sections only, at most one yellow fill per screen |

- Rhythm: `padding-block: var(--ccn-space-7)` (48px), from 64rem
  `var(--ccn-space-9)` (96px). Two neighbouring default sections share one gap
  (`padding-top: 0` on the second). Inside the landing templates default
  sections take no padding of their own (the column spacing applies: 32px
  in the sidebar layout, 48px in the full-width one); a section with a
  background keeps its padding and gets 24px inline padding in the sidebar
  column.
- Inside a section: heading → text 12px (`--ccn-space-3`); a section heading
  over a grid 32px (`--ccn-space-6`); between groups 48px (`--ccn-space-7`).
- Dark and yellow switch colours through two custom properties
  (`--ccn-muted`, `--ccn-accent-c`) that the muted texts and accent tails
  read with their light-surface colour as fallback.
- Front page (content, T-48): hero, contact cards, intro (default), featured
  products (light), text + image (default), services (light), stats (dark),
  CTA banner (yellow band), news (default) — four surfaces, no two
  neighbours alike.

## Icons

One outline set, `ccn_icon( $name, $size )` in `functions.php`: 24px grid,
stroke 1.8, round caps and joins, `currentColor`, `aria-hidden`; the link or
text next to it carries the name. Paths from Tabler Icons (MIT) plus two drawn
monograms (eBay, Kleinanzeigen). Keys: `container`, `buy`, `rent`,
`transport`, `modify` (select field `icon` of each service), `facebook`,
`instagram`, `linkedin`, `ebay`, `pinterest`, `xing`, `kleinanzeigen` (footer).
The header icons (phone, cart, search) share the style; the filled brand
glyphs of the top bar (T-47) stay.

## Footer

C11: dark surface, `--ccn-color-text-on-dark` text, every link a 44px target
(`inline-flex`, `min-height: var(--ccn-tap)`), hover white with an underline.
Social links: 44×44 circles (1px `rgba(255,255,255,.18)`) with the icon, named
by screen-reader text «Facebook (öffnet in neuem Tab)»; hover fills the circle
yellow with a `#202020` icon. `div.footer-badges` under the social icons holds
the Trustpilot and Google badges of the production footer (T-50: the compact
trust row, see Trust; white, hover white + underline).

## Product page

C12, T-49. `woocommerce.php` renders WooCommerce's own `content-single-product.php`
(no template overrides); hooks in `inc/woocommerce.php` and `theme.css`
"Single product" shape it. WooCommerce's three stylesheets are off on product
pages (`inc/assets-cleanup.php`), so every rule is the theme's.

| Below 48rem: one column | From 48rem |
|---|---|
| h1, price with the sale badge, gallery (16:10), add to cart, «Jetzt anfragen» + trust row, short description, categories, description tab, related products | gallery (4:3) left, summary right in WooCommerce's order (h1, price + badge, short description, add to cart, request + trust, categories); description and related products across both columns |

- Order below 48rem: `div.product` is a flex column and `.summary` is
  `display: contents`, so its children take `order` values next to the gallery
  (h1 1, price 2, gallery 3, add to cart 4, request 5, the rest 6, tabs 8,
  related 9). At 360×800: h1 top ≤ 560, price ≤ 640, add to cart ≤ 760 and
  above the action bar (smoke "Product & catalog").
- Gallery: WooCommerce's stock gallery (decision 08.11.2026), FlexSlider plus
  the PhotoSwipe lightbox, no hover zoom; jQuery and WooCommerce's scripts
  defer. WooCommerce prints `opacity: 0` inline until its script ran; theme.css
  shows the gallery at once (also without JS) and lays out one photo before
  FlexSlider starts. One box for every photo: 16:10 below 48rem, 4:3 from
  48rem, `object-fit: contain` on `--ccn-color-surface`, `--ccn-radius-md`.
- Controls: previous/next arrows on every width (44px white circles,
  `--ccn-shadow-2`, named «Vorheriges Bild» / «Nächstes Bild», hidden at the
  ends); the thumbnail strip (4 columns, the active photo with a yellow
  border) from 48rem only: on phones each thumbnail is one more request
  (production shows dots there).
- Photos: the first is the LCP image (eager, `fetchpriority=high`); photos
  2..N are lazy with `fetchpriority=low` and keep their `src`. Slides not
  shown yet skip rendering (`content-visibility: hidden`) and get
  `.ccn-shown` just before the slider moves to them (inline script before
  WooCommerce's single-product script), so a phone loads one photo, not five.
- Lightbox: click or Enter on the photo opens it with focus inside; Escape
  closes it and focus returns to the photo.
- Price row: current price 24px bold `#202020`, `tabular-nums`, not
  underlined; old price 18px `--ccn-color-secondary`, struck through; the
  sale badge next to it.
- Sale badge «Angebot!», the same in the list and here: `--ccn-color-primary`
  fill, `#202020`, 14px bold uppercase, `--ccn-radius-sm`.
- Add to cart: quantity 4.5rem × 44px with a `--ccn-color-secondary` border;
  the button is the primary button at 48px, across the row on phones.
- Request: «Jetzt anfragen» (`.btn-secondary.btn-lg`, label as on
  production) to Site Settings `anfrage_url` with `?produkt=<slug>`, then the
  trust row of Site Settings → Vertrauen in `#202020` on white.
- Notices (added to cart, errors): `--ccn-color-light` with a 4px bar on the
  left, yellow for messages, `--ccn-color-secondary` for info,
  `--ccn-color-error` on `--ccn-color-error-surface` for errors; the button
  follows the text.
- Related products: product cards (see Cards), always the same four (menu
  order, then title).

## Breadcrumbs

`ccn_breadcrumbs()` in `inc/seo.php` (T-49; Rank Math since T-54). The trail
and its BreadcrumbList schema come from the same Rank Math crumbs
(`rank_math_the_breadcrumbs()`); the theme prints them as a list and adds no
schema of its own. Without Rank Math nothing is printed.

- Markup: `<nav class="ccn-breadcrumbs" aria-label="Brotkrumen">` with an
  `<ol>`, one `<li>` per crumb (Rank Math's `<p>` with separator spans is
  replaced through `rank_math/frontend/breadcrumb/html` for that call); the
  current page last, not linked, `aria-current="page"`.
- Trail as on production (`transmax-child/inc/breadcrumbs.php`): «Startseite»
  (`rank_math/frontend/breadcrumb/strings`), the shop page after it on
  products and product categories (`…/is_using_shop_base`), parent
  categories (`…/settings`, `show_ancestors`), a product's primary category
  with its parents (Rank Math's primary-term meta, else the deepest
  category) and decoded HTML entities (`…/items`); the schema gets the same
  crumbs. Names come from the shop page and the categories of the site
  (since T-53a the production categories, top level, without a parent
  category of their own).
- Where: products, the shop and product categories (above the h1,
  `woocommerce.php`), landings and contact pages (under the hero band, on
  white, in the 1200px container like the hero text,
  `template-parts/page-hero.php`), posts (`single.php`) and pages
  (`page.php`), both in the 820px text column; never on the front page.
- Look: 14px `--ccn-color-secondary` (6.44:1), links underlined with the
  accent-text hover, 44px tall targets, separator `›` as `::before` (not
  read out: `content: "›" / ""`). A trail that does not fit its line wraps;
  the current page keeps at least 6em and is cut off with an ellipsis.

## Trust

C8, T-50. Three layers, as on production: static chips above the fold, live
reviews at the bottom, no review schema.

- **One renderer for the chips:** `template-parts/trust-row.php` (Site
  Settings → Vertrauen: Trustpilot rating/count/URL, Google count (+ rating
  only when filled in)/URL, badge text/URL/image alt). The home hero, the
  product page (under «Jetzt anfragen»), the trust bar block and the footer
  all print it; `get_template_part( 'template-parts/trust-row', null,
  array( 'compact' => true ) )` gives the two links of the production footer
  («★ Trustpilot 4,5», «G Google-Bewertungen»). Inline SVG only, no request.
- **Trust bar block** (`acf/trust-bar`, `blocks/banners/trust-bar.php`): a
  section around the chips plus up to three key facts (Site Settings →
  Vertrauen → `key_facts`: number, suffix, label and a required source that
  is never printed — no figure without a source). No fields of its own.
  On light surfaces the chips are 44px boxes (1px `--ccn-color-border`,
  `--ccn-radius-md`, white, `#202020` text, accent-text hover); the badge
  keeps its shield next to the text. Place: under the landing hero
  (`/container-kaufen/`: inside the first screen at 360). Not on the front
  page: the hero already shows the same three items in the first screen.
- **Reviews widget block** (`acf/reviews-widget`,
  `blocks/lists/reviews-widget.php`, optional heading/intro): Google reviews
  through the Trustindex free widget (plugin `wp-reviews-plugin-for-google`,
  layout 13, set drop-shadow, no widget ID — as on production) and the
  Trustpilot TrustBox «Review Collector» (`56278e9abfbbba0bdcd568bc`, 52px:
  the only TrustBox the profile's plan allows; public IDs only, business unit
  in Site Settings). Production place: front page between stats and the CTA
  banner, `/ueber-uns/bewertungen/`.
- **Facade, not the widget, in the page:** the document carries an empty
  box, the TrustBox snippet in an inert `<template>` and the REST URL; the
  widget HTML (~26 KB, ~4 KB gzip, it would push the front page document past
  the first 14.6 KB TCP window) comes from `GET /wp-json/ccn/v1/reviews`
  (`inc/trust.php`). `main.js` starts both widgets when the facade comes
  within 1200px (IntersectionObserver): fetch, re-created scripts (the
  plugin's loader fallback), the TrustBox bootstrap. Before that: 0 requests
  to Trustindex, Trustpilot or Google photos. Never put `[trustindex]` into
  content directly — the plugin then queues its loader and stylesheet for
  the first paint.
- **No layout shift:** `main.js` marks the facade `is-reserved`; the Google
  box then keeps `min-height` 34.25rem (548px) below 36rem and 19.75rem
  (316px) from 36rem = the widget (527px at 320–360, 296px from ~560px,
  measured) plus its own 5px/15px margins, which `display: flow-root`
  keeps inside the box; the TrustBox box 3.25rem (52px). The loader's own
  lazy mode is off (`data-lazy-load-disabled`, set in `inc/trust.php`): it
  would format the widget only once in view and move its slider on screen
  (layout shift 0.45 at 360). The Google box stays `visibility: hidden`
  until the loader has formatted the widget plus 600ms. Without JS the
  facade shows the compact chips (profile links) only.
- **Blocked hosts** (ad blocker, firewall): 8s after the start a Google
  widget the loader has not formatted drops the facade's reserve (the box
  collapses to 0) and a TrustBox without its iframe is hidden; the compact
  chips stay — no permanent hole (blocked probe: section 192px at 360).
- **Cache:** the widget HTML is a transient for an hour
  (`ccn_google_reviews_html`, anonymous requests only): it saves the
  shortcode render (~50ms), not the WordPress boot of the REST request.
- **Privacy:** neither widget sets cookies or web storage (Playwright probe,
  08.11.2026); third-party hosts once started: `cdn.trustindex.io`,
  `lh3.googleusercontent.com`, `widget.trustpilot.com` (incl. impression
  pings with the page URL) — for the consent setup (T-61).
- **Schema:** never `aggregateRating` or `Review` for the own business
  (self-serving, team decision 22.09.2026); the plugin's own schema stays
  off (the free widget prints none).

## FAQ

`acf/faq` (`blocks/text/faq.php`): heading (required h2, as on production,
e.g. «Häufige Fragen zum Containerkauf»), optional intro, question/answer
pairs (answers keep `p`, `a`, `ul`/`ol`, `strong`, `br` only).

- Markup: `<details class="ccn-faq-item"><summary><h3>…</h3><svg
  class="ccn-faq-icon"></summary><div class="ccn-faq-answer">…</div></details>`
  — native keyboard (Enter/Space) and screen reader behaviour, no JS; the
  question stays an h3 under the section h2.
- Look: hairlines `--ccn-color-border` between items, summary ≥ 44px with
  the question at `--ccn-fs-lead`, the plus turns into a cross
  (`transform: rotate(45deg)`, `--ccn-dur-fast`); the answer at 68ch,
  links underlined; the global focus ring on the summary.
- Schema (`inc/schema.php`): the pairs of every `acf/faq` block of a page
  (nested blocks too), Site Settings → Schema → `faq_schema_mode`:
  `webpage-mainentity` (default, production: the questions as `mainEntity`
  of Rank Math's WebPage node through `rank_math/json_ld`, or of an own
  WebPage node when its graph has none; no FAQPage node, and Rank Math's
  own FAQ nodes are dropped, T-54), `faqpage` (own FAQPage node), `none`.

## Logos

`acf/logos` (`blocks/lists/logos.php`): optional heading, logos with alt
text and an optional link. A row of marks 48px high (`height: 3rem`, width
auto), lazy, `filter: grayscale(1)` until hover or focus — switched without
a transition (motion rule: only opacity and transform move). Content only
as on production: the AVPQ seal (media `avpq-seal.png`) and the
Logistik-Initiative Hamburg logo (media `lihh-partner-logo-2025-640.webp`)
of `/ueber-uns/zertifikate/`; other marks need the client's permission
(OPEN #72).

## Forms

C10, T-51. One block for every request form and one stylesheet section
(`theme.css` "Forms") for Contact Form 7's markup, which stays CF7's own:
its events (`wpcf7mailsent`), form IDs and unit tags (`wpcf7-f<ID>-…`) are
what analytics reads (T-61), so the theme adds no fetch and no `dataLayer`
code. Submission is CF7's: REST with JS, a plain POST with a reload without
JS.

- **Block** `acf/form-card` (`blocks/text/form-card.php`): `form` (a CF7 form,
  required), optional `heading` (h2, as on production, e.g. «Jetzt
  anfragen») and `intro`, `show_contacts` (e-mail, phone and address from
  Site Settings beside the form from 64rem, below it on phones; the address
  links to a Google Maps search, no embedded map and no third-party request),
  `background` (as Sections). The form sits on a light card
  (`--ccn-color-light`, `--ccn-radius-md`, `--ccn-shadow-2`, padding
  `--ccn-space-5`) that does not lift: a form must not move while it is
  filled in.
- **Assets**: CF7's CSS/JS and `assets/js/forms.js` (≤ 1 KB, deferred) load only
  on pages with the block or an old `[contact-form-7]` shortcode
  (`inc/assets-cleanup.php`); the front page requests nothing of CF7.
- **Fields** (CF7 form template): a visible `<label for>` above every field,
  never a placeholder in its place — «Name», «E-Mail», «Telefon (optional)»,
  «Interesse (optional)», «Ihre Anfrage». Required fields are not marked, the
  optional ones say «(optional)»; at most 4 are required (name, e-mail,
  request, consent); `autocomplete` name, email, tel. Fields are 48px high
  (`min-height: 3rem`), white, radius `--ccn-radius-sm`, 1px border
  `--ccn-color-secondary` (6.44:1 on white, 6.01:1 on the card;
  `--ccn-color-border` would give 1.25:1 / 1.17:1, under the 3:1 a field
  boundary needs, WCAG 1.4.11); the global focus ring.
- **Consent** after the fields: the checkbox inside its own label, with the
  production text and its links. CF7 runs it as a validated field
  (`acceptance_as_validation: on`), so the submit button is never disabled;
  an unticked box gets its error like any field.
- **Submit**: «Anfrage senden» (an action, not «Absenden»), the primary
  button at 48px.
- **Errors**: CF7 sets `aria-invalid="true"` and links the error text with
  `aria-describedby`. The error stands under its field in `--ccn-color-error`
  (6.53:1 on white, 6.10:1 on the card; CF7's own red `#dc3232` would give
  4.31:1 on the card), 14px bold, after an icon (`mask` + `currentColor`); the
  field border turns `--ccn-color-error` (1px border + 1px ring, no layout
  shift). The message sits above the fields (`order: -1` in the flex form):
  a yellow bar on white once sent, the error bar on
  `--ccn-color-error-surface` otherwise.
- **Focus on the result** (`forms.js`): `wpcf7invalid` → the first invalid
  field; `wpcf7mailsent` / `wpcf7mailfailed` → the message (`tabindex="-1"`,
  CF7's `aria-hidden` removed, so it is read once focused). CF7 resets a sent
  form first and hides the message meanwhile, so after sending the focus
  waits for `wpcf7reset`. CF7 describes the consent's wrapper, not its
  checkbox: the script passes the reference on.
- **Texts**: messages in German with «Sie» (production form 5682), form
  language `de_DE` (`lang="de-DE"` on the form, CF7 had `en-US`).
- **Contact pages** (`/kontakt-beratung/`, `/container-angebot-anfordern/`):
  Landing (full width) template with the production hero photo, then the
  form card first with the contacts beside it; at 360×800 the h1, the form
  and its first field are in the first screen. The legal paragraph lives only
  as the consent text of the checkbox.

## Motion

Vanilla CSS plus one module in `assets/js/main.js` (T-46); values from the
inventory of the old site (A5 §4), principles from the design brief (A6
§6.6). No libraries, no extra files or requests; only `opacity` and
`transform` move.

### Tokens and timings

| Effect | Value | Where |
|---|---|---|
| Hover/focus feedback (colour, background, border, shadow, transform) | 200ms ease-out | `--ccn-dur-fast`, `--ccn-ease-out` |
| Header: background, shadow, top bar fold, row 80 → 64px, logo scale | 250ms ease-out, after 8px of scroll | `--ccn-dur-base` (see Header) |
| Section reveal | 500ms ease-out, 20px rise, at 10 % visibility (root margin −5 % at the bottom) | `--ccn-dur-reveal`, `@keyframes ccn-reveal` |
| Reveal stagger | 80ms per child, 400ms at most | `main.js` |
| Counters | 1200ms easeOutCubic, de-DE format | `main.js` |
| Quick panel / slide | 160ms / 280ms ease | T-58 (Quick Contact) |

`--ccn-ease-out` is `cubic-bezier(.2,.7,.2,1)`.

### How a block opts in

- `data-motion="reveal"` on the root `<section>` of every block that can sit
  below the first screen: intro, text-image, text-section,
  featured-products, services, stats, cta-banner, info-cards,
  numbered-list, news.
- `data-motion-stagger` on the grid inside it; its children reveal one after
  another: `ul.products` (featured-products), services, stats, info cards,
  numbered list, news cards.
- Never: home-hero, contact-cards, the landing hero band
  (`template-parts/page-hero.php`), header and footer — they hold the LCP
  element or sit in the first screen.
- The smoke test fails for a new block whose root has no
  `data-motion="reveal"`, unless it joins the first-screen list on purpose.

### Runtime

1. `main.js` sets `html.ccn-motion` only when IntersectionObserver exists
   and `prefers-reduced-motion: no-preference` matches. Every hidden state in
   `theme.css` hangs off that class: without JS, without IO or with reduced
   motion nothing is ever hidden and no observer or `requestAnimationFrame`
   runs.
2. At load the positions of all targets are read once: whatever is in (or
   above) the viewport gets `.is-in` and never animates; the rest is hidden
   (`opacity: 0`) and observed.
3. At 10 % visibility (or on entering, for targets taller than the viewport)
   a target gets `.is-in.is-anim`: `animation: ccn-reveal` (`backwards` fill)
   plays once, stagger children get an inline `animation-delay`. An
   animation rather than a transition keeps reveal and hover independent —
   the same cards lift on hover.
4. Counters (`.ccn-stat-number[data-target]`, stats block): the HTML holds
   the final value (`number_format_i18n`, decimals kept; `data-target` in
   machine format, `data-suffix`). It counts up from 0 only together with the
   reveal of its grid, which is still at opacity 0, so the visible number
   never drops to 0. In view at load, with reduced motion or without JS the
   number stays as printed.
5. Sticky header: a 1px `aria-hidden` sentinel after `wp_body_open()`
   (`top: 8px`); when it leaves the viewport `#header` gets `.is-stuck`
   (solid background + `--ccn-shadow-1`, compact row, folded top bar — see
   Header). No scroll listener. This observer also runs with reduced motion:
   it is a state, not an animation.
6. `@media (prefers-reduced-motion: reduce)` cuts every transition and
   animation to 0.01ms; `scroll-behavior: smooth` applies only under
   `no-preference`.

### Hover, focus and menus

- Every `transition` in `theme.css` lists its properties and takes its
  duration from a motion token; `transition: all` and literal durations fail
  the smoke test (the reduced-motion override is the one literal value).
- Buttons (`.btn`, WooCommerce `.button`, `.wpcf7-submit`: `:hover`,
  `:focus-visible`) and cards (`.ccn-card`, product cards: `:hover`,
  `:focus-within`) lift by `translateY(-2px)` with `--ccn-shadow-3` in
  `--ccn-dur-fast`; `:active` returns to `translateY(0)` and darkens 8 %;
  disabled never lifts. One rule for all of them (end of `theme.css`); looks
  in Buttons and Cards.
- Main menu (desktop): the yellow bar under the current/hovered item grows
  in (`scaleX` 0 → 1). Mobile menu: opens with opacity + `translateY(-.5rem)`
  in `--ccn-dur-base` via `@starting-style` (instant in browsers without it),
  closes at once; the focus logic of `main.js` is unchanged.
- Services: the column text is always visible (no `max-height: 0` /
  `opacity: 0` until hover any more, A1 F7); since T-48 each service is a
  card and hover only lifts the card.

### Rail (carousel without a library)

`.ccn-rail` replaces Swiper: a flex row with `overflow-x: auto`,
`scroll-snap-type: x mandatory`, `scroll-padding-inline` and children at
`min(85%, 20rem)` with `scroll-snap-align: start`. Its padding/negative
margin (`--ccn-space-5` / `--ccn-space-4`) keeps card shadows and the hover
lift unclipped and lets the row run to the screen edge; scrollbars are
hidden on coarse pointers. Optional buttons:

```html
<div id="…" class="… ccn-rail">…cards…</div>
<div class="ccn-rail-nav">
  <button type="button" class="ccn-rail-btn" data-dir="-1" aria-controls="…"><span aria-hidden="true">‹</span><span class="screen-reader-text">Zurück</span></button>
  <button type="button" class="ccn-rail-btn" data-dir="1" aria-controls="…">…Weiter…</button>
</div>
```

`main.js` wires them (`scrollBy` 80 % of the visible width, smooth unless
reduced motion) and only then makes the row visible (`.is-ready`); without
JS the row keeps its space but stays invisible — no dead controls, no layout
shift. Buttons are 44×44px and named by screen-reader text (README "Markup
standard"). No autoplay. A block decides where the rail turns back into a
grid: `news` below 64rem (from 64rem a 4-column grid, buttons hidden);
featured products stay a one-column grid at 360 (T-48, see Cards).

### Not animated (A5 §4, A6 §6.6)

Hero image and title, contact cards, the landing hero band, forms and
running text beyond the block reveal. The header's compact state is the one
layout transition, allowed because the header is fixed (see Header). No parallax,
no image layers, no autoplay carousels, no hover-only content. Scroll-driven
CSS (`animation-timeline: view()`, ~89 % support in 10/2026) is an idea for
a later version, not used in v1.

## Do / don't

- Do use tokens for every colour, size, space, radius, shadow and duration.
- Do keep content visible without JS; animation is an enhancement only.
- Do keep the LCP element (hero image, hero h1, header, contact cards) static.
- Don't add fonts, weights or font hosts.
- Don't add JS or CSS libraries (no GSAP, Swiper, AOS); vanilla only.
- Don't write `transition: all`; list the properties (`opacity`, `transform`,
  `color`, `background-color`, `box-shadow`).
- Don't hide content behind hover only (touch devices have no hover).
- Don't add an eyebrow that says nothing.
- Don't put yellow or orange text on a light background.
- Don't add raw hex outside `:root` (the smoke test fails).

## Content & brand rules

Design work never rewrites copy: texts, H1s and figures mirror production
(decision 08.11.2026); copy errors go to the card report, not into templates.
For every string the theme prints itself (UI, placeholders, block hints) and
for reviewing content:

1. Address the reader as «Sie» everywhere, UI strings included (buttons, form
   errors, 404, cart) — client decision 24.10.2026.
2. Company name only as «Coin Container Inspiration GmbH», «Coin Container
   Inspiration» or «Coin Container» — never «COIN», «COINtainer» or «Coin»
   alone, titles included.
3. Container names without hyphens: 20 Fuß Container, 40 Fuß High Cube, High
   Cube, One Way, Open Side, Open Top, Double Door, Flat Rack, Pallet Wide,
   Hard Top; one word: Seecontainer, Lagercontainer, Kühlcontainer,
   Isoliercontainer, Bürocontainer, Wohncontainer. «Fuß» with ß in text,
   «fuss» in URLs.
4. German number format: «2.438 mm», «32,1 m³», prices «1.800,00 €» with
   «inkl. MwSt.» or «zzgl. MwSt.».
5. No dash («–») inside paragraph copy (house rule), no emoji, no superlatives
   without proof, never mention ProvenExpert. Forbidden: «Lieferung ab
   Hamburg», «eigenes Depot», «kostenlose Lieferung»; allowed: «ab
   Partnerdepot Hamburg», «unser Lagerbestand im Depot Hamburg».
6. Images: real photos first. AI images only as symbolic images captioned
   «Symbolbild (KI-generiert)» (realistic container yard or harbour; no
   people, number plates, numbers, text or logos); never AI product photos.
7. Brand colours named by the client (26.02.2025): `#f7c600` and `#605e5e` are
   the tokens `--ccn-color-primary` and `--ccn-color-secondary`; `#dfa921` and
   `#a7a29f` are not in the token set (as text on white 2.13:1 and 2.52:1 —
   fills only, if a card ever adds them).

## How to measure

- Token contrast: `node tests/contrast.cjs --tokens` (table above),
  `node tests/contrast.cjs <fg> <bg>` for a single pair.
- Page contrast, type and prose width: the Playwright probes of the project
  library (outside this repo) — `reports/2026-11-08-data/t45_contrast.cjs`
  (6 pages × 360/1440, normal vs large text, text over photos listed apart),
  `a6_probe.cjs`, `a6_probe2.cjs`; screenshots with `a6_shots.cjs`.
- Smoke test (`tests/js-smoke.mjs`, "Design tokens (T-45)" and "Editor
  parity"): computed h1/h2/body sizes, link and menu colours, no raw hex
  outside `:root`, token contrast, theme.json in sync with the tokens, no
  global-styles on the front end.
- Smoke test, "Motion invariants (T-46)": blocks in view at load visible and
  below the fold hidden, hero/contact cards/header static, reveal animations
  playing on scroll and nothing left below opacity 1 afterwards, counters
  counting once to the printed value, reduced motion and blocked `main.js`
  hiding nothing, sticky sentinel, `data-motion` on every block root.
  Lighthouse: `non-composited-animations` stays empty, CLS 0.
- Smoke test, "Components (T-48)": no horizontal scroll on nine pages at
  360/768/1280/1440; product card at 360 (one column, button 44–48px over
  ≥ 90 % of the card, title ≤ 3 lines) and thumbnail `sizes`; focus ring
  3px solid with a 2px gap after Tab; tap targets ≥ 44px (header icons,
  mobile menu, footer); services text without hover; stats colours; ≥ 4
  section backgrounds on the front page with no equal neighbours; one CTA
  banner per page; text contrast on the six key pages at 360/1440 and with
  dark/yellow section backgrounds switched on; WooCommerce add-to-cart on the
  button system. Library probes: `reports/2026-11-08-data/t48_probe.cjs`
  (overflow, focus, cards, sections, taps, hover, spacing),
  `t48_cta_photo.cjs` (white text over the photo CTA, sampled pixels);
  button states: `reports/2026-11-08-t48-shots/t48_states.cjs`.
- Smoke test, "Product & catalog (T-49)": jQuery only on the WooCommerce
  pages (deferred on shop pages); WooCommerce's stylesheets only on the shop,
  categories and cart; card title links without underline; on the product
  page theme.css is the only render-blocking stylesheet and every script
  defers; the gallery at 360 (visible, slider with arrows and no thumbnail
  strip, first photo eager/high, photos 2..N not requested, the next arrow
  loads photo 2), the lightbox by keyboard, thumbnails at 1280, the gallery
  without JS; the first screen of a product at 360 (h1 ≤ 560, price ≤ 640,
  add to cart ≤ 760 above the action bar, the order), badge and request
  button, every colour of `<main>` a token, CLS ≤ 0.01; breadcrumbs on seven
  page types; discounted products first; one 16px gutter at 360. Library
  probes: `reports/2026-11-08-data/t49_probe.cjs` (first screen of three
  products, colours with the cart notice, layout shifts, breadcrumbs and
  jQuery per page, lightbox, catalogue order), `t49_wccss_diff.cjs`
  (computed styles with and without WooCommerce's stylesheets),
  `t49_gutter.cjs`, `t49_lh.py` (Lighthouse summary and request list).
- Smoke test, "Trust & FAQ (T-50)": no widget markup or third-party URL in
  the front page document; before any scroll 0 requests to Trustindex,
  Trustpilot, Google photos and the reviews endpoint (360 and 1440) and the
  Google box reserved; near the facade the widget HTML arrives and the
  loader and TrustBox are requested, both formatted inside the unchanged
  boxes (CDN unreachable: skipped); no cookies or storage afterwards; hero
  and trust bar chips (13, 126, AVPQ, trust bar in the first two screens);
  footer badges as on production; FAQ details by Enter and click, h3 under
  the h2; FAQPage 0, aggregateRating 0, FAQ questions only per schema mode;
  logos lazy (code level). Library probes:
  `reports/2026-11-08-data/t50_probe.cjs` (requests before scroll, reserved
  and real widget heights, layout shifts while the widgets start, trust items
  per screen, FAQ), `t50_cookies.cjs` (cookies and storage of every frame
  before and after both widgets), `t50_jsonld.py` (JSON-LD per page).
- Smoke test, "Request form (T-51)": the form card on the landings and the
  contact pages and no hand-built group left; CF7 requests and `forms.js`
  (deferred, ≤ 1 KB) only on pages with a form, none on `/`; every field
  labelled, 3–4 required, the consent last with the Datenschutz link, hidden
  `produkt`/`quelle`, «Anfrage senden» ≥ 48px and enabled, form language de;
  an empty submit at 360 gives ≥ 3 errors under their fields, each invalid
  field described by its error, the focus on the first one, the error colour
  at ≥ 4.5:1 on the card and the message above the fields; without JS the
  form posts to its page. Library probes:
  `reports/2026-11-08-data/t51_probe.cjs` (fields, labels, errors and focus
  after an empty submit, `aria-*` in the DOM),
  `reports/2026-11-08-t51-shots/t51_shots.cjs` (360/1440 and the error
  state).
- Smoke test, "SEO plugin (T-54)": Rank Math only (its JSON-LD valid on six
  pages, no Yoast marks), one non-empty `<title>` and at most one meta
  description; one BreadcrumbList naming the visible crumbs, «Startseite»
  first, the product path with its category; one company node on the front
  page (Organization + Store, `/#organization`); the sitemap index with the
  page, post, product and product_cat sitemaps and the robots.txt line; the
  trail at the container edge at 1440 on landings and contact pages and a
  long product trail fitting 360. Library probes:
  `reports/2026-11-09-data/t54_seo_probe.py` (head bytes, meta tags and
  JSON-LD nodes per page), `reports/2026-11-09-t54-shots/t54_shots.cjs`
  (trail geometry and screenshots at 1440/360).
- Smoke test, "Migration (T-53a)": no page names the donor host
  (`coin-container.local`) on nine pages, the JSON-LD logo included; the
  product sitemap lists the 42 production products and the category sitemap
  only categories under `/container-kaufen/` (the production category base);
  every link of the product categories menu group answers 200; the product
  trail is «Startseite › shop page › one of its categories › product» without
  the rebuild's old parent category. Category paths of the smoke test are
  constants at the top of the file (`CAT_BASE`, `CAT_STANDARD`, …). The
  migration scripts live in the project library (`tools/migration/`, outside
  this public repo): `validate.php` there checks product and form IDs,
  categories, donor hosts left in `post_content`, `[coin_*]` shortcodes, menu
  links and options; `dom_metrics.py` runs over the list of migrated URLs.
