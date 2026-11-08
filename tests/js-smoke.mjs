// Coin Container smoke test: rendering, accessibility basics, security hardening.
// Requires a local WordPress site running this theme.
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const BASE = process.env.CCN_BASE_URL || 'http://coin-container-new.local';

const results = [];
const ok = (name, cond, extra = '') => results.push(`${cond ? 'PASS' : 'FAIL'} ${name}${extra ? ' — ' + extra : ''}`);

const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

// Home: 200 + security headers
const resp = await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
ok('Home responds 200', resp.status() === 200, String(resp.status()));
const headers = resp.headers();
ok('X-Frame-Options header', headers['x-frame-options'] === 'SAMEORIGIN', headers['x-frame-options'] || 'missing');
ok('X-Content-Type-Options header', headers['x-content-type-options'] === 'nosniff', headers['x-content-type-options'] || 'missing');
ok('Referrer-Policy header', !!headers['referrer-policy'], headers['referrer-policy'] || 'missing');

// Markup: skip link, main landmark, viewport
ok('Skip link present', await page.locator('a.skip-link[href="#content"]').count() === 1);
ok('main#content landmark', await page.locator('main#content').count() === 1);
const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
ok('Viewport has initial-scale', /initial-scale=1/.test(viewport || ''), viewport || 'missing');

// No WP generator meta (version leak)
ok('No generator meta', await page.locator('meta[name="generator"]').count() === 0);

// Deferred main.js from the theme
const mainScript = page.locator('script[src*="assets/js/main.js"]');
ok('main.js enqueued with defer', await mainScript.count() === 1 && (await mainScript.getAttribute('defer')) !== null);

ok('Zero JS errors on home', errors.length === 0, errors.join(' | '));

// Vanilla-JS policy: jQuery must not load outside Woo cart/checkout/account
ok('jQuery absent on home', await page.evaluate(() => typeof window.jQuery === 'undefined'));

// Header: primary nav with dropdown structure, phone link
ok('Primary nav rendered', await page.locator('#site-nav .site-menu > li').count() >= 5);
ok('Nav has dropdowns', await page.locator('#site-nav .sub-menu').count() >= 2);
ok('Header phone link', await page.locator('.header-phone[href^="tel:"]').count() === 1);

// Top bar (desktop): contacts + social; sticky header
ok('Topbar visible on desktop', await page.locator('.ccn-topbar').isVisible());
ok('Topbar email link', await page.locator('.ccn-topbar-email[href^="mailto:"]').count() === 1);
ok('Topbar social icons', await page.locator('.ccn-topbar-social a[href^="https://"]').count() >= 3);
ok('Header is sticky', await page.evaluate(() =>
	getComputedStyle(document.querySelector('.site-header')).position === 'sticky'));
ok('Topbar is grey (secondary)', await page.evaluate(() =>
	getComputedStyle(document.querySelector('.ccn-topbar')).backgroundColor === 'rgb(96, 94, 94)'));
ok('Header glass over hero, white after scroll', await page.evaluate(async () => {
	const header = document.getElementById('header');
	window.scrollTo(0, 0);
	await new Promise((r) => setTimeout(r, 350));
	const atTop = getComputedStyle(header).backgroundColor;
	window.scrollTo(0, 500);
	await new Promise((r) => setTimeout(r, 350));
	const scrolled = getComputedStyle(header).backgroundColor;
	window.scrollTo(0, 0);
	await new Promise((r) => setTimeout(r, 350));
	return atTop.includes('0.46') && scrolled === 'rgb(255, 255, 255)';
}));

// Cart icon with count badge
ok('Cart icon with count', await page.locator('.header-cart svg').count() === 1
	&& /^\d+$/.test((await page.locator('.header-cart-count').textContent() || '').trim()));

// Search: toggle opens the form, Escape closes it
const searchToggle = page.locator('.search-toggle');
ok('Search form hidden initially', !(await page.locator('#header-search-form').isVisible()));
await searchToggle.click();
ok('Search toggle opens form', (await searchToggle.getAttribute('aria-expanded')) === 'true'
	&& await page.locator('#header-search-form input[name="s"]').isVisible());
await page.keyboard.press('Escape');
ok('Escape closes search', (await searchToggle.getAttribute('aria-expanded')) === 'false'
	&& !(await page.locator('#header-search-form').isVisible()));

// Footer: contacts from Site Settings + legal menu
ok('Footer address rendered', (await page.locator('.footer-address').textContent() || '').includes('Hamburg'));
ok('Footer legal menu', await page.locator('.footer-menu li').count() >= 4);
ok('Footer social links', await page.locator('.footer-social-list a[href^="https://"]').count() >= 4);

// Mobile: burger opens/closes the nav, Escape closes it, zero JS errors
const mob = await browser.newPage({ viewport: { width: 375, height: 720 } });
const mobErrors = [];
mob.on('pageerror', (e) => mobErrors.push('pageerror: ' + e.message));
mob.on('console', (m) => { if (m.type() === 'error') mobErrors.push('console: ' + m.text()); });
await mob.goto(BASE + '/', { waitUntil: 'load' });
const burger = mob.locator('.nav-toggle');
ok('Burger visible on mobile', await burger.isVisible());
ok('Nav hidden before toggle', !(await mob.locator('#site-nav').isVisible()));
await burger.click();
ok('Burger opens nav', (await burger.getAttribute('aria-expanded')) === 'true' && (await mob.locator('#site-nav').isVisible()));
await mob.keyboard.press('Escape');
ok('Escape closes nav', (await burger.getAttribute('aria-expanded')) === 'false' && !(await mob.locator('#site-nav').isVisible()));
ok('Zero JS errors on mobile home', mobErrors.length === 0, mobErrors.join(' | '));
await mob.close();

// Homepage: hero block (acf/home-hero) — H1 + responsive LCP image
ok('Hero block on home', await page.locator('.ccn-hero').count() === 1);
ok('Hero has H1', await page.locator('.ccn-hero h1.ccn-hero-title').count() === 1);
ok('Hero image loads with high priority', await page.evaluate(() => {
	const img = document.querySelector('.ccn-hero img.ccn-hero-img');
	return !!img && img.getAttribute('fetchpriority') === 'high' && !!img.currentSrc;
}));
ok('Hero image is responsive (srcset)', await page.evaluate(() => {
	const img = document.querySelector('.ccn-hero img.ccn-hero-img');
	return !!img && (img.getAttribute('srcset') || '').split(',').length >= 2;
}));

// Homepage: contact cards + intro blocks (top of the page, original design)
ok('Contact cards render', await page.locator('.ccn-contact-cards .ccn-contact-card').count() === 3);
ok('Contact phone card is dark', await page.locator('.ccn-contact-card.is-dark a[href^="tel:"]').count() === 1);
ok('Intro heading with accent', await page.locator('.ccn-intro-heading .ccn-accent').count() === 1);
ok('Intro CTA button', await page.locator('.ccn-intro .btn-dark[href*="container-shop"]').count() === 1);

