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
colours: photo overlays (`rgba(20,20,20,.1–.7)` gradients of the heroes),
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
- No text below 14px except badges, eyebrow labels and the top bar; the
  existing 13.6px labels (news date, numbered-list text, catalogue
  sub-filter) are fixed in the card pass (T-48).

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
`36rem` (576px), `48rem` (768px), `64rem` (1024px).

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

## Components

Specs come from the design brief (A6 §6.4); each card that builds a component
replaces its "planned" line with the implemented spec.

| # | Component | Acceptance criteria (short) | Card | Status |
|---|---|---|---|---|
| C1 | Hero (home) | h1 with the keyword (text as on production), 1 primary + 1 secondary CTA, phone link, rating line; on 360×800 h1 ≤ 4 lines and CTA, phone, rating inside 800px | T-47 | built — see Hero |
| C2 | Mobile action bar | bottom bar 56px below 768px: Anrufen (`tel:`) + Anfrage, safe-area inset, targets ≥ 44px | T-47 | planned |
| C3 | Sticky header | ≤ 64px on 360; 80px → 64px after scroll with `--ccn-shadow-1`; phone icon 44×44 below 1024px; CLS 0 | T-47 | built — see Header |
| C4 | Product/service cards | radius 8–12px, rest `--ccn-shadow-1` + 1px border, hover/focus lift 2px + `--ccn-shadow-3`, image 4:3, title ≤ 3 lines, button ≥ 44px and on one line at 360 | T-48 | planned |
| C5 | Buttons | rest/hover/focus-visible (+ active/disabled), height ≥ 44px, verb labels, one primary per screen | T-48 | planned |
| C6 | Section heading + eyebrow | eyebrow only where it carries information (category), 13px uppercase, `--ccn-color-primary-text-strong`; otherwise the accent tail of the heading | T-48 | planned |
| C7 | Stats | real figures only, dark surface with yellow numbers; `tabular-nums`, count once and final values with reduced motion are in place (T-46, see Motion) | T-48 | planned |
| C8 | Trust block | rating with count (live widgets as on production), quotes, partner logos, years/volume line; before the final CTA | T-50 | planned |
| C9 | CTA banner | one per page, yellow band with `#202020` text, h2 + Anfrage + phone | T-48 | planned |
| C10 | Request form | ≤ 4 required fields, visible labels, errors under the field with `aria-describedby`, consent after the fields, submit ≥ 48px | T-51 | planned |
| C11 | Footer | dark, location/container-type columns, one icon set, targets ≥ 44px, text ≥ 4.5:1 | T-48 | planned |
| C12 | Single product (360) | gallery visible at once, h1/price/CTA in the first 760px, badge/price/button on tokens | T-49 | planned |

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
  phone in the first screen (4 of 4).
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
  the header row, `.7` at the bottom (white text). Sampled with the texts
  hidden (20 points each): white text ≥ 11:1 on 360 and ≥ 5:1 on 1440 at the
  worst point; logo grey `#605e5e` against the glass ≥ 3.6:1 on average on
  the three glass pages. A dark top gradient (`.45 → 0` over the top
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
- `.btn` (`:hover`, `:focus-visible`) and the cards `li.product`,
  `.ccn-news-card`, `.ccn-info-card`, `.ccn-service` (`:hover`,
  `:focus-within`) lift by `translateY(-2px)` with `--ccn-shadow-3` in
  `--ccn-dur-fast`; `.btn:active` returns to `translateY(0)`. Card and button
  looks (radius, rest shadow, focus ring) are T-48.
- Main menu (desktop): the yellow bar under the current/hovered item grows
  in (`scaleX` 0 → 1). Mobile menu: opens with opacity + `translateY(-.5rem)`
  in `--ccn-dur-base` via `@starting-style` (instant in browsers without it),
  closes at once; the focus logic of `main.js` is unchanged.
- Services: the column text is always visible (no `max-height: 0` /
  `opacity: 0` until hover any more, A1 F7); hover only lifts the column.

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
featured products on 360 is T-48's decision.

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
