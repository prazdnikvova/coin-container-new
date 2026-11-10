# Theme translations

Text domain `coin-container`, loaded by `load_theme_textdomain()` in
`functions.php` from this folder.

| File | What it is |
|---|---|
| `coin-container.pot` | Template of every gettext string of the theme (PHP templates, `theme.json`, theme header). |
| `de_DE.po` / `de_DE.mo` | German. The site addresses the reader with «Sie», so this is the formal German. |
| `de_DE_formal.mo` | A copy of `de_DE.mo`. The site runs in the `de_DE_formal` locale (WordPress, WooCommerce and Contact Form 7 say «Sie» there) and WordPress loads the theme file named after the locale. |

There is no English `.po`. On `/en/` TranslatePress switches the locale to
`en_US`, so English source strings show as they are, and it translates
gettext strings (also the ones written in German in the code) through its own
string table.

## Updating

From the theme root (WP-CLI with the `i18n` commands):

```bash
wp i18n make-pot . languages/coin-container.pot --domain=coin-container --exclude=vendor,node_modules,tests
wp i18n update-po languages/coin-container.pot languages/de_DE.po
# translate the new entries in de_DE.po, then:
wp i18n make-mo languages/de_DE.po languages/
cp languages/de_DE.mo languages/de_DE_formal.mo
```

`update-po` (WP-CLI 2.12) drops the three comment lines at the top of
`de_DE.po` (the German translation, copyright and licence lines): put them
back before committing. A string removed from the code leaves the `.po` with
it, translation included.

## Rules for the German

- Terms come from the production site or from the standard WordPress,
  WooCommerce or BlankSlate German (formal) translations. Nothing is made up:
  a string without such a source stays in its original until the editorial
  process decides.
- Visitor-facing strings are all translated. Strings that the code already
  writes in German keep the same text in `de_DE.po`.
- Editor and admin strings (block names and descriptions, block categories,
  editor hints, pattern titles and descriptions, the pattern category,
  template names, `theme.json` labels, menu locations) have no production
  counterpart and stay English for now.
- The placeholders of the patterns and block examples («[Überschrift]»,
  «[Text]» …, `ccn_placeholder()` in `inc/editor.php`) are German source
  strings; their entries stay empty, so the source shows.
- «Sie», never «du»; German number and price format.