// Homepage: featured products block (WooCommerce loop)
ok('Featured products on home', await page.locator('.ccn-featured ul.products li.product').count() >= 3);
ok('Sale badge styled (Angebot!)', await page.evaluate(() => {
	const b = document.querySelector('.ccn-featured .onsale');
	return !!b && /angebot/i.test(b.textContent) && getComputedStyle(b).position === 'absolute';
}));

// Homepage: middle + bottom blocks (text-image, services, stats, CTA, news)
ok('Text-image block with collage', await page.locator('.ccn-text-image .ccn-text-image-photo').count() === 2);
ok('Services strip with 4 items', await page.locator('.ccn-services .ccn-service').count() === 4);
ok('Services strip photo is lazy', (await page.locator('.ccn-services-bg').getAttribute('loading')) === 'lazy');
ok('Stats has 3 counters', await page.locator('.ccn-stats .ccn-stat-number[data-target]').count() === 3);
ok('CTA banner heading + button', await page.locator('.ccn-cta .ccn-cta-heading').count() === 1
	&& await page.locator('.ccn-cta .btn-primary').count() === 1);
ok('News grid with 4 cards', await page.locator('.ccn-news .ccn-news-card').count() === 4);
ok('News cards have category badges', await page.locator('.ccn-news .ccn-news-badge').count() >= 3);
ok('Home is fully block-based (no flexible sections)', await page.locator('main .section-hero, main .section-cta, main .section-featured').count() === 0);

// A11y guards (rules 11–16 of the anti-old-prod checklist, added with T-34)
ok('All links/buttons have accessible names', await page.evaluate(() => {
	return [...document.querySelectorAll('a, button')].every((el) =>
		(el.textContent || '').trim() !== ''
		|| (el.getAttribute('aria-label') || '').trim() !== ''
		|| el.hasAttribute('aria-labelledby')
		|| [...el.querySelectorAll('img[alt]')].some((i) => i.alt.trim() !== ''));
}));
ok('Accent text is not raw brand yellow (contrast)', await page.evaluate(() => {
	const els = document.querySelectorAll('.ccn-accent, .ccn-accent-inline, .ccn-news-heading');
	return els.length >= 3 && [...els].every((el) => getComputedStyle(el).color !== 'rgb(247, 198, 0)');
}));
ok('Cart accessible name includes visible count', await page.evaluate(() => {
	const a = document.querySelector('.header-cart');
	if (!a || a.hasAttribute('aria-label')) return false; // aria-label would hide the visible count from the name
	const count = ((a.querySelector('.header-cart-count') || {}).textContent || '').trim();
	return /^\d+$/.test(count) && (a.textContent || '').includes(count);
}));

// Shop: product grid renders, jQuery still absent on a catalog page
const respShop = await page.goto(BASE + '/container-shop/', { waitUntil: 'domcontentloaded' });
ok('Shop responds 200', respShop.status() === 200, String(respShop.status()));
ok('Shop lists products', await page.locator('ul.products li.product').count() >= 6);
ok('jQuery absent on shop', await page.evaluate(() => typeof window.jQuery === 'undefined'));

// Category archive renders products
const respCat = await page.goto(BASE + '/product-category/cointainer/standardcontainer/', { waitUntil: 'domcontentloaded' });
ok('Category responds 200', respCat.status() === 200, String(respCat.status()));
ok('Category lists products', await page.locator('ul.products li.product').count() >= 3);

// Single product: title, price area, add-to-cart button
const respSingle = await page.goto(BASE + '/product/20-fuss-container-one-way/', { waitUntil: 'domcontentloaded' });
ok('Single product 200', respSingle.status() === 200, String(respSingle.status()));
ok('Single has title', (await page.locator('.product_title').count()) === 1);
ok('Single has add-to-cart', (await page.locator('button.single_add_to_cart_button, a.add_to_cart_button').count()) >= 1);

// Landing on blocks with sidebar (T-30b): kaufen — product grid, shop button, form
const respLanding = await page.goto(BASE + '/container-kaufen/', { waitUntil: 'domcontentloaded' });
ok('Kaufen landing 200', respLanding.status() === 200, String(respLanding.status()));
ok('Kaufen hero band with H1', await page.locator('.ccn-page-hero h1.ccn-page-hero-title').count() === 1);
ok('Kaufen hand-picked product grid', await page.locator('.ccn-featured li.product').count() === 4);
ok('Kaufen shop button', await page.locator('.ccn-landing-main a.btn-dark[href*="container-shop"]').count() === 1);
ok('Kaufen sidebar + inline form', await page.locator('.ccn-landing-sidebar').count() === 1
	&& await page.locator('.ccn-form-card form.wpcf7-form').count() === 1);
ok('Kaufen has no flexible sections', await page.locator('.section-hero, .section-text, .section-cta').count() === 0);
ok('No PNG/JPEG images in content', await page.evaluate(() =>
	![...document.images].some((i) => /\.(png|jpe?g)(\?|$)/i.test(i.currentSrc || i.src))));

// Landing on blocks, full width (T-30b): zubehoer — info cards, numbered list, CTA
const respZub = await page.goto(BASE + '/containerzubehoer/', { waitUntil: 'domcontentloaded' });
ok('Zubehoer landing 200', respZub.status() === 200, String(respZub.status()));
ok('Zubehoer is full width (no sidebar)', await page.locator('.ccn-landing-full').count() === 1
	&& await page.locator('.ccn-landing-sidebar').count() === 0);
ok('Zubehoer product grid', await page.locator('.ccn-featured li.product').count() === 4);
ok('Zubehoer info cards', await page.locator('.ccn-info-card').count() === 3);
ok('Zubehoer numbered list', await page.locator('.ccn-numbered-item').count() === 4);
ok('Zubehoer CTA banner with button', await page.locator('.ccn-cta .btn').count() === 1);
ok('Zubehoer has no flexible sections', await page.locator('.section-hero, .section-text, .section-cta').count() === 0);

// Pilot landing migrated to blocks (T-30a): hero band, sidebar, form card
const respMieten = await page.goto(BASE + '/container-mieten/', { waitUntil: 'domcontentloaded' });
ok('Mieten landing 200', respMieten.status() === 200, String(respMieten.status()));
ok('Mieten hero band from featured image', await page.evaluate(() => {
	const img = document.querySelector('.ccn-page-hero img.ccn-page-hero-img');
	return !!img && img.getAttribute('fetchpriority') === 'high'
		&& document.querySelectorAll('.ccn-page-hero h1.ccn-page-hero-title').length === 1;
}));
ok('Mieten sidebar links exclude current page', await page.evaluate(() => {
	const links = [...document.querySelectorAll('.ccn-sidebar-services-list a')];
	return links.length >= 3 && !links.some((a) => (a.getAttribute('href') || '').includes('/container-mieten/'));
}));
ok('Mieten anfrage card + inline form', await page.locator('.ccn-sidebar-card .btn-dark').count() === 1
	&& await page.locator('.ccn-form-card form.wpcf7-form').count() === 1);
