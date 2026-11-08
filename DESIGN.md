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
colours: photo overlays (`rgba(20,20,20,.15–.6)` gradients of the heroes),
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
| `--ccn-fs-small` | `.875rem` | 14px | 14px | uppercase buttons, copyright |
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
  18px (`.site-header`, `ul.products`): their sizes are decided by the header
  card (T-47) and the card/catalogue cards (T-48, T-49).
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
| `--ccn-topbar-h` / `--ccn-header-h` / `--ccn-header-h-compact` | 2.5rem / 5rem / 4rem |

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
| C1 | Hero (home) | h1 with the keyword (text as on production), 1 primary + 1 secondary CTA, phone link, rating line; on 360×800 h1 ≤ 4 lines and CTA, phone, rating inside 800px | T-47 | planned |
| C2 | Mobile action bar | bottom bar 56px below 768px: Anrufen (`tel:`) + Anfrage, safe-area inset, targets ≥ 44px | T-47 | planned |
| C3 | Sticky header | ≤ 64px on 360; 80px → 64px after scroll with `--ccn-shadow-1`; phone icon 44×44 below 1024px; CLS 0 | T-47 | planned |
| C4 | Product/service cards | radius 8–12px, rest `--ccn-shadow-1` + 1px border, hover/focus lift 2px + `--ccn-shadow-3`, image 4:3, title ≤ 3 lines, button ≥ 44px and on one line at 360 | T-48 | planned |
| C5 | Buttons | rest/hover/focus-visible (+ active/disabled), height ≥ 44px, verb labels, one primary per screen | T-48 | planned |
| C6 | Section heading + eyebrow | eyebrow only where it carries information (category), 13px uppercase, `--ccn-color-primary-text-strong`; otherwise the accent tail of the heading | T-48 | planned |
| C7 | Stats | real figures only, dark surface with yellow numbers, `tabular-nums`, count once, final values with reduced motion | T-48 | planned |
| C8 | Trust block | rating with count (live widgets as on production), quotes, partner logos, years/volume line; before the final CTA | T-50 | planned |
| C9 | CTA banner | one per page, yellow band with `#202020` text, h2 + Anfrage + phone | T-48 | planned |
| C10 | Request form | ≤ 4 required fields, visible labels, errors under the field with `aria-describedby`, consent after the fields, submit ≥ 48px | T-51 | planned |
| C11 | Footer | dark, location/container-type columns, one icon set, targets ≥ 44px, text ≥ 4.5:1 | T-48 | planned |
| C12 | Single product (360) | gallery visible at once, h1/price/CTA in the first 760px, badge/price/button on tokens | T-49 | planned |

## Motion tokens

Values from the inventory of the old site (A5 §4). The tokens marked in CSS
exist in `:root`; the motion code itself (reveal, counters, sticky sentinel)
is T-46.

| Effect | Value | Token |
|---|---|---|
| Hover/focus feedback (colour, background, shadow, transform) | 200ms ease-out | `--ccn-dur-fast`, `--ccn-ease-out` |
| Sticky header compact/shadow | 250ms ease-out, threshold 80px | `--ccn-dur-base` |
| Section reveal | 500ms ease-out, offset 16–24px, threshold 10 %, max delay 400ms | `--ccn-dur-reveal` |
| Reveal stagger | 80ms per item | (T-46) |
| Counters | 1200ms easeOutCubic, start at 40 % visibility, final number in the HTML | (T-46; `main.js` already uses 1200ms) |
| Quick panel / slide | 160ms / 280ms ease | (T-46) |
| Carousel arrow scroll | native `scroll-behavior` (~300ms), no autoplay | — |

`--ccn-ease-out` is `cubic-bezier(.2,.7,.2,1)`. `prefers-reduced-motion:
reduce` switches every effect off, in CSS and in JS.

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
- Smoke test (`tests/js-smoke.mjs`, "Design tokens (T-45)"): computed h1/h2/body
  sizes, link and menu colours, no raw hex outside `:root`, token contrast.
