// Static checks of the theme source (T-59): the rules of README and DESIGN.md that the code itself shows, so
// they need no WordPress, no browser and no npm install. CI runs this file on every push
// (.github/workflows/ci.yml); locally `node tests/static-checks.mjs` from the theme root (or `node
// static-checks.mjs` in tests/) before a commit. The rendered pages are the smoke test's (js-smoke.mjs).
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SKIP = new Set(['.git', 'vendor', 'node_modules']);
const TEXT = /\.(php|css|js|mjs|cjs|json|md|txt|xml|yml|yaml|po|pot|html|svg|lock|dist)$/i;

const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
	if (SKIP.has(e.name)) return [];
	const p = join(dir, e.name);
	return e.isDirectory() ? walk(p) : [relative(ROOT, p).split(sep).join('/')];
});
const files = walk(ROOT);
const read = (f) => readFileSync(join(ROOT, f), 'utf8');

// Theme code: everything outside tests/ (the tests name the patterns they look for).
const code = files.filter((f) => !f.startsWith('tests/'));
const php = code.filter((f) => f.endsWith('.php'));
const css = code.filter((f) => f.endsWith('.css'));
const js = code.filter((f) => /\.(js|mjs|cjs)$/.test(f));

// Comments say what code does and may name what it avoids; the checks read code only.
const noBlockComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '');
const noLineComments = (s) => s.replace(/(^|[^:'"\\])\/\/[^\n]*/g, '$1').replace(/^[ \t]*#(?!\[)[^\n]*/gm, '');
const src = (f) => (f.endsWith('.css') ? noBlockComments(read(f)) : noLineComments(noBlockComments(read(f))));
const hits = (list, re) => list.flatMap((f) => (src(f).match(new RegExp(re.source, 'g')) || []).map(() => f));

const results = [];
const ok = (name, cond, extra = '') => results.push(`${cond ? 'PASS' : 'FAIL'} ${name}${extra ? ' — ' + extra : ''}`);

// 1. Motion (DESIGN.md "Hover, focus and menus"): every transition lists its properties.
const transAll = hits([...css, ...php, ...js], /transition(-property)?\s*:\s*all\b/);
ok('Static: no "transition: all" in the CSS, PHP and JS of the theme', transAll.length === 0, JSON.stringify(transAll));

// 2. Reduced motion (DESIGN.md "Runtime" 1 and 6): theme.css cuts transitions and animations, main.js checks the query.
const rmCss = (src('assets/css/theme.css').match(/@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)/g) || []).length;
const rmJs = (src('assets/js/main.js').match(/prefers-reduced-motion/g) || []).length;
ok('Static: prefers-reduced-motion handled in theme.css (@media reduce) and main.js', rmCss >= 1 && rmJs >= 1, JSON.stringify({ css: rmCss, js: rmJs }));

// 3. Markup standard (README): one <header> per page, printed by header.php only.
const headers = hits(php, /<header[\s>]/);
ok('Static: exactly one <header> in the PHP templates (header.php)', headers.length === 1 && headers[0] === 'header.php', JSON.stringify(headers));

// 4. fetchpriority only where the LCP image is printed (DESIGN.md "Hero", "Product page"; A3 §2.6, Trac #64823:
// never in a menu or an overlay): the home hero, the landing hero band, the hero preload, the product gallery.
const FETCHPRIORITY = ['blocks/banners/home-hero.php', 'functions.php', 'inc/woocommerce.php', 'template-parts/page-hero.php'];
const fpFiles = [...new Set(hits([...php, ...js], /fetchpriority/))].sort();
ok('Static: fetchpriority set only by the hero, landing hero, hero preload and product gallery code', JSON.stringify(fpFiles) === JSON.stringify(FETCHPRIORITY), JSON.stringify(fpFiles));

// 5. Comments are off site-wide (CLAUDE.md, smoke "Hygiene (T-60)"): no comment reply script anywhere.
const reply = hits([...php, ...js], /comment-reply/);
ok('Static: no comment-reply in the PHP and JS of the theme', reply.length === 0, JSON.stringify(reply));

// 6. Languages are TranslatePress: no trace of the multilingual plugin planned before it (README "Languages").
// The name is put together here, so this file does not count itself.
const oldPlugin = ['w', 'p', 'm', 'l'].join('');
const oldHits = files.filter((f) => TEXT.test(f) && read(f).toLowerCase().includes(oldPlugin));
ok('Static: no file of the theme names the multilingual plugin planned before TranslatePress', oldHits.length === 0, JSON.stringify(oldHits));

// 7. Editor (DESIGN.md "Editor"): no block style variations of the theme.
const styles = hits([...php, ...js], /register_block_style\s*\(/);
ok('Static: no register_block_style() in the theme', styles.length === 0, JSON.stringify(styles));

// 8. WooCommerce theme support declared once, with its image sizes (inc/woocommerce.php).
const wcSupport = hits(php, /add_theme_support\(\s*['"]woocommerce['"]/);
ok("Static: add_theme_support( 'woocommerce' ) exactly once, in inc/woocommerce.php", wcSupport.length === 1 && wcSupport[0] === 'inc/woocommerce.php', JSON.stringify(wcSupport));

console.log(results.join('\n'));
const fails = results.filter((r) => r.startsWith('FAIL')).length;
console.log(`\n${results.length - fails}/${results.length} PASS (${files.length} files, ${php.length} PHP, ${css.length} CSS, ${js.length} JS)`);
process.exit(fails ? 1 : 0);