ok('Mieten text-section with accent', await page.locator('.ccn-text-section .ccn-accent-inline').count() === 1);
ok('Mieten has no flexible sections', await page.locator('.section-hero, .section-text, .section-cta').count() === 0);
ok('Mieten no raw shortcode leak', await page.evaluate(() => !document.body.textContent.includes('[/acceptance]') && !document.body.textContent.includes('u003c')));

// Text landings migrated to blocks (T-30c): full width, hero band, CTA,
// zero flexible-content markup anywhere. After this batch NO page uses
// template-sections.php — the .section-hero guard below proves it per page.
const textLandings = [
	'/sanitaercontainer-alles-was-sie-wissen-muessen/',
	'/container-services/',
	'/nachhaltige-containerloesungen-ihr-partner-fuer-umweltfreundliche-container/',
	'/container-inspiration-ideen/',
	'/ueber-uns/',
];
for (const slug of textLandings) {
	const resp = await page.goto(BASE + slug, { waitUntil: 'domcontentloaded' });
	const name = slug.split('-')[0].replace('/', '');
	ok(`Landing ${slug} 200`, resp.status() === 200, String(resp.status()));
	ok(`Landing ${slug} full width with hero`, await page.locator('.ccn-landing-full').count() === 1
		&& await page.locator('.ccn-page-hero h1.ccn-page-hero-title').count() === 1
		&& await page.locator('.ccn-landing-sidebar').count() === 0);
	ok(`Landing ${slug} CTA banner`, await page.locator('.ccn-cta .btn').count() === 1);
	ok(`Landing ${slug} no flexible sections`, await page.locator('.section-hero, .section-text, .section-cta').count() === 0);
	ok(`Landing ${slug} no raw markup leak`, await page.evaluate(() => !document.body.textContent.includes('u003c') && !document.body.textContent.includes('<p>')));
}
ok('Sanitaer type cards', (await (async () => {
	await page.goto(BASE + '/sanitaercontainer-alles-was-sie-wissen-muessen/', { waitUntil: 'domcontentloaded' });
	return page.locator('.ccn-info-card').count();
})()) === 4);
ok('Inspiration stats + idea cards', (await (async () => {
	await page.goto(BASE + '/container-inspiration-ideen/', { waitUntil: 'domcontentloaded' });
	return (await page.locator('.ccn-stats').count()) === 1 && (await page.locator('.ccn-info-card').count()) === 7;
})()));

// Contact form renders on the contact page; CF7 assets are page-scoped
const respKontakt = await page.goto(BASE + '/kontakt-beratung/', { waitUntil: 'domcontentloaded' });
ok('Contact page 200', respKontakt.status() === 200, String(respKontakt.status()));
ok('Contact form renders', (await page.locator('form.wpcf7-form input[name="your-name"]').count()) === 1);
ok('Submit button present', (await page.locator('form.wpcf7-form .wpcf7-submit').count()) === 1);

// CF7 JS must NOT load on pages without a form (home)
await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
ok('No CF7 JS on home', (await page.locator('script[src*="contact-form-7"]').count()) === 0);

// 404 status for a missing page
const resp404 = await page.goto(BASE + '/there-is-no-such-page-xyz/', { waitUntil: 'domcontentloaded' });
ok('Missing page returns 404', resp404.status() === 404, String(resp404.status()));

// Search renders
const respSearch = await page.goto(BASE + '/?s=test', { waitUntil: 'domcontentloaded' });
ok('Search responds 200', respSearch.status() === 200, String(respSearch.status()));

// REST user enumeration closed for anonymous visitors
const restStatus = await page.evaluate(async (base) => {
	const r = await fetch(base + '/wp-json/wp/v2/users', { credentials: 'omit' });
	return r.status;
}, BASE);
ok('REST /wp/v2/users closed (404)', restStatus === 404, String(restStatus));

// Shop sorting is the only catalogue "filter" control on this site (no attribute
// filters): a server-side ?orderby= must change the order, not just return 200.
// Added 19.09.2026 together with the forms block below (user request: filters +
// forms on every site).
const idsOf = () => page.$$eval('li.product', (els) => els.map((e) => (e.className.match(/post-(\d+)/) || [])[1]).filter(Boolean));
await page.goto(BASE + '/container-shop/', { waitUntil: 'domcontentloaded' });
const idsDefault = await idsOf();
const respSorted = await page.goto(BASE + '/container-shop/?orderby=price-desc', { waitUntil: 'domcontentloaded' });
const idsSorted = await idsOf();
ok('Shop sorting control present', await page.locator('form.woocommerce-ordering select[name="orderby"]').count() === 1);
ok('Shop ?orderby=price-desc changes order', respSorted.status() === 200 && idsSorted.length > 0 && idsSorted[0] !== idsDefault[0],
	`default first=${idsDefault[0]}, sorted first=${idsSorted[0]}`);

// Forms: render-level only, no submissions. CF7 6.x posts through
// /wp-json/contact-form-7/v1/ — a missing route (404) kills every form silently,
// so the anonymous GET must answer 401/403.
await page.goto(BASE + '/kontakt-beratung/', { waitUntil: 'domcontentloaded' });
ok('Kontakt: CF7 form visible', await page.locator('form.wpcf7-form').first().isVisible());
ok('Kontakt: submit control', await page.locator('form.wpcf7-form .wpcf7-submit').count() >= 1);
const cf7Rest = await fetch(BASE + '/wp-json/contact-form-7/v1/contact-forms');
ok('CF7 REST route exists (401/403, not 404)', [401, 403].includes(cf7Rest.status), String(cf7Rest.status));

// Comments off site-wide (inc/disable-comments.php, parity with production K40).
// The newest published post is picked via REST so the check survives content changes.
const latestPost = await (await fetch(BASE + '/wp-json/wp/v2/posts?per_page=1&_fields=link')).json();
const postUrl = (Array.isArray(latestPost) && latestPost[0] && latestPost[0].link) || BASE + '/gebrauchte-seecontainer-in-cuxhaven/';
const postResp = await fetch(postUrl);
const postHtml = await postResp.text();
ok('Post: no comment form or comments area', postResp.status === 200
	&& !postHtml.includes('comment-respond') && !postHtml.includes('comments-area'),
	`${postResp.status} ${postUrl}`);
const commentsRest = await fetch(BASE + '/wp-json/wp/v2/comments');
ok('REST /wp/v2/comments closed (not 200)', commentsRest.status !== 200, String(commentsRest.status));

// XML-RPC off (inc/security.php): methods that need a login answer fault 405
// before any password check. system.listMethods is not a usable probe: the
// introspection methods stay listed even with XML-RPC disabled.
const xmlrpc = await fetch(BASE + '/xmlrpc.php', {
	method: 'POST',
	headers: { 'Content-Type': 'text/xml' },
	body: '<?xml version="1.0"?><methodCall><methodName>wp.getUsersBlogs</methodName><params>'
		+ '<param><value><string>smoke-probe</string></value></param>'
		+ '<param><value><string>x</string></value></param></params></methodCall>',
});
const xmlrpcBody = await xmlrpc.text();
ok('XML-RPC POST answers faultCode 405 (disabled)', xmlrpcBody.includes('faultCode') && /<int>405<\/int>/.test(xmlrpcBody),
	(xmlrpcBody.match(/<int>(-?\d+)<\/int>/) || [])[1] || 'no faultCode');

// oEmbed discovery links removed from wp_head (checked on the post: singular only).
ok('wp_head without json+oembed link', !postHtml.includes('json+oembed'));

// Structure invariants (T-44), one page per template type. Each page must answer
// with its own status (a renamed slug would otherwise test 404.php instead) and
// render exactly one <header>, <main>, <footer> and <h1>; no <header> inside
// <main>; every <nav> named by aria-label/aria-labelledby, never "...navigation"
// (screen readers add the role); heading levels of theme markup never skip —
// editor content (.entry-content, .rich-text, WooCommerce tab panels) is content,
// not theme, and is left out; main#content takes focus from the skip link;
// anchor targets clear the sticky header. A new page template adds its page here.
const structurePages = [
	['/', 200], // front page (blocks)
	['/container-kaufen/', 200], // landing with sidebar + product grid
	['/container-mieten/', 200], // landing with sidebar
	['/containerzubehoer/', 200], // landing full width
	['/datenschutzerklaerung/', 200], // default page.php
	['/gebrauchte-seecontainer-in-cuxhaven/', 200], // single post
	['/nachrichten-trends-aus-der-containerwelt/', 200], // blog index (home.php)
	['/container-shop/', 200], // shop
	['/product-category/cointainer/kuehlcontainer/', 200], // product category
	['/product/20-fuss-container-gebraucht/', 200], // single product
	['/?s=container', 200], // search results
	['/kein-solcher-pfad/', 404], // 404.php
];
for (const [path, status] of structurePages) {
	const resp = await page.goto(BASE + path, { waitUntil: 'domcontentloaded' });
	const s = await page.evaluate(() => {
		const count = (sel) => document.querySelectorAll(sel).length;
		const navName = (nav) => (nav.getAttribute('aria-label') || '').trim()
			|| (nav.getAttribute('aria-labelledby') || '').split(/\s+/).filter(Boolean)
				.map((id) => ((document.getElementById(id) || {}).textContent || '').trim()).join(' ').trim();
		const badNavs = [...document.querySelectorAll('nav')]
			.filter((n) => !navName(n) || /navigation/i.test(navName(n)))
			.map((n) => `${n.id || n.className || 'nav'} "${navName(n)}"`);
		const jumps = [];
		let prev = 0;
		for (const h of document.querySelectorAll('h1, h2, h3, h4, h5, h6')) {
			if (h.closest('.entry-content, .rich-text, .woocommerce-Tabs-panel')) continue;
			const level = Number(h.tagName[1]);
			if (level > prev + 1) jumps.push(`h${prev}->h${level} "${h.textContent.trim().slice(0, 40)}"`);
			prev = level;
		}
		return {
			header: count('header'), main: count('main'), footer: count('footer'), h1: count('h1'),
			headerInMain: count('main header'), badNavs, jumps,
			mainFocusable: count('main#content[tabindex="-1"]'),
			scrollPad: getComputedStyle(document.documentElement).scrollPaddingTop,
		};
	});
	ok(`Structure ${path}: HTTP ${status}`, resp.status() === status, String(resp.status()));
	ok(`Structure ${path}: one <header>`, s.header === 1, String(s.header));
	ok(`Structure ${path}: one <main>`, s.main === 1, String(s.main));
	ok(`Structure ${path}: one <footer>`, s.footer === 1, String(s.footer));
	ok(`Structure ${path}: one <h1>`, s.h1 === 1, String(s.h1));
	ok(`Structure ${path}: no <header> inside <main>`, s.headerInMain === 0, String(s.headerInMain));
	ok(`Structure ${path}: every <nav> named, not "navigation"`, s.badNavs.length === 0, s.badNavs.join(', '));
	ok(`Structure ${path}: heading levels never skip (theme markup)`, s.jumps.length === 0, s.jumps.join(', '));
	ok(`Structure ${path}: main#content[tabindex="-1"]`, s.mainFocusable === 1, String(s.mainFocusable));
	ok(`Structure ${path}: scroll-padding-top clears the header`, s.scrollPad !== 'auto' && parseFloat(s.scrollPad) > 0, s.scrollPad);
}

// Every registered block prints the editor's HTML anchor as id on its root
// <section> (T-44). Code-level: no stored content carries an anchor to test with.
const themeDir = new URL('../', import.meta.url);
const blockTemplates = [...readFileSync(new URL('blocks/acf-blocks.php', themeDir), 'utf8')
	.matchAll(/'template'\s*=>\s*'(blocks\/[^']+\.php)'/g)].map((m) => m[1]);
const anchorless = blockTemplates.filter((t) => {
	const root = readFileSync(new URL(t, themeDir), 'utf8').split('\n').find((l) => l.includes('<section'));
	return !root || !root.includes("$block['anchor']");
});
ok('Every block root prints the HTML anchor', blockTemplates.length >= 12 && anchorless.length === 0,
	`${blockTemplates.length - anchorless.length}/${blockTemplates.length}${anchorless.length ? ' missing: ' + anchorless.join(', ') : ''}`);

// Design tokens (T-45, DESIGN.md): one type scale on every page type (sizes read
// with getComputedStyle at 360 and 1440), links and the current menu item on the
// contrast-checked tokens, no raw hex outside :root, and the text tokens meeting
// WCAG AA on the backgrounds they are documented for.
const { ratio } = createRequire(import.meta.url)('./contrast.cjs');
const themeCss = readFileSync(new URL('assets/css/theme.css', themeDir), 'utf8');
const narrow = await browser.newPage({ viewport: { width: 360, height: 800 } });
const wide = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const h1Size = async (p, path) => {
	await p.goto(BASE + path, { waitUntil: 'load' });
	return p.evaluate(() => getComputedStyle(document.querySelector('h1')).fontSize);
};
const wideH1 = [];
for (const path of ['/', '/container-kaufen/', '/kontakt-beratung/', '/product/20-fuss-container-gebraucht/']) {
	const size = await h1Size(narrow, path);
	ok(`Type scale ${path}: h1 is 32px at 360`, size === '32px', size);
	wideH1.push(`${await h1Size(wide, path)}`);
}
ok('Type scale: h1 one formula at 1440 (<= 52px)', new Set(wideH1).size === 1 && parseFloat(wideH1[0]) <= 52, wideH1.join(', '));
await narrow.goto(BASE + '/', { waitUntil: 'load' });
await wide.goto(BASE + '/', { waitUntil: 'load' });
const sectionH2 = (p) => p.evaluate(() => [...new Set([...document.querySelectorAll('main section h2:not(.woocommerce-loop-product__title)')]
	.map((h) => getComputedStyle(h).fontSize))]);
const [h2Narrow, h2Wide] = [await sectionH2(narrow), await sectionH2(wide)];
ok('Type scale: section h2 one formula (26px at 360, 40px at 1440)', h2Narrow.join() === '26px' && h2Wide.join() === '40px', `${h2Narrow} / ${h2Wide}`);
const [bodyNarrow, bodyWide] = [await narrow.evaluate(() => getComputedStyle(document.body).fontSize), await wide.evaluate(() => getComputedStyle(document.body).fontSize)];
ok('Type scale: body 16px at 360, 18px at 1440', bodyNarrow === '16px' && bodyWide === '18px', `${bodyNarrow} / ${bodyWide}`);
const currentItem = await wide.evaluate(() => {
	const a = document.querySelector('.site-menu > li.current-menu-item > a');
	if (!a) return null;
	const bar = getComputedStyle(a, '::before');
	return { color: getComputedStyle(a).color, bar: bar.backgroundColor, height: bar.height };
});
ok('Menu current item: dark text + yellow bar, not yellow text', !!currentItem && currentItem.color === 'rgb(32, 32, 32)'
	&& currentItem.bar === 'rgb(247, 198, 0)' && currentItem.height === '3px', JSON.stringify(currentItem));
await wide.goto(BASE + '/kontakt-beratung/', { waitUntil: 'load' });
const contentLinks = await wide.evaluate(() => [...document.querySelectorAll('.entry-content a:not(.btn):not(.button)')]
	.map((a) => `${getComputedStyle(a).color}|${getComputedStyle(a).textDecorationLine}`));
ok('Content links: link token (#202020), underlined', contentLinks.length >= 1 && contentLinks.every((l) => l === 'rgb(32, 32, 32)|underline'),
	[...new Set(contentLinks)].join(', '));
await narrow.close();
await wide.close();
const cssOutsideRoot = themeCss.replace(/\/\*[\s\S]*?\*\//g, '').replace(/:root\{[^}]*\}/g, '');
const rawHex = cssOutsideRoot.match(/#[0-9a-fA-F]{3,8}\b/g) || [];
ok('theme.css: no raw hex outside :root', rawHex.length === 0, rawHex.join(' '));
const colourTokens = Object.fromEntries([...themeCss.matchAll(/--(ccn-color-[a-z-]+):(#[0-9a-fA-F]{3,6})\b/g)].map((m) => [m[1], m[2]]));
const lightBgs = [colourTokens['ccn-color-white'], colourTokens['ccn-color-light']];
const weakTokens = [];
for (const [name, bgs, need] of [
	['ccn-color-text', [...lightBgs, colourTokens['ccn-color-primary']], 4.5],
	['ccn-color-secondary', lightBgs, 4.5],
	['ccn-color-primary-text-strong', lightBgs, 4.5],
	['ccn-color-accent-text', lightBgs, 4.5],
	['ccn-color-primary-text', lightBgs, 3], // large text only
	['ccn-color-text-on-dark', [colourTokens['ccn-color-dark']], 4.5],
	['ccn-color-text-on-dark-muted', [colourTokens['ccn-color-dark']], 4.5],
]) {
	for (const bg of bgs) {
		const r = colourTokens[name] && bg ? ratio(colourTokens[name], bg) : 0;
		if (!(r >= need)) weakTokens.push(`${name} on ${bg} ${r.toFixed(2)}:1`);
	}
}
ok('Text tokens meet WCAG AA on their backgrounds', Object.keys(colourTokens).length >= 14 && weakTokens.length === 0,
	weakTokens.join(', ') || `${Object.keys(colourTokens).length} colour tokens`);

// Editor parity (T-45): theme.json hands the tokens to Gutenberg — palette hex equal
// to the colour tokens, size/family/spacing presets as references to existing tokens,
// layout widths equal to the container tokens. The front end prints no global-styles;
// theme.css carries every preset class the editor can add.
const tj = JSON.parse(readFileSync(new URL('theme.json', themeDir), 'utf8')).settings || {};
const hexOf = (v) => String(v || '').toLowerCase().replace(/^#(.)(.)(.)$/, '#$1$1$2$2$3$3');
const palette = (tj.color && tj.color.palette) || [];
const paletteDrift = palette.filter((c) => hexOf(colourTokens[c.slug.replace(/^ccn-/, 'ccn-color-')]) !== hexOf(c.color)).map((c) => c.slug);
ok('theme.json: 8 palette colours = theme.css tokens, no custom/default colours or gradients', palette.length === 8 && paletteDrift.length === 0
	&& tj.color.custom === false && tj.color.defaultPalette === false && tj.color.customGradient === false && (tj.color.gradients || []).length === 0,
	paletteDrift.join(', ') || `${palette.length} colours`);
const typo = tj.typography || {};
const presetRefs = [...(typo.fontSizes || []).map((f) => f.size), ...(typo.fontFamilies || []).map((f) => f.fontFamily),
	...((tj.spacing && tj.spacing.spacingSizes) || []).map((x) => x.size)];
const badRefs = presetRefs.filter((v) => {
	const m = /^var\(--(ccn-[a-z0-9-]+)\)$/.exec(v);
	return !m || !themeCss.includes(`--${m[1]}:`);
});
ok('theme.json: size/family/spacing presets reference theme.css tokens', presetRefs.length === 17 && badRefs.length === 0,
	badRefs.join(', ') || `${presetRefs.length} presets`);
const tokenValue = (name) => (themeCss.match(new RegExp(`--${name}:([^;}]+)`)) || [])[1];
ok('theme.json: layout widths = container tokens', !!tj.layout && tj.layout.contentSize === tokenValue('ccn-container-prose')
	&& tj.layout.wideSize === tokenValue('ccn-container'), `${tj.layout && tj.layout.contentSize} / ${tj.layout && tj.layout.wideSize}`);
const kebab = (slug) => slug.replace(/([a-z])(\d)/g, '$1-$2'); // WordPress: h3 -> h-3
const presetClasses = [...palette.flatMap((c) => [`.has-${c.slug}-color{`, `.has-${c.slug}-background-color{`]),
	...(typo.fontSizes || []).map((f) => `.has-${kebab(f.slug)}-font-size{`), ...(typo.fontFamilies || []).map((f) => `.has-${f.slug}-font-family{`)];
const missingClasses = presetClasses.filter((c) => !themeCss.includes(c));
ok('theme.css carries every editor preset class', missingClasses.length === 0, missingClasses.join(' ') || `${presetClasses.length} classes`);
const homeHtml = await (await fetch(`${BASE}/?cb=${Date.now()}`)).text();
ok('Front end prints no global-styles (theme.css is the source)', !/id=['"](global-styles|wp-global-styles-placeholder|classic-theme-styles)-inline-css['"]/.test(homeHtml));

// Iframe block editor (T-45): every ACF block registers as v3 without the inline edit
// mode; theme.css plus editor.css style the canvas, editor.css never reaches the front
// end. Code-level: the editor itself needs a login (checked by the T-45 editor probe).
const themeFile = (rel) => { try { return readFileSync(new URL(rel, themeDir), 'utf8'); } catch { return ''; } };
const registry = themeFile('blocks/acf-blocks.php');
const functionsPhp = themeFile('functions.php');
ok('ACF blocks register as v3 (api_version, acf_block_version), no inline edit mode',
	/'api_version'\s*=>\s*3,/.test(registry) && /'acf_block_version'\s*=>\s*3,/.test(registry) && /'mode'\s*=>\s*false,/.test(registry));
ok('Block editor styles: theme.css + editor.css, editor.css not on the front end', /add_theme_support\(\s*'editor-styles'\s*\)/.test(functionsPhp)
	&& /add_editor_style\(\s*array\(\s*'assets\/css\/theme\.css',\s*'assets\/css\/editor\.css'\s*\)\s*\)/.test(functionsPhp)
	&& themeFile('assets/css/editor.css').includes('[data-type^="acf/"]{max-width:none}') && !homeHtml.includes('assets/css/editor.css'));
ok('html5 theme support without the dead "style" argument (WP 7.0)', /add_theme_support\(\s*'html5'/.test(functionsPhp)
	&& !/add_theme_support\(\s*'html5',[^;]*'style'/.test(functionsPhp));

// Motion invariants (T-46, DESIGN.md "Motion"). Scrolls are instant: smooth
// scrolling (no-preference) would still be moving when the check runs.
const mainJs = themeFile('assets/js/main.js');
const jump = (p, y) => p.evaluate((yy) => window.scrollTo({ top: yy, behavior: 'instant' }), y);
const motionTargets = '[data-motion], [data-motion-stagger] > *';
const motionState = (p) => p.evaluate((sel) => {
	const op = (e) => parseFloat(getComputedStyle(e).opacity);
	const t = [...document.querySelectorAll(sel)];
	return {
		motionClass: document.documentElement.classList.contains('ccn-motion'), total: t.length,
		withoutIsIn: document.querySelectorAll('[data-motion]:not(.is-in), [data-motion-stagger]:not(.is-in)').length,
		belowOne: t.filter((e) => op(e) < 1).length, faint: t.filter((e) => op(e) < 0.05).length,
		counters: [...document.querySelectorAll('.ccn-stat-number[data-target]')].map((e) => {
			const dec = (e.dataset.target.split('.')[1] || '').length;
			const want = parseFloat(e.dataset.target).toLocaleString('de-DE', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + (e.dataset.suffix || '');
			return { text: e.textContent.trim(), want, zero: !(parseFloat(e.dataset.target) > 0) };
		}),
	};
}, motionTargets);
const countersFinal = (s) => s.counters.length >= 3 && s.counters.every((c) => c.text === c.want && !c.zero);
// Classify at load (first block of a landing sits in the first viewport, every block of the
// front page below it): blocks in view are .is-in and fully visible, blocks below are hidden.
const loadSplit = (p) => p.evaluate(() => {
	const vh = window.innerHeight;
	const op = (e) => parseFloat(getComputedStyle(e).opacity);
	const kids = (el) => (el.hasAttribute('data-motion-stagger') ? [...el.children] : [el]);
	const targets = [...document.querySelectorAll('[data-motion], [data-motion-stagger]')];
	const above = targets.filter((e) => e.getBoundingClientRect().top < vh);
	const below = targets.filter((e) => e.getBoundingClientRect().top >= vh);
	return {
		above: above.length, below: below.length,
		aboveHidden: above.filter((e) => !e.classList.contains('is-in') || e.classList.contains('is-anim') || kids(e).some((k) => op(k) < 1)).length,
		belowShown: below.filter((e) => e.classList.contains('is-in') || kids(e).some((k) => op(k) > 0)).length,
	};
});
await page.goto(BASE + '/container-kaufen/', { waitUntil: 'load' });
const splitKaufen = await loadSplit(page);
await page.goto(BASE + '/', { waitUntil: 'load' });
const splitHome = await loadSplit(page);
ok('Motion: at load blocks in view stay visible (.is-in), blocks below the fold start hidden',
	splitKaufen.above >= 1 && splitKaufen.aboveHidden === 0 && splitHome.below >= 7 && splitHome.belowShown === 0
	&& (await motionState(page)).motionClass, `kaufen ${JSON.stringify(splitKaufen)}, home ${JSON.stringify(splitHome)}`);
const lcpMoving = await page.evaluate(() => {
	const els = [...document.querySelectorAll('.ccn-hero, .ccn-hero img, .ccn-contact-cards, #header')];
	return { n: els.length, bad: els.filter((e) => e.closest('[data-motion], [data-motion-stagger] > *') || getComputedStyle(e).opacity !== '1')
		.map((e) => e.className || e.tagName) };
});
ok('Motion: hero, hero image, contact cards and header carry no data-motion, opacity 1 after load', lcpMoving.n >= 4 && lcpMoving.bad.length === 0,
	lcpMoving.bad.join(', ') || `${lcpMoving.n} elements`);
await jump(page, 300);
await page.waitForTimeout(200);
const isStuck = () => page.evaluate(() => { const h = document.getElementById('header'); return h ? h.classList.contains('is-stuck') : 'no #header'; });
const stuckAt300 = await isStuck();
await jump(page, 0);
await page.waitForTimeout(200);
const stuckAt0 = await isStuck();
ok('Motion: #header.is-stuck after scrollTo(0, 300), gone at 0 (sentinel)', stuckAt300 === true && stuckAt0 === false
	&& await page.locator('body > .ccn-header-sentinel[aria-hidden="true"]').count() === 1, `300: ${stuckAt300}, 0: ${stuckAt0}`);
ok('Motion: main.js has no scroll listener', mainJs.length > 0 && !/addEventListener\(\s*['"]scroll['"]/.test(mainJs));
// Counters: the HTML carries the final number; on reveal it counts up from 0 and lands on
// the same text, once (scrolling away and back does not restart it). The first frame in which
// a number changes must find its item still fading in (opacity < 0.5): the drop to 0 is never
// seen (A1 F15 — the old code reset a fully visible number).
const counterTexts = () => page.evaluate(() => [...document.querySelectorAll('.ccn-stat-number')].map((e) => e.textContent.trim()));
const countersAtLoad = await counterTexts();
const counterStart = await page.evaluate(() => new Promise((resolve) => {
	const nums = [...document.querySelectorAll('.ccn-stat-number')];
	const grid = document.querySelector('.ccn-stats-grid');
	if (!nums.length || !grid) return resolve(null);
	const finals = nums.map((n) => n.textContent.trim());
	grid.scrollIntoView({ block: 'center', behavior: 'instant' });
	const t0 = performance.now();
	const poll = () => {
		const i = nums.findIndex((n, k) => n.textContent.trim() !== finals[k]);
		if (i >= 0) return resolve({ text: nums[i].textContent.trim(), opacity: parseFloat(getComputedStyle(nums[i].closest('.ccn-stat') || nums[i]).opacity) });
		if (performance.now() - t0 > 3000) return resolve(null);
		requestAnimationFrame(poll);
	};
	requestAnimationFrame(poll);
}));
await page.waitForTimeout(1500);
const countersDone = await counterTexts();
await jump(page, 0);
await page.waitForTimeout(100);
await page.evaluate(() => document.querySelector('.ccn-stats-grid').scrollIntoView({ block: 'center', behavior: 'instant' }));
await page.waitForTimeout(150);
const countersAgain = await counterTexts();
ok('Motion: counters count up once, hidden while they drop to 0, and land on the HTML value', countersAtLoad.length >= 3
	&& !!counterStart && counterStart.opacity < 0.5
	&& countersDone.join('|') === countersAtLoad.join('|') && countersAgain.join('|') === countersAtLoad.join('|'),
	`${countersAtLoad} -> first change ${JSON.stringify(counterStart)} -> ${countersDone} -> ${countersAgain}`);
// (c) Scroll the whole page in 600px steps: reveal animations run, afterwards every block is
// .is-in and fully visible (A6 probe: nothing left below opacity 0.05).
await page.goto(BASE + '/', { waitUntil: 'load' });
const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
let revealsPlaying = 0;
for (let y = 600; y < pageHeight + 600; y += 600) {
	await jump(page, y);
	await page.waitForTimeout(150);
	revealsPlaying = Math.max(revealsPlaying, await page.evaluate(() => document.getAnimations().filter((a) => a.animationName === 'ccn-reveal').length));
}
await jump(page, 0);
await page.waitForTimeout(1200);
const afterScroll = await motionState(page);
ok('Motion: reveal animations play while scrolling (ccn-reveal)', revealsPlaying > 0, `max ${revealsPlaying} at once`);
ok('Motion: after a full scroll every block is .is-in and fully visible', afterScroll.total >= 20 && afterScroll.withoutIsIn === 0
	&& afterScroll.belowOne === 0 && afterScroll.faint === 0, JSON.stringify({ ...afterScroll, counters: undefined }));
// (a) prefers-reduced-motion: no motion class, nothing hidden, counters static, transitions cut.
const rmPage = await browser.newPage({ reducedMotion: 'reduce' });
await rmPage.goto(BASE + '/', { waitUntil: 'load' });
const rmLoad = await motionState(rmPage);
await jump(rmPage, pageHeight);
await rmPage.waitForTimeout(300);
const rmBottom = await motionState(rmPage);
const rmTransition = await rmPage.evaluate(() => parseFloat(getComputedStyle(document.querySelector('.btn')).transitionDuration));
ok('Motion (reduced motion): no html.ccn-motion, nothing hidden, counters show final values', !rmLoad.motionClass && rmLoad.total >= 20
	&& rmLoad.belowOne === 0 && rmBottom.belowOne === 0 && countersFinal(rmBottom), JSON.stringify({ ...rmBottom, counters: rmBottom.counters.map((c) => c.text) }));
ok('Motion (reduced motion): transitions cut to 0.01ms', rmTransition < 0.001, `${rmTransition}s`);
await rmPage.close();
// (b) main.js blocked: content is visible and the counters show the final numbers, not 0.
const noJs = await browser.newPage();
await noJs.route('**/assets/js/main.js*', (r) => r.abort());
await noJs.goto(BASE + '/', { waitUntil: 'load' });
const noJsState = await motionState(noJs);
ok('Motion (main.js blocked): nothing hidden, counters show final numbers', !noJsState.motionClass && noJsState.total >= 20
	&& noJsState.belowOne === 0 && countersFinal(noJsState), JSON.stringify({ ...noJsState, counters: noJsState.counters.map((c) => c.text) }));
await noJs.close();
// Code level: every block below the hero reveals, the first-screen blocks never do; grids stagger.
const motionNever = ['home-hero', 'contact-cards'];
const motionStagger = ['featured-products', 'services', 'stats', 'info-cards', 'numbered-list', 'news'];
const blockName = (t) => t.split('/').pop().replace('.php', '');
const badMotionRoots = blockTemplates.filter((t) => {
	const root = themeFile(t).split('\n').find((l) => l.includes('<section')) || '';
	return motionNever.includes(blockName(t)) ? root.includes('data-motion') : !root.includes('data-motion="reveal"');
});
const missingStagger = motionStagger.filter((n) => !themeFile(blockTemplates.find((t) => blockName(t) === n) || '').includes('data-motion-stagger'));
const staticMotion = ['template-parts/page-hero.php', 'header.php', 'footer.php'].filter((f) => themeFile(f).includes('data-motion'));
ok('Motion: data-motion="reveal" on every block root except home-hero/contact-cards; grids stagger',
	blockTemplates.length >= 12 && badMotionRoots.length === 0 && missingStagger.length === 0 && staticMotion.length === 0,
	[...badMotionRoots, ...missingStagger, ...staticMotion].join(', ') || `${blockTemplates.length - motionNever.length} reveal, ${motionStagger.length} stagger`);
// (d) Transitions: never "all", durations only from the motion tokens (the reduced-motion
// override is the one literal value).
const cssNoComments = themeCss.replace(/\/\*[\s\S]*?\*\//g, '');
const transitionDecls = cssNoComments.replace(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{[^{}]*\{[^}]*\}\s*\}/g, '')
	.match(/transition(?:-duration|-delay)?\s*:[^;}]+/g) || [];
const rawDurations = transitionDecls.filter((d) => /(?<![\w-])\d*\.?\d+m?s\b/.test(d.replace(/var\([^)]*\)/g, '')));
ok('theme.css: no "transition: all", every duration a motion token', !/transition(-property)?\s*:\s*all\b/.test(themeCss)
	&& transitionDecls.length >= 5 && rawDurations.length === 0, rawDurations.join(' | ') || `${transitionDecls.length} declarations`);
// Hover/focus on the tokens: cards lift 2px with --ccn-shadow-3, menu bar grows in, service texts
// visible without hover (F7), mobile menu animates open and closes at once.
const deskPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await deskPage.goto(BASE + '/', { waitUntil: 'load' });
const serviceTexts = await deskPage.evaluate(() => [...document.querySelectorAll('.ccn-service-text')]
	.map((e) => `${getComputedStyle(e).opacity}/${e.offsetHeight > 0}/${getComputedStyle(e).maxHeight}`));
ok('Services: texts visible at 1440 without hover (no max-height:0/opacity:0)', serviceTexts.length === 4
	&& serviceTexts.every((s) => s === '1/true/none'), serviceTexts.join(', '));
await deskPage.evaluate(() => document.querySelector('.ccn-news-grid').scrollIntoView({ block: 'center', behavior: 'instant' }));
await deskPage.waitForTimeout(1100);
await deskPage.hover('.ccn-news-card');
await deskPage.waitForTimeout(350);
const cardHover = await deskPage.evaluate(() => {
	const s = getComputedStyle(document.querySelector('.ccn-news-card'));
	const b = getComputedStyle(document.querySelector('.btn'));
	return { transform: s.transform, shadow: s.boxShadow, btn: `${b.transitionProperty}|${b.transitionDuration}|${b.transitionTimingFunction}` };
});
ok('Hover: card lifts 2px with --ccn-shadow-3; .btn transitions listed, 200ms, ease-out token',
	cardHover.transform === 'matrix(1, 0, 0, 1, 0, -2)' && cardHover.shadow.includes('0px 8px 24px')
	&& cardHover.btn === 'color, background-color, border-color, box-shadow, transform|0.2s|cubic-bezier(0.2, 0.7, 0.2, 1)', JSON.stringify(cardHover));
await jump(deskPage, 0);
const barOf = (sel) => deskPage.evaluate((s) => getComputedStyle(document.querySelector(s), '::before').transform, sel);
const menuItem = '.site-menu > li:not(.current-menu-item):not(.current-menu-ancestor) > a';
const barRest = await barOf(menuItem);
await deskPage.hover(menuItem);
await deskPage.waitForTimeout(350);
const barHover = await barOf(menuItem);
ok('Hover: main menu bar grows in (scaleX 0 -> 1)', barRest === 'matrix(0, 0, 0, 1, 0, 0)' && barHover === 'none', `${barRest} -> ${barHover}`);
await deskPage.close();
const mobMenu = await browser.newPage({ viewport: { width: 375, height: 720 } });
await mobMenu.goto(BASE + '/', { waitUntil: 'load' });
await mobMenu.click('.nav-toggle');
const menuOpen = await mobMenu.evaluate(() => document.getElementById('site-nav').getAnimations().map((a) => a.transitionProperty).sort().join(','));
await mobMenu.keyboard.press('Escape');
const menuClosed = await mobMenu.evaluate(() => getComputedStyle(document.getElementById('site-nav')).display);
ok('Mobile menu: opens with an opacity/transform transition, closes at once', menuOpen === 'opacity,transform' && menuClosed === 'none', `${menuOpen} / ${menuClosed}`);
await mobMenu.close();
// Rail (.ccn-rail): the news cards form a scroll-snap row below 64rem with working prev/next
// buttons (44x44, named), a 4-column grid from 64rem; never a horizontal page scroll.
const railPage = await browser.newPage({ viewport: { width: 360, height: 800 } });
await railPage.goto(BASE + '/', { waitUntil: 'load' });
const railState = () => railPage.evaluate(() => {
	const r = document.querySelector('.ccn-news .ccn-rail');
	const nav = r && r.parentElement.querySelector('.ccn-rail-nav');
	const btns = nav ? [...nav.querySelectorAll('.ccn-rail-btn')] : [];
	return r ? {
		scrolls: r.scrollWidth > r.clientWidth + 10, left: Math.round(r.scrollLeft),
		snap: `${getComputedStyle(r).scrollSnapType}|${getComputedStyle(r.firstElementChild).scrollSnapAlign}`,
		nav: nav ? `${getComputedStyle(nav).visibility}|${getComputedStyle(nav).display}` : 'none',
		names: btns.map((b) => b.textContent.trim()).join('|'), sizes: btns.map((b) => `${b.offsetWidth}x${b.offsetHeight}`).join('|'),
		pageScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth,
	} : null;
});
const railClick = (dir) => railPage.evaluate((d) => { const b = document.querySelector(`.ccn-news .ccn-rail-btn[data-dir="${d}"]`); if (b) b.click(); }, dir);
const rail360 = await railState();
await railClick(1);
await railPage.waitForTimeout(800);
const railNext = await railState();
await railClick(-1);
await railPage.waitForTimeout(800);
const railBack = await railState();
ok('Rail: news is a scroll-snap row at 360, Weiter/Zurück scroll it, no page scroll', !!rail360 && rail360.scrolls
	&& rail360.snap === 'x mandatory|start' && rail360.nav === 'visible|block' && rail360.names === '‹Zurück|›Weiter'
	&& rail360.sizes === '44x44|44x44' && !rail360.pageScroll && rail360.left === 0 && railNext && railNext.left > 100 && railBack && railBack.left === 0,
	JSON.stringify({ rail360, next: railNext && railNext.left, back: railBack && railBack.left }));
await railPage.setViewportSize({ width: 1440, height: 900 });
await railPage.waitForTimeout(200);
const rail1440 = await railPage.evaluate(() => {
	const r = document.querySelector('.ccn-news .ccn-rail');
	const nav = r && r.parentElement.querySelector('.ccn-rail-nav');
	return r && nav ? `${getComputedStyle(r).display}|${getComputedStyle(r).gridTemplateColumns.split(' ').length}|${r.scrollWidth <= r.clientWidth + 1}|${getComputedStyle(nav).display}` : 'no rail';
});
ok('Rail: news is a 4-column grid at 1440 without the buttons', rail1440 === 'grid|4|true|none', rail1440);
await railPage.close();
const noJsRail = await browser.newPage({ viewport: { width: 360, height: 800 } });
await noJsRail.route('**/assets/js/main.js*', (r) => r.abort());
await noJsRail.goto(BASE + '/', { waitUntil: 'load' });
const railNoJs = await noJsRail.evaluate(() => { const n = document.querySelector('.ccn-news .ccn-rail-nav'); return n ? getComputedStyle(n).visibility : 'no rail nav'; });
ok('Rail (main.js blocked): buttons stay invisible, no dead controls', railNoJs === 'hidden', railNoJs);
await noJsRail.close();
ok('Motion: main.js <= 7 KB raw', Buffer.byteLength(mainJs) <= 7168, `${Buffer.byteLength(mainJs)} B`);
ok('Motion: prefers-reduced-motion handled in theme.css and main.js', /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{\s*\*,\s*\*::before,\s*\*::after\s*\{[^}]*transition-duration:\s*0\.01ms\s*!important;\s*animation-duration:\s*0\.01ms\s*!important/.test(themeCss)
	&& /matchMedia\(\s*'\(prefers-reduced-motion: no-preference\)'\s*\)/.test(mainJs));

await browser.close();
console.log(results.join('\n'));
const fails = results.filter((r) => r.startsWith('FAIL')).length;
console.log(`\n${results.length - fails}/${results.length} PASS`);
process.exit(fails ? 1 : 0);
