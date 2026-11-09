// Coin Container smoke test: rendering, accessibility basics, security hardening.
// Requires a local WordPress site running this theme.
import { chromium } from 'playwright';
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';

const BASE = process.env.CCN_BASE_URL || 'http://coin-container-new.local';
// Product categories live under the production base since T-53a (woocommerce_permalinks.category_base).
const CAT_BASE = '/container-kaufen/';
const CAT_STANDARD = `${CAT_BASE}standardcontainer/`;
const CAT_SPECIAL = `${CAT_BASE}spezialcontainer/`;
const CAT_COOLING = `${CAT_BASE}kuehlcontainer/`;
// The inspiration landing has production's slug since T-53b (was /container-inspiration-ideen/).
const INSPIRATION = '/container-ideen-inspiration/';

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

// Vanilla-JS policy: jQuery must not load outside the WooCommerce pages (shop, categories, products, cart,
// checkout, account: decision 08.11.2026, see "Product & catalog (T-49)" below)
ok('jQuery absent on home', await page.evaluate(() => typeof window.jQuery === 'undefined'));

// Header: primary nav with dropdown structure, phone link
ok('Primary nav rendered', await page.locator('#site-nav .site-menu > li').count() >= 5);
ok('Nav has dropdowns', await page.locator('#site-nav .sub-menu').count() >= 2);
ok('Header phone link', await page.locator('.header-phone[href^="tel:"]').count() === 1);

// Top bar (desktop): contacts + social; sticky header
ok('Topbar visible on desktop', await page.locator('.ccn-topbar').isVisible());
ok('Topbar email link', await page.locator('.ccn-topbar-email[href^="mailto:"]').count() === 1);
ok('Topbar social icons', await page.locator('.ccn-topbar-social a[href^="https://"]').count() >= 3);
ok('Header is fixed (T-47: one element, body reserves its height)', await page.evaluate(() =>
	getComputedStyle(document.querySelector('.site-header')).position === 'fixed'));
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
// T-48: services are cards (icon, title, text); no number, no photo texture behind the text (A6 §6.5).
ok('Services: 4 cards with an icon, no numbers, no photo behind the text', await page.locator('.ccn-services .ccn-service.ccn-card .ccn-service-icon svg[aria-hidden="true"]').count() === 4
	&& await page.locator('.ccn-services .ccn-service-number, .ccn-services img').count() === 0);
// T-48: the five counters of production (V 08.11.2026: figures as on production), final values in the HTML.
const statsText = await page.evaluate(() => [...document.querySelectorAll('.ccn-stats .ccn-stat')].map((s) =>
	`${s.querySelector('.ccn-stat-number[data-target]').textContent.trim()} ${s.querySelector('.ccn-stat-label').textContent.trim()}`).join(' | '));
ok('Stats: the 5 production counters (100+, 830+, 7, 60+, 15)', statsText
	=== '100+ Partnerunternehmen | 830+ zufriedene Kunden | 7 gesprochene Sprachen | 60+ Depots weltweit | 15 Jahre Erfahrung', statsText);
// T-48 (C9): without a photo the CTA banner is the yellow band with its own button and the phone button.
ok('CTA banner heading + button + phone', await page.locator('.ccn-cta .ccn-cta-heading').count() === 1
	&& await page.locator('.ccn-cta .btn').count() === 2 && await page.locator('.ccn-cta .btn[href^="tel:"]').count() === 1);
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
// Yellow accent text only on a dark surface (T-48: the stats band); on light surfaces never raw yellow.
ok('Accent text is not raw brand yellow on a light surface (contrast)', await page.evaluate(() => {
	const els = document.querySelectorAll('.ccn-accent, .ccn-accent-inline, .ccn-news-heading');
	const surface = (e) => { for (let p = e; p; p = p.parentElement) { const c = getComputedStyle(p).backgroundColor; if (c !== 'rgba(0, 0, 0, 0)') return c; } return 'rgb(255, 255, 255)'; };
	const light = (c) => (c.match(/\d+/g) || []).slice(0, 3).reduce((a, v) => a + Number(v), 0) > 382;
	return els.length >= 3 && [...els].every((el) => !light(surface(el)) || getComputedStyle(el).color !== 'rgb(247, 198, 0)');
}));
ok('Cart accessible name includes visible count', await page.evaluate(() => {
	const a = document.querySelector('.header-cart');
	if (!a || a.hasAttribute('aria-label')) return false; // aria-label would hide the visible count from the name
	const count = ((a.querySelector('.header-cart-count') || {}).textContent || '').trim();
	return /^\d+$/.test(count) && (a.textContent || '').includes(count);
}));

// Shop: product grid renders; a WooCommerce page keeps jQuery for WooCommerce's scripts (T-49)
const respShop = await page.goto(BASE + '/container-shop/', { waitUntil: 'load' });
ok('Shop responds 200', respShop.status() === 200, String(respShop.status()));
ok('Shop lists products', await page.locator('ul.products li.product').count() >= 6);
ok('jQuery on shop (WooCommerce page, T-49)', await page.evaluate(() => typeof window.jQuery === 'function'));

// Category archive renders products
const respCat = await page.goto(BASE + CAT_STANDARD, { waitUntil: 'domcontentloaded' });
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
ok('Zubehoer CTA banner with button + phone', await page.locator('.ccn-cta .btn').count() === 2 && await page.locator('.ccn-cta .btn[href^="tel:"]').count() === 1);
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
	INSPIRATION,
	'/ueber-uns/',
];
for (const slug of textLandings) {
	const resp = await page.goto(BASE + slug, { waitUntil: 'domcontentloaded' });
	const name = slug.split('-')[0].replace('/', '');
	ok(`Landing ${slug} 200`, resp.status() === 200, String(resp.status()));
	ok(`Landing ${slug} full width with hero`, await page.locator('.ccn-landing-full').count() === 1
		&& await page.locator('.ccn-page-hero h1.ccn-page-hero-title').count() === 1
		&& await page.locator('.ccn-landing-sidebar').count() === 0);
	ok(`Landing ${slug} CTA banner`, await page.locator('.ccn-cta .btn').count() === 2 && await page.locator('.ccn-cta .btn[href^="tel:"]').count() === 1);
	ok(`Landing ${slug} no flexible sections`, await page.locator('.section-hero, .section-text, .section-cta').count() === 0);
	ok(`Landing ${slug} no raw markup leak`, await page.evaluate(() => !document.body.textContent.includes('u003c') && !document.body.textContent.includes('<p>')));
}
ok('Sanitaer type cards', (await (async () => {
	await page.goto(BASE + '/sanitaercontainer-alles-was-sie-wissen-muessen/', { waitUntil: 'domcontentloaded' });
	return page.locator('.ccn-info-card').count();
})()) === 4);
ok('Inspiration stats + idea cards', (await (async () => {
	await page.goto(BASE + INSPIRATION, { waitUntil: 'domcontentloaded' });
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
// editor content (.entry-content, .rich-text, WooCommerce tab panels, category
// descriptions .term-description — production texts since T-53a with h3 that
// production prints below the product grid, WooCommerce here above it; place
// and levels are a roadmap item) is content, not theme, and is left out;
// main#content takes focus from the skip link;
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
	[CAT_COOLING, 200], // product category
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
			if (h.closest('.entry-content, .rich-text, .woocommerce-Tabs-panel, .term-description')) continue;
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
const contentLinks = await wide.evaluate(() => [...document.querySelectorAll(':is(.entry-content, .wpcf7-form) a:not(.btn):not(.button)')]
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
// Null-safe (T-49): a missing grid fails this check with the page URL instead of aborting the run (flake seen in T-47, T-49).
await page.evaluate(() => { const g = document.querySelector('.ccn-stats-grid'); if (g) g.scrollIntoView({ block: 'center', behavior: 'instant' }); });
await page.waitForTimeout(150);
const countersAgain = await counterTexts();
ok('Motion: counters count up once, hidden while they drop to 0, and land on the HTML value', countersAtLoad.length >= 3
	&& !!counterStart && counterStart.opacity < 0.5
	&& countersDone.join('|') === countersAtLoad.join('|') && countersAgain.join('|') === countersAtLoad.join('|'),
	`${countersAtLoad} -> first change ${JSON.stringify(counterStart)} -> ${countersDone} -> ${countersAgain} (url ${page.url()})`);
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
// Back at the top the header unfolds its top bar (T-47, 250ms) and the menu item moves 40px: hover only once it settled
// (the hover landed next to the item in 1 of ~10 runs, T-48/T-49).
await deskPage.waitForFunction(() => { const h = document.getElementById('header'); return !!h && !h.classList.contains('is-stuck'); }, null, { timeout: 3000 }).catch(() => null);
await deskPage.waitForTimeout(400);
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

// First screen (T-47, DESIGN.md "Header", "Hero", "Action bar"; A6 §6.7). At 360x800 the fixed
// header stays <= 64px with a 44x44 phone link, the h1 takes <= 4 lines, and the primary CTA, the
// hero phone line and (front page) the trust row end inside the first screen, above the action
// bar. From 64rem the header row is 80px under the top bar and compacts to one 64px row once
// scrolled. Smooth scrolling is switched off before every geometry probe.
const noSmooth = 'html,body{scroll-behavior:auto !important}';
const firstScreenPages = ['/', '/container-kaufen/', '/container-mieten/'];
const fsPage = await browser.newPage({ viewport: { width: 360, height: 800 } });
const fs360 = {};
for (const path of firstScreenPages) {
	await fsPage.goto(BASE + path, { waitUntil: 'load' });
	await fsPage.addStyleTag({ content: noSmooth });
	await fsPage.waitForSelector('#header');
	await fsPage.evaluate(() => document.fonts.ready);
	fs360[path] = await fsPage.evaluate(() => {
		const vis = (e) => !!e && getComputedStyle(e).display !== 'none' && getComputedStyle(e).visibility !== 'hidden' && e.getBoundingClientRect().width > 0;
		const box = (e) => { if (!vis(e)) return null; const b = e.getBoundingClientRect(); return { top: Math.round(b.top), bottom: Math.round(b.bottom), w: Math.round(b.width), h: Math.round(b.height) }; };
		const header = document.getElementById('header');
		const h1 = document.querySelector('h1');
		const bar = document.querySelector('.ccn-action-bar');
		return {
			header: header ? Math.round(header.getBoundingClientRect().height) : -1,
			tel: box(header && [...header.querySelectorAll('a[href^="tel:"]')].find(vis)),
			h1Lines: h1 ? Math.round(h1.getBoundingClientRect().height / parseFloat(getComputedStyle(h1).lineHeight)) : -1,
			cta: box(document.querySelector('.ccn-hero .btn-primary, .ccn-page-hero .btn-primary')),
			heroTel: box([...document.querySelectorAll('.ccn-hero a[href^="tel:"], .ccn-page-hero a[href^="tel:"]')].find(vis)),
			heroTelColor: ((e) => (e ? getComputedStyle(e).color : 'none'))(document.querySelector('.ccn-hero a[href^="tel:"], .ccn-page-hero a[href^="tel:"]')),
			trust: box(document.querySelector('.ccn-trust')),
			bar: box(bar), barLinks: bar ? [...bar.querySelectorAll('a')].map((a) => `${a.textContent.trim()}|${a.getAttribute('href')}|${getComputedStyle(a).color}`) : [],
		};
	});
}
const fsList = (fn) => firstScreenPages.map((p) => `${p} ${fn(fs360[p])}`).join(', ');
ok('First screen 360: #header <= 64px on /, kaufen, mieten', firstScreenPages.every((p) => fs360[p].header > 0 && fs360[p].header <= 64),
	fsList((s) => s.header));
ok('First screen 360: phone link in the header, visible, >= 44x44, inside the 64px row', firstScreenPages.every((p) => {
	const t = fs360[p].tel;
	return !!t && t.w >= 44 && t.h >= 44 && t.bottom <= 64;
}), fsList((s) => JSON.stringify(s.tel)));
ok('First screen 360: h1 takes <= 4 lines on /, kaufen, mieten', firstScreenPages.every((p) => fs360[p].h1Lines >= 1 && fs360[p].h1Lines <= 4),
	fsList((s) => s.h1Lines));
// Inside the first screen = bottom <= 800 and not under the action bar (when there is one).
const fsInside = (s, b) => !!b && b.top >= 0 && b.bottom <= Math.min(800, s.bar ? s.bar.top : 800);
ok('First screen 360: primary CTA and white hero phone line (and on / the trust row) end inside the first screen', firstScreenPages.every((p) => {
	const s = fs360[p];
	return fsInside(s, s.cta) && fsInside(s, s.heroTel) && s.heroTelColor === 'rgb(255, 255, 255)' && (p !== '/' || fsInside(s, s.trust));
}), fsList((s) => `cta ${s.cta && s.cta.bottom} tel ${s.heroTel && s.heroTel.bottom} ${s.heroTelColor} trust ${s.trust && s.trust.bottom} bar ${s.bar && s.bar.top}`));
await fsPage.close();
const deskHeader = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await deskHeader.goto(BASE + '/', { waitUntil: 'load' });
await deskHeader.addStyleTag({ content: noSmooth });
await deskHeader.waitForSelector('#header');
const deskState = () => deskHeader.evaluate(() => {
	const h = (sel) => { const e = document.querySelector(sel); return e ? Math.round(e.getBoundingClientRect().height) : -1; };
	const tb = document.querySelector('.ccn-topbar');
	const bar = document.querySelector('.ccn-action-bar');
	return { header: h('#header'), row: h('.header-inner'), topbar: h('.ccn-topbar'), topbarVis: tb ? getComputedStyle(tb).visibility : 'none',
		bar: bar ? getComputedStyle(bar).display : 'absent' };
});
const deskRest = await deskState();
await deskHeader.hover('.ccn-topbar .header-phone');
await deskHeader.waitForTimeout(250);
deskRest.topbarHover = await deskHeader.evaluate(() => { const s = getComputedStyle(document.querySelector('.ccn-topbar .header-phone')); return `${s.color}|${s.textDecorationLine}`; });
await deskHeader.mouse.move(640, 600);
await deskHeader.evaluate(() => window.scrollTo(0, 300));
await deskHeader.waitForTimeout(500);
const deskScrolled = await deskState();
ok('Header 1280: 80px row under the 40px top bar (hover: white underlined, not yellow 3.99:1); after scrollTo(0, 300) <= 64px, top bar folded and hidden',
	deskRest.row === 80 && deskRest.topbar === 40 && deskRest.header === 120 && deskRest.topbarHover === 'rgb(255, 255, 255)|underline' && deskScrolled.header <= 64
	&& deskScrolled.topbar === 0 && deskScrolled.topbarVis === 'hidden', JSON.stringify({ rest: deskRest, scrolled: deskScrolled }));
await deskHeader.close();
// Action bar (DESIGN.md "Action bar"): a bottom bar below 48rem with "Anrufen" (tel:) and "Anfrage"
// (the request page), gone from 48rem and never on the cart.
ok('Action bar 360: visible, >= 56px, white Anrufen (tel:) + dark Anfrage on /, kaufen, mieten; display none at 1280', firstScreenPages.every((p) => {
	const s = fs360[p];
	return !!s.bar && s.bar.h >= 56 && s.bar.bottom === 800 && s.barLinks.length === 2
		&& /^Anrufen\|tel:\+?\d+\|rgb\(255, 255, 255\)$/.test(s.barLinks[0]) && /^Anfrage\|\S+\|rgb\(32, 32, 32\)$/.test(s.barLinks[1]);
}) && deskRest.bar === 'none', `${fsList((s) => `${JSON.stringify(s.bar)} ${s.barLinks.join(' / ')}`)}; 1280: ${deskRest.bar}`);
const cartPage = await browser.newPage({ viewport: { width: 360, height: 800 } });
await cartPage.goto(BASE + '/warenkorb/', { waitUntil: 'load' });
const cartBar = await cartPage.evaluate(() => `${document.querySelectorAll('.ccn-action-bar').length}|${document.body.classList.contains('ccn-has-action-bar')}`);
ok('Action bar: none on /warenkorb/ (no bar, no reserved body padding)', cartBar === '0|false', cartBar);
await cartPage.close();

// Components (T-48, DESIGN.md "Components"). (a) No horizontal scroll at 360/768/1280/1440 on the six
// key pages, the blog index, the search results and the full-width landing with a product grid.
const t48Pages = ['/', '/container-kaufen/', '/container-mieten/', '/container-shop/', '/kontakt-beratung/',
	'/product/20-fuss-container-gebraucht/', '/nachrichten-trends-aus-der-containerwelt/', '/?s=container', '/containerzubehoer/'];
const ovPage = await browser.newPage();
const overflowed = {};
for (const [w, h] of [[360, 800], [768, 1024], [1280, 800], [1440, 900]]) {
	await ovPage.setViewportSize({ width: w, height: h });
	for (const path of t48Pages) {
		await ovPage.goto(BASE + path, { waitUntil: 'load' });
		const sw = await ovPage.evaluate(() => `${document.documentElement.scrollWidth}|${innerWidth}`);
		if (parseInt(sw, 10) > w) (overflowed[path] = overflowed[path] || []).push(`${w}: scrollWidth ${sw}`);
	}
}
for (const path of t48Pages) {
	ok(`Components (a) ${path}: no horizontal scroll at 360/768/1280/1440`, !overflowed[path], (overflowed[path] || []).join(', '));
}
await ovPage.close();
// One gutter (T-49, roadmap 128): at 360 the first text or card of every block starts 16px from the edge on the front page,
// a landing with sidebar, a full-width and a text landing; the product card on the landing is as wide as on the front page.
const gutterPage = await browser.newPage({ viewport: { width: 360, height: 800 } });
const gutters = {};
for (const path of ['/', '/container-kaufen/', '/containerzubehoer/', '/ueber-uns/']) {
	await gutterPage.goto(BASE + path, { waitUntil: 'load' });
	gutters[path] = await gutterPage.evaluate(() => {
		const vis = (e) => { const s = getComputedStyle(e); const b = e.getBoundingClientRect(); return s.display !== 'none' && s.visibility !== 'hidden' && b.width > 0 && b.height > 0; };
		const lefts = [...document.querySelectorAll('main section')].filter((s) => !s.matches('.ccn-hero, .ccn-page-hero, .ccn-contact-cards, .ccn-stats'))
			.map((s) => [...s.querySelectorAll('h2, h3, p, li.product, .ccn-card, .ccn-form-card-box, .btn, .rich-text, img')].find(vis)).filter(Boolean).map((e) => Math.round(e.getBoundingClientRect().left));
		const card = [...document.querySelectorAll('ul.products > li.product')].find(vis);
		return { lefts: [...new Set(lefts)], card: card ? Math.round(card.getBoundingClientRect().width) : null };
	});
}
ok('Layout 360: one 16px gutter for every block (front page, landing with sidebar, full-width and text landing); landing product card as wide as on the front page',
	Object.values(gutters).every((g) => g.lefts.length > 0 && g.lefts.every((l) => l === 16)) && !!gutters['/'].card && gutters['/container-kaufen/'].card === gutters['/'].card,
	JSON.stringify(gutters));
await gutterPage.close();
// (b) Product card at 360 (C4): one column, the button on one line (44-48px) across >= 90 % of the card,
// the title on <= 3 lines, the .ccn-card surface (1px border, 8px radius, --ccn-shadow-1).
const cardPage = await browser.newPage({ viewport: { width: 360, height: 800 } });
await cardPage.goto(BASE + '/container-kaufen/', { waitUntil: 'load' });
await cardPage.waitForSelector('ul.products > li.product .button').catch(() => null);
const card360 = await cardPage.evaluate(() => {
	const lis = [...document.querySelectorAll('ul.products > li.product')];
	const li = lis[0];
	const btn = li && li.querySelector('.button');
	const title = li && li.querySelector('.woocommerce-loop-product__title');
	if (!btn || !title) return null;
	const r = (e) => e.getBoundingClientRect();
	const s = getComputedStyle(li);
	return { perRow: lis.filter((l) => Math.round(r(l).top) === Math.round(r(li).top)).length, btnH: Math.round(r(btn).height),
		ratio: Math.round(100 * r(btn).width / r(li).width) / 100, titleLines: Math.round(r(title).height / parseFloat(getComputedStyle(title).lineHeight)),
		look: `${s.borderTopWidth}|${s.borderTopLeftRadius}|${s.boxShadow.includes('0px 2px 8px')}` };
});
// The square image is drawn at 3/4 of its 4:3 box (contain): sizes says so instead of WP's "auto" (box width),
// otherwise phones load the 768px file in the one-column grid (LH: +79 KB on kaufen).
const thumbSizes = await cardPage.evaluate(() => [...document.querySelectorAll('ul.products img.attachment-woocommerce_thumbnail')].map((i) => i.getAttribute('sizes')));
ok('Components: product thumbnails sized for the contained image (no sizes="auto")', thumbSizes.length >= 4
	&& thumbSizes.every((s) => /^\(max-width: 575px\) calc\(75vw - 44px\)/.test(s || '')), [...new Set(thumbSizes)].join(' | '));
ok('Components (b) kaufen 360: 1 column, card button 44-48px and >= 90% of the card, title <= 3 lines, card surface', !!card360
	&& card360.perRow === 1 && card360.btnH >= 44 && card360.btnH <= 48 && card360.ratio >= 0.9 && card360.titleLines <= 3 && card360.look === '1px|8px|true',
	JSON.stringify(card360));
// (h) Tap targets at 360: header icons, every link of the open mobile menu and of the footer >= 44px tall.
const tall = (sel) => cardPage.evaluate((s) => {
	const els = [...document.querySelectorAll(s)].filter((e) => { const cs = getComputedStyle(e); return e.getBoundingClientRect().width > 1 && cs.display !== 'none' && cs.visibility !== 'hidden'; });
	return { n: els.length, small: els.filter((e) => e.getBoundingClientRect().height < 44).map((e) => `${(e.textContent || e.className).trim().slice(0, 24)}:${Math.round(e.getBoundingClientRect().height)}`) };
}, sel);
await cardPage.goto(BASE + '/', { waitUntil: 'load' });
await cardPage.waitForSelector('#footer .footer-menu a').catch(() => null);
const tapHeader = await tall('#header .header-inner a, #header .header-inner button');
const tapFooter = await tall('#footer a, #footer button');
await cardPage.click('.nav-toggle');
await cardPage.waitForTimeout(400);
const tapMenu = await tall('#site-nav a');
ok('Components (h) 360: header icons, mobile menu and footer links all >= 44px tall', tapHeader.n >= 5 && tapMenu.n >= 10 && tapFooter.n >= 10
	&& [tapHeader, tapMenu, tapFooter].every((t) => t.small.length === 0), JSON.stringify({ header: tapHeader, menu: tapMenu, footer: tapFooter }));
await cardPage.close();
// (c) Keyboard focus (C5): Tab to the first .btn shows a 3px solid ring with a 2px gap.
const focusPage = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const focusRing = {};
for (const path of ['/', '/container-kaufen/', '/container-mieten/']) {
	await focusPage.goto(BASE + path, { waitUntil: 'load' });
	let ring = null;
	for (let i = 0; i < 60 && !ring; i++) {
		await focusPage.keyboard.press('Tab');
		ring = await focusPage.evaluate(() => { const e = document.activeElement; if (!e || !e.matches('.btn')) return null; const s = getComputedStyle(e); return `${s.outlineStyle} ${s.outlineWidth} ${s.outlineOffset}`; });
	}
	focusRing[path] = ring;
}
ok('Components (c) focus: Tab to the first .btn shows a 3px solid ring with a 2px gap (/, kaufen, mieten)', Object.values(focusRing).every((r) => r === 'solid 3px 2px'), JSON.stringify(focusRing));
// (f) Services at 1280: every text visible without hover. Row 118: the dark contact card link turns white +
// underline on hover (yellow on its grey is 3.99:1). Footer social links: 44x44 icons named by screen-reader text.
await focusPage.goto(BASE + '/', { waitUntil: 'load' });
const services1280 = await focusPage.evaluate(() => [...document.querySelectorAll('.ccn-service-text')].map((e) => `${getComputedStyle(e).opacity}/${getComputedStyle(e).maxHeight}/${e.offsetHeight > 0}`));
ok('Components (f) services at 1280: texts visible without hover', services1280.length === 4 && services1280.every((s) => s === '1/none/true'), services1280.join(', '));
await focusPage.hover('.ccn-contact-card.is-dark a');
await focusPage.waitForTimeout(300);
const darkCardHover = await focusPage.evaluate(() => { const s = getComputedStyle(document.querySelector('.ccn-contact-card.is-dark a')); return `${s.color}|${s.textDecorationLine}`; });
ok('Components: dark contact card link hover is white + underline, not yellow', darkCardHover === 'rgb(255, 255, 255)|underline', darkCardHover);
const social = await focusPage.evaluate(() => [...document.querySelectorAll('.footer-social-list a')].map((a) => {
	const b = a.getBoundingClientRect();
	return `${Math.round(b.width)}x${Math.round(b.height)}|${a.querySelectorAll('svg[aria-hidden="true"]').length}|${(a.querySelector('.screen-reader-text') || {}).textContent || ''}`;
}));
ok('Components: footer social links are 44x44 icons (one aria-hidden svg) named by screen-reader text', social.length >= 4
	&& social.every((s) => /^44x44\|1\|\S.+\(öffnet in neuem Tab\)$/.test(s)), social.join(', '));
await focusPage.close();
// WooCommerce buttons on the button system: the single-product add-to-cart is brand yellow with #202020 text
// (WooCommerce's own is purple #7f54b3) and >= 44px tall.
await page.goto(BASE + '/product/20-fuss-container-one-way/', { waitUntil: 'load' });
const wcBtn = await page.evaluate(() => { const b = document.querySelector('.single_add_to_cart_button'); if (!b) return null; const s = getComputedStyle(b); return `${s.backgroundColor}|${s.color}|${Math.round(b.getBoundingClientRect().height)}`; });
ok('Components: WooCommerce add-to-cart takes the primary button (yellow, #202020, >= 44px)', !!wcBtn
	&& wcBtn.startsWith('rgb(247, 198, 0)|rgb(32, 32, 32)|') && parseInt(wcBtn.split('|')[2], 10) >= 44, String(wcBtn));
// (d) Stats on the dark surface: #141414, yellow numbers, light labels (C7). (e) Home sections alternate:
// >= 4 different backgrounds, neighbours never share one except white text sections. One CTA banner per page.
const secPage = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await secPage.goto(BASE + '/', { waitUntil: 'load' });
await secPage.waitForSelector('.ccn-stats .ccn-stat-label').catch(() => null);
const homeSections = await secPage.evaluate(() => {
	const surface = (e) => { for (let p = e; p; p = p.parentElement) { const c = getComputedStyle(p).backgroundColor; if (c !== 'rgba(0, 0, 0, 0)') return c; } return 'rgb(255, 255, 255)'; };
	const st = document.querySelector('.ccn-stats');
	const num = st && st.querySelector('.ccn-stat-number');
	const lab = st && st.querySelector('.ccn-stat-label');
	return {
		stats: st ? `${getComputedStyle(st).backgroundColor}|${getComputedStyle(num).color}|${getComputedStyle(lab).color}` : 'none',
		list: [...document.querySelectorAll('main > section')].map((s) => ({ cls: s.className.split(' ')[0], bg: surface(s), text: s.matches('.ccn-section--default') })),
	};
});
ok('Components (d) stats on #141414 with yellow numbers and light labels', homeSections.stats === 'rgb(20, 20, 20)|rgb(247, 198, 0)|rgb(247, 247, 247)', homeSections.stats);
const homeBgs = homeSections.list;
// Neighbours from the first block under the hero and contact cards (they form the first screen together).
const flow = homeBgs.filter((s) => !/^ccn-(hero|contact-cards)$/.test(s.cls));
const sameNeighbours = flow.slice(1).map((s, i) => [flow[i], s]).filter(([a, b]) => a.bg === b.bg && !(a.text && b.text)).map(([a, b]) => `${a.cls}->${b.cls}`);
ok('Components (e) home: >= 4 different section backgrounds, neighbours differ', new Set(homeBgs.map((s) => s.bg)).size >= 4 && sameNeighbours.length === 0,
	`${homeBgs.map((s) => `${s.cls}:${s.bg}`).join(', ')}${sameNeighbours.length ? ' | same: ' + sameNeighbours.join(', ') : ''}`);
const ctaCount = {};
for (const path of ['/', '/container-kaufen/', '/container-mieten/', '/containerzubehoer/', '/ueber-uns/', INSPIRATION]) {
	await secPage.goto(BASE + path, { waitUntil: 'domcontentloaded' });
	ctaCount[path] = await secPage.locator('.ccn-cta').count();
}
ok('Components: at most one CTA banner per page; without a photo it is the yellow band', Object.values(ctaCount).every((n) => n <= 1)
	&& await secPage.evaluate(() => { const c = document.querySelector('.ccn-cta'); return !!c && c.matches('.ccn-cta--band') && getComputedStyle(c).backgroundColor === 'rgb(247, 198, 0)'; }), JSON.stringify(ctaCount));
// (g) Contrast probe (T-45 method): every visible text on the six key pages at 360 and 1440 >= 4.5:1
// (large text >= 3:1) against its composited background; text over photos is measured by the library probe.
const contrastFails = (p) => p.evaluate(() => {
	const parse = (s) => { const m = String(s).match(/rgba?\(([^)]+)\)/); if (!m) return null; const v = m[1].split(/[\s,/]+/).filter(Boolean).map(Number); return { r: v[0], g: v[1], b: v[2], a: v.length > 3 ? v[3] : 1 }; };
	const lin = (c) => { const x = c / 255; return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; };
	const lum = (c) => 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
	const over = (t, u) => ({ r: t.r * t.a + u.r * (1 - t.a), g: t.g * t.a + u.g * (1 - t.a), b: t.b * t.a + u.b * (1 - t.a), a: 1 });
	const out = [];
	let n = 0;
	for (const el of document.querySelectorAll('body *')) {
		if (/^(SCRIPT|STYLE|NOSCRIPT|OPTION)$/.test(el.tagName) || el.closest('svg')) continue;
		const own = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').trim();
		const r = el.getBoundingClientRect();
		if (!own || r.width <= 1 || r.height <= 1) continue;
		let photo = false; let op = 1; const layers = [];
		let hidden = false;
		for (let e = el; e; e = e.parentElement) {
			const s = getComputedStyle(e);
			if (s.display === 'none' || s.visibility === 'hidden' || /inset\(50%\)/.test(s.clipPath)) { hidden = true; break; }
			if (!layers.length || layers[layers.length - 1].a < 1) op *= parseFloat(s.opacity);
			if (s.backgroundImage !== 'none' || [...e.children].some((c) => /^(IMG|PICTURE)$/.test(c.tagName) && /absolute|fixed/.test(getComputedStyle(c).position))
				|| /gradient/.test(getComputedStyle(e, '::before').backgroundImage)) photo = true;
			const c = parse(s.backgroundColor);
			if (c && c.a > 0) { layers.push(c); if (c.a >= 1) break; }
		}
		if (hidden || photo || op <= 0.05) continue;
		let bg = layers.length && layers[layers.length - 1].a >= 1 ? layers.pop() : { r: 255, g: 255, b: 255, a: 1 };
		for (let i = layers.length - 1; i >= 0; i--) bg = over(layers[i], bg);
		const s = getComputedStyle(el);
		const fg0 = parse(s.color);
		const fg = fg0.a * op < 1 ? over({ ...fg0, a: fg0.a * op }, bg) : fg0;
		const ratio = (Math.max(lum(fg), lum(bg)) + 0.05) / (Math.min(lum(fg), lum(bg)) + 0.05);
		const fs = parseFloat(s.fontSize);
		const need = fs >= 24 || (fs >= 18.66 && parseInt(s.fontWeight, 10) >= 700) ? 3 : 4.5;
		n++;
		if (ratio < need) out.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]} "${own.slice(0, 24)}" ${ratio.toFixed(2)}`);
	}
	return { n, out };
});
const ctxRm = await browser.newContext({ reducedMotion: 'reduce' });
const rmProbe = await ctxRm.newPage();
for (const path of ['/', '/container-kaufen/', '/container-mieten/', '/container-shop/', '/kontakt-beratung/', '/product/20-fuss-container-gebraucht/']) {
	const bad = [];
	const counted = [];
	for (const [w, h] of [[360, 800], [1440, 900]]) {
		await rmProbe.setViewportSize({ width: w, height: h });
		await rmProbe.goto(BASE + path, { waitUntil: 'load' });
		const c = await contrastFails(rmProbe);
		counted.push(c.n);
		bad.push(...c.out.map((f) => `${w}: ${f}`));
	}
	ok(`Components (g) contrast ${path}: 0 texts under 4.5:1 (large 3:1) at 360 and 1440`, bad.length === 0 && Math.min(...counted) >= 20,
		`${counted.join('/')} texts; ${bad.slice(0, 6).join(' | ')}`);
}
// Section backgrounds dark and yellow (no stored content uses them yet): switched on in the page, every text
// of the intro, text + image and news sections keeps its contrast, links stay readable, the focus ring turns white.
await rmProbe.setViewportSize({ width: 1280, height: 800 });
await rmProbe.goto(BASE + '/', { waitUntil: 'load' });
await rmProbe.waitForSelector('.ccn-intro .btn').catch(() => null);
await rmProbe.evaluate(() => {
	document.querySelectorAll('main > section').forEach((s) => { if (!s.matches('.ccn-intro, .ccn-text-image, .ccn-news')) s.style.display = 'none'; });
	const set = (sel, cls) => { const e = document.querySelector(sel); if (e) e.className = cls; };
	set('.ccn-intro', 'ccn-intro ccn-section ccn-section--dark');
	set('.ccn-text-image', 'ccn-text-image ccn-section ccn-section--yellow');
	set('.ccn-news', 'ccn-news ccn-section ccn-section--dark');
});
const variant = await contrastFails(rmProbe);
const variantFails = variant.out;
await rmProbe.focus('.ccn-intro .btn').catch(() => null);
await rmProbe.keyboard.press('Shift+Tab');
await rmProbe.keyboard.press('Tab');
const darkRing = await rmProbe.evaluate(() => (document.activeElement && document.activeElement.matches('.ccn-intro .btn') ? getComputedStyle(document.activeElement).outlineColor : 'focus not on the intro button'));
ok('Components: dark and yellow section backgrounds keep every text >= AA and a white focus ring on dark', variant.n >= 20 && variantFails.length === 0 && darkRing === 'rgb(255, 255, 255)',
	`${variant.n} texts; ${variantFails.slice(0, 6).join(' | ')} ring ${darkRing}`);
await ctxRm.close();
await secPage.close();

// Product & catalog (T-49, DESIGN.md "Product page"). jQuery only on the WooCommerce pages (decision 08.11.2026):
// shop, categories, products and the cart keep it for WooCommerce's own scripts, deferred on shop pages; the front
// page, landings, posts and legal pages ship none.
const T49_PRODUCT = '/product/20-fuss-container-gebraucht/';
const wooPages = ['/container-shop/', CAT_STANDARD, T49_PRODUCT, '/warenkorb/'];
const jqPage = await browser.newPage();
const jq = {};
const wcCss = {};
for (const path of [...wooPages, '/', '/container-kaufen/', '/containerzubehoer/', '/gebrauchte-seecontainer-in-cuxhaven/', '/datenschutzerklaerung/']) {
	await jqPage.goto(BASE + path, { waitUntil: 'load' });
	jq[path] = await jqPage.evaluate(() => `${typeof window.jQuery}|${(document.getElementById('jquery-core-js') || {}).defer === true ? 'defer' : 'blocking'}`);
	wcCss[path] = await jqPage.locator('link[rel="stylesheet"][href*="/plugins/woocommerce/assets/css/woocommerce"]').count();
}
ok('Product & catalog: jQuery on the WooCommerce pages only (shop, category, product, cart), deferred on shop/category/product',
	Object.entries(jq).every(([p, t]) => (wooPages.includes(p) ? t.startsWith('function') && (p === '/warenkorb/' || t.endsWith('defer')) : t.startsWith('undefined'))), JSON.stringify(jq));
// WooCommerce's three stylesheets only where theme.css does not cover its markup yet (shop, category, cart); the product
// page and the product cards of the front page and landings run on theme.css alone (same computed card styles, T-49 probe).
ok('Product & catalog: WooCommerce stylesheets on shop, category and cart only (product page, front page, landings: 0)',
	Object.entries(wcCss).every(([p, n]) => (['/container-shop/', CAT_STANDARD, '/warenkorb/'].includes(p) ? n === 3 : n === 0)), JSON.stringify(wcCss));
// Product card title links without underline on every page with cards, with or without WooCommerce's stylesheets.
const cardLinks = {};
for (const path of ['/', '/container-kaufen/', '/container-shop/', T49_PRODUCT]) {
	await jqPage.goto(BASE + path, { waitUntil: 'load' });
	cardLinks[path] = await jqPage.evaluate(() => [...new Set([...document.querySelectorAll('ul.products li.product a.woocommerce-LoopProduct-link')]
		.map((a) => getComputedStyle(a).textDecorationLine))].join() || 'no cards');
}
ok('Product cards: title links not underlined on the front page, a landing, the shop and the product page (related)',
	Object.values(cardLinks).every((v) => v === 'none'), JSON.stringify(cardLinks));
await jqPage.close();
// Critical path of the product page: theme.css is the only stylesheet that blocks the first paint (the lightbox styles
// load as print styles and switch on load) and every external script defers (WooCommerce's, WooPayments' tracker).
const productHtml = await (await fetch(`${BASE}${T49_PRODUCT}?cb=${Date.now()}`)).text();
const blockingCss = [...productHtml.matchAll(/<link rel='stylesheet' id='([^']+)'[^>]*\smedia='all'/g)].map((m) => m[1]);
const blockingJs = [...productHtml.matchAll(/<script\b[^>]*\bsrc=[^>]*>/g)].map((m) => m[0])
	.filter((t) => !/\s(defer|async)[\s>=]/.test(t)).map((t) => (t.match(/id="([^"]+)"/) || [])[1] || t.slice(0, 60));
ok('Product page: theme.css is the only render-blocking stylesheet and every external script defers',
	blockingCss.join() === 'coin-container-css' && blockingJs.length === 0, `blocking css: ${blockingCss.join(', ')}; blocking js: ${blockingJs.join(', ') || 'none'}`);
// Stock WooCommerce gallery (slider + lightbox, no zoom). 360: visible at once (WooCommerce sets opacity 0 inline until
// its script ran), the slider started with arrows and no thumbnail strip (one request per photo), the first photo eager
// with high priority, photos 2..N not requested until they slide in; 1280: one thumbnail per photo.
const galPage = await browser.newPage({ viewport: { width: 360, height: 800 } });
const galState = () => galPage.evaluate(() => {
	const g = document.querySelector('.woocommerce-product-gallery');
	if (!g) return null;
	const slides = [...g.querySelectorAll('.woocommerce-product-gallery__image')];
	const imgs = slides.map((s) => s.querySelector('img'));
	const done = (i) => !!i && i.complete && i.naturalWidth > 1;
	return { opacity: getComputedStyle(g).opacity, slider: !!g.querySelector('.flex-viewport'), arrows: g.querySelectorAll('.flex-direction-nav a').length,
		thumbs: g.querySelectorAll('.flex-control-thumbs img').length, photos: imgs.length, active: slides.findIndex((s) => s.classList.contains('flex-active-slide')),
		main: `${imgs[0].getAttribute('loading')}|${imgs[0].getAttribute('fetchpriority')}|${done(imgs[0])}`,
		waiting: imgs.slice(1).filter((i) => !!i.getAttribute('src') && i.getAttribute('loading') === 'lazy' && i.naturalWidth === 0).length,
		activeLoaded: done(g.querySelector('.flex-active-slide img')) };
});
await galPage.goto(BASE + T49_PRODUCT, { waitUntil: 'load' });
await galPage.waitForTimeout(1000);
const gal360 = await galState();
ok('Product 360: gallery opacity 1 one second after load, slider started with arrows, no thumbnail strip; first photo eager/high and loaded, photos 2..N not requested',
	!!gal360 && gal360.opacity === '1' && gal360.slider && gal360.arrows === 2 && gal360.thumbs === 0 && gal360.main === 'eager|high|true'
	&& gal360.photos >= 2 && gal360.waiting === gal360.photos - 1, JSON.stringify(gal360));
await galPage.click('.flex-direction-nav .flex-next').catch(() => null);
await galPage.waitForFunction(() => { const i = document.querySelector('.woocommerce-product-gallery .flex-active-slide img'); return !!i && i.complete && i.naturalWidth > 1; }, null, { timeout: 6000 }).catch(() => null);
const galNext = await galState();
ok('Product 360: the next arrow shows photo 2 with its file loaded', !!galNext && galNext.active === 1 && galNext.activeLoaded, JSON.stringify(galNext));
// Lightbox by keyboard: Enter on the photo link opens PhotoSwipe with focus inside, Escape closes it and returns focus.
await galPage.focus('.woocommerce-product-gallery .flex-active-slide a').catch(() => null);
await galPage.keyboard.press('Enter');
await galPage.waitForTimeout(900);
const lbOpen = await galPage.evaluate(() => `${!!document.querySelector('.pswp.pswp--open')}|${!!(document.activeElement && document.activeElement.closest('.pswp'))}`);
await galPage.keyboard.press('Escape');
await galPage.waitForTimeout(900);
const lbClosed = await galPage.evaluate(() => `${!document.querySelector('.pswp.pswp--open')}|${!!(document.activeElement && document.activeElement.closest('.woocommerce-product-gallery__image'))}`);
ok('Product: lightbox opens from the photo link with Enter (focus inside), Escape closes it and focus returns to the photo', lbOpen === 'true|true' && lbClosed === 'true|true', `${lbOpen} / ${lbClosed}`);
await galPage.setViewportSize({ width: 1280, height: 800 });
await galPage.goto(BASE + T49_PRODUCT, { waitUntil: 'load' });
await galPage.waitForTimeout(800);
const gal1280 = await galState();
ok('Product 1280: slider with one thumbnail per photo', !!gal1280 && gal1280.slider && gal1280.photos >= 2 && gal1280.thumbs === gal1280.photos, JSON.stringify(gal1280));
await galPage.close();
// Without JS (every script request blocked) the CSS fallback shows the gallery: opacity 1, the first photo visible in
// the first screen, photos 2..N not laid out (no stack of photos before the slider would start).
const noJsGal = await browser.newPage({ viewport: { width: 360, height: 800 } });
await noJsGal.route(/\.js(\?|$)/, (r) => r.abort());
await noJsGal.goto(BASE + T49_PRODUCT, { waitUntil: 'load' });
const galNoJs = await noJsGal.evaluate(() => {
	const g = document.querySelector('.woocommerce-product-gallery');
	const slides = g ? [...g.querySelectorAll('.woocommerce-product-gallery__image')] : [];
	const b = slides[0] ? slides[0].querySelector('img').getBoundingClientRect() : null;
	return { opacity: g ? getComputedStyle(g).opacity : null, main: b ? `${Math.round(b.top)}|${Math.round(b.height)}` : null,
		hidden: slides.slice(1).every((s) => getComputedStyle(s).display === 'none'), jq: typeof window.jQuery };
});
ok('Product without JS: gallery opacity 1 (CSS fallback), first photo visible in the first screen, photos 2..N hidden',
	galNoJs.opacity === '1' && !!galNoJs.main && parseInt(galNoJs.main.split('|')[1], 10) > 100 && parseInt(galNoJs.main.split('|')[0], 10) < 800 && galNoJs.hidden && galNoJs.jq === 'undefined',
	JSON.stringify(galNoJs));
await noJsGal.close();
// First screen of a product at 360x800 (A6 C12): h1 top <= 560, price <= 640, add to cart <= 760 and above the action
// bar, in the order h1, price, gallery, add to cart, request; the sale badge in the price row on the colour tokens, 14px
// as in the list; "Jetzt anfragen" (label as on production) to the request page with the product slug.
const fsProduct = await browser.newPage({ viewport: { width: 360, height: 800 } });
// Layout shifts while the gallery starts (FlexSlider widens the slide row 100ms before it sizes the slides).
await fsProduct.addInitScript(() => {
	window.__ccnCls = 0;
	new PerformanceObserver((l) => l.getEntries().forEach((e) => { if (!e.hadRecentInput) window.__ccnCls += e.value; })).observe({ type: 'layout-shift', buffered: true });
});
await fsProduct.goto(BASE + T49_PRODUCT, { waitUntil: 'load' });
await fsProduct.addStyleTag({ content: noSmooth });
await fsProduct.waitForSelector('.single_add_to_cart_button').catch(() => null);
const prod360 = await fsProduct.evaluate(() => {
	const top = (sel) => { const e = document.querySelector(sel); return e ? Math.round(e.getBoundingClientRect().top) : -1; };
	const bar = document.querySelector('.ccn-action-bar');
	const cta = document.querySelector('.single_add_to_cart_button');
	const badge = document.querySelector('.ccn-product-price .onsale');
	const req = document.querySelector('.ccn-product-request a.btn');
	const s = badge && getComputedStyle(badge);
	return { h1: top('h1.product_title'), price: top('.ccn-product-price .price'), gallery: top('.woocommerce-product-gallery'), cta: top('.single_add_to_cart_button'),
		ctaBottom: cta ? Math.round(cta.getBoundingClientRect().bottom) : -1, request: top('.ccn-product-request'), barTop: bar ? Math.round(bar.getBoundingClientRect().top) : 800,
		badge: s ? `${s.backgroundColor}|${s.color}|${s.fontSize}` : 'none',
		req: req ? `${req.textContent.trim()}|${req.getAttribute('href')}|${Math.round(req.getBoundingClientRect().height)}` : 'none' };
});
ok('Product 360: h1 top <= 560, price <= 640, add to cart <= 760 and above the action bar; order h1, price, gallery, add to cart, request',
	prod360.h1 >= 0 && prod360.h1 <= 560 && prod360.price > prod360.h1 && prod360.price <= 640 && prod360.gallery > prod360.price && prod360.cta > prod360.gallery
	&& prod360.cta <= 760 && prod360.ctaBottom <= prod360.barTop && prod360.request > prod360.cta, JSON.stringify(prod360));
const listBadge = await (async () => {
	const p = await browser.newPage({ viewport: { width: 360, height: 800 } });
	await p.goto(BASE + '/container-kaufen/', { waitUntil: 'load' });
	const b = await p.evaluate(() => { const e = document.querySelector('ul.products li.product .onsale'); if (!e) return 'none'; const s = getComputedStyle(e); return `${s.backgroundColor}|${s.color}|${s.fontSize}`; });
	await p.close();
	return b;
})();
ok('Product: sale badge in the price row, yellow with #202020 text, 14px, the same in the list; "Jetzt anfragen" to the request page with ?produkt=<slug>, >= 44px',
	prod360.badge === 'rgb(247, 198, 0)|rgb(32, 32, 32)|14px' && listBadge === prod360.badge
	&& /^Jetzt anfragen\|\S+\?produkt=20-fuss-container-gebraucht\|(4[4-9]|5\d)$/.test(prod360.req), `${prod360.badge} / list ${listBadge} / ${prod360.req}`);
// WooCommerce colours mapped to tokens: every visible text and background colour in <main> of the product page is a
// colour token of theme.css :root (or white / transparent).
const tokenRgb = [...Object.values(colourTokens).map((h) => {
	const x = h.replace('#', '').replace(/^(.)(.)(.)$/, '$1$1$2$2$3$3');
	return `rgb(${parseInt(x.slice(0, 2), 16)}, ${parseInt(x.slice(2, 4), 16)}, ${parseInt(x.slice(4, 6), 16)})`;
}), 'rgb(255, 255, 255)', 'rgba(0, 0, 0, 0)'];
const offTokens = await fsProduct.evaluate((allowed) => {
	const okSet = new Set(allowed);
	const out = new Set();
	for (const el of document.querySelectorAll('main *')) {
		if (el.closest('svg')) continue;
		const s = getComputedStyle(el);
		const b = el.getBoundingClientRect();
		if (s.display === 'none' || s.visibility === 'hidden' || b.width < 1 || b.height < 1) continue;
		const name = `${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]}`;
		if ([...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && !okSet.has(s.color)) out.add(`color ${s.color} ${name}`);
		if (!okSet.has(s.backgroundColor)) out.add(`background ${s.backgroundColor} ${name}`);
	}
	return [...out];
}, tokenRgb);
ok('Product 360: every text and background colour in <main> is a colour token (WooCommerce colours mapped)', offTokens.length === 0, offTokens.slice(0, 6).join(' | ') || `${tokenRgb.length} allowed`);
await fsProduct.waitForTimeout(1500);
const productCls = await fsProduct.evaluate(() => Math.round(window.__ccnCls * 10000) / 10000);
ok('Product 360: no layout shift while the page and the gallery start (CLS <= 0.01)', productCls <= 0.01, String(productCls));
await fsProduct.close();
// Breadcrumbs (DESIGN.md "Breadcrumbs"): from the SEO plugin, one <nav aria-label="Brotkrumen"> on products, categories,
// the shop, landings, posts and pages; the current page last and not linked; 14px --ccn-color-secondary; none on the front page.
const bcPage = await browser.newPage({ viewport: { width: 360, height: 800 } });
const crumbs = {};
for (const path of [T49_PRODUCT, CAT_STANDARD, '/container-shop/', '/container-kaufen/', '/containerzubehoer/',
	'/gebrauchte-seecontainer-in-cuxhaven/', '/datenschutzerklaerung/', '/']) {
	await bcPage.goto(BASE + path, { waitUntil: 'load' });
	crumbs[path] = await bcPage.evaluate(() => {
		const navs = document.querySelectorAll('nav[aria-label="Brotkrumen"]');
		if (navs.length !== 1) return `${navs.length} navs`;
		const items = [...navs[0].querySelectorAll('li')];
		const last = items[items.length - 1];
		const s = getComputedStyle(navs[0]);
		return `${items.length}|${!!last && !last.querySelector('a') && last.getAttribute('aria-current') === 'page'}|${s.fontSize}|${s.color}`;
	});
}
ok('Breadcrumbs: one nav "Brotkrumen" on product, category, shop, landings, post and page (current page last, not linked, 14px #605e5e), none on the front page',
	Object.entries(crumbs).every(([p, v]) => (p === '/' ? v === '0 navs' : /^[2-9]\|true\|14px\|rgb\(96, 94, 94\)$/.test(v))), JSON.stringify(crumbs));
// Catalogue order (production): discounted products first on the shop and the categories in the default order, so the
// first product is on sale whenever one is; a sort order the visitor picks (?orderby=) is left alone.
const saleOrder = {};
for (const path of ['/container-shop/', CAT_STANDARD, CAT_SPECIAL, '/container-shop/?orderby=menu_order']) {
	await bcPage.goto(BASE + path, { waitUntil: 'domcontentloaded' });
	saleOrder[path] = await bcPage.evaluate(() => [...document.querySelectorAll('ul.products > li.product')].map((li) => (li.querySelector('.onsale') ? 'S' : '-')).join(''));
}
const saleFirstOrder = (f) => !!f && (!f.includes('S') || (f[0] === 'S' && !/-S/.test(f)));
ok('Catalogue: discounted products first on the shop and categories (the first product on sale when any is), ?orderby= from the visitor left alone',
	Object.entries(saleOrder).every(([p, f]) => (p.includes('orderby') ? /-S/.test(f) : saleFirstOrder(f) && f.includes('S'))), JSON.stringify(saleOrder));
await bcPage.close();

// Trust & FAQ (T-50, DESIGN.md "Trust", "FAQ", "Logos"). Trust chips are static (inline SVG, no request). The live
// reviews (Trustindex Google widget + Trustpilot TrustBox) start only when their facade comes within 1200px: before
// any scroll the front page makes 0 requests to Trustindex, Trustpilot, Google photos or the reviews endpoint, the
// widget markup is not in the document, and the facade holds its reserved height. Near the facade the endpoint
// delivers the widget HTML and the third-party scripts are requested; formatting needs the CDNs (unreachable ->
// skipped, not FAIL). Neither widget may set cookies or web storage (else a click facade until consent, T-61).
const t50Third = /trustindex\.io|trustpilot\.com|googleusercontent\.com|\/wp-json\/ccn\/v1\/reviews/;
const t50Text = (p, sel) => p.evaluate((s) => [...document.querySelectorAll(s)].map((e) => e.textContent.replace(/\s+/g, ' ').trim()).join(' | '), sel);
const t50Doc = await (await fetch(BASE + '/?cb=' + Date.now())).text();
ok('Reviews: the widget markup and third-party URLs are not part of the front page document (facade only)',
	t50Doc.includes('ccn-reviews-facade') && !/class="ti-widget|cdn\.trustindex\.io|widget\.trustpilot\.com\/trustboxes/.test(t50Doc), `facade ${t50Doc.includes('ccn-reviews-facade')}`);
const t50Ctx = await browser.newContext({ viewport: { width: 360, height: 800 } });
const t50 = await t50Ctx.newPage();
const t50Reqs = [];
const t50Failed = [];
t50.on('request', (r) => { if (t50Third.test(r.url())) t50Reqs.push(r.url()); });
t50.on('requestfailed', (r) => { if (t50Third.test(r.url())) t50Failed.push(r.url()); });
await t50.goto(BASE + '/', { waitUntil: 'load' });
await t50.addStyleTag({ content: noSmooth });
await t50.waitForTimeout(1500);
const t50Hero = await t50Text(t50, '.ccn-hero .ccn-trust');
ok('Trust: the home hero trust row shows 13 Trustpilot reviews and 126 Google reviews (Site Settings)', /13 Bewertungen/.test(t50Hero) && /126 Google-Bewertungen/.test(t50Hero), t50Hero.slice(0, 160));
const t50Box = await t50.evaluate(() => {
	const f = document.querySelector('.ccn-reviews-facade');
	const g = f && f.querySelector('.ccn-reviews-google');
	return f && g ? { reserved: f.classList.contains('is-reserved'), google: Math.round(g.getBoundingClientRect().height), top: Math.round(f.getBoundingClientRect().top + scrollY) } : null;
});
ok('Reviews 360: before any scroll 0 requests to Trustindex, Trustpilot, Google photos or the reviews endpoint', !!t50Box && t50Reqs.length === 0, t50Reqs.slice(0, 3).join(' | ') || JSON.stringify(t50Box));
ok('Reviews 360: the facade reserves the Google box before the start (>= 506px, no layout shift)', !!t50Box && t50Box.reserved && t50Box.google >= 506, JSON.stringify(t50Box));
for (let y = 0; y < (t50Box ? t50Box.top : 0); y += 700) { await jump(t50, y); await t50.waitForTimeout(120); }
const t50Items = await t50.waitForFunction(() => document.querySelectorAll('.ccn-reviews-google .ti-review-item').length, null, { timeout: 15000 }).then((h) => h.jsonValue()).catch(() => 0);
await t50.waitForFunction(() => !!document.querySelector('.ccn-reviews-google.is-ready') && !!document.querySelector('.ccn-reviews-trustpilot iframe'), null, { timeout: 12000 }).catch(() => null);
await t50.waitForTimeout(1500);
const t50Asked = { endpoint: t50Reqs.some((u) => u.includes('/wp-json/ccn/v1/reviews')), loader: t50Reqs.some((u) => u.includes('cdn.trustindex.io/loader.js')), trustbox: t50Reqs.some((u) => u.includes('widget.trustpilot.com/bootstrap')) };
ok('Reviews: near the facade the widget HTML arrives (>= 1 Google review) and the Trustindex loader and TrustBox are requested', t50Items >= 1 && t50Asked.endpoint && t50Asked.loader && t50Asked.trustbox, JSON.stringify({ items: t50Items, ...t50Asked }));
const t50Live = await t50.evaluate(() => {
	const w = document.querySelector('.ccn-reviews-google div.ti-widget');
	const f = document.querySelector('.ccn-reviews-trustpilot iframe');
	const g = document.querySelector('.ccn-reviews-google');
	return { ready: !!document.querySelector('.ccn-reviews-google.is-ready'), widget: w ? Math.round(w.getBoundingClientRect().height) : 0, trustbox: f ? Math.round(f.getBoundingClientRect().height) : 0, google: g ? Math.round(g.getBoundingClientRect().height) : 0 };
});
const t50CdnDown = t50Failed.some((u) => /cdn\.trustindex\.io\/loader|widget\.trustpilot\.com\/bootstrap/.test(u));
ok(`Reviews: both widgets formatted inside the reserved boxes (Google box height unchanged, TrustBox 52px)${t50CdnDown ? ' — skipped: CDN unreachable' : ''}`,
	t50CdnDown || (!!t50Box && t50Live.ready && t50Live.widget > 0 && t50Live.google === t50Box.google && t50Live.trustbox === 52), JSON.stringify(t50Live) + (t50CdnDown ? ' ' + t50Failed.join(' | ') : ''));
const t50Storage = await t50.evaluate(() => Object.keys(localStorage).length + Object.keys(sessionStorage).length);
const t50Cookies = (await t50Ctx.cookies()).length;
ok('Reviews: no cookies and no web storage once both widgets ran (else a click facade until consent)', t50Cookies === 0 && t50Storage === 0, `${t50Cookies} cookies, ${t50Storage} storage keys`);
await t50Ctx.close();
// Widget hosts blocked (ad blocker, corporate firewall): within 10 s of the start the facade drops its reserve — the
// Google box collapses (< 100px), the TrustBox box goes — and the profile links stay; no JS error. No permanent hole.
const t50BlockCtx = await browser.newContext({ viewport: { width: 360, height: 800 } });
await t50BlockCtx.route(/trustindex\.io|trustpilot\.com|googleusercontent\.com/, (r) => r.abort());
const t50Block = await t50BlockCtx.newPage();
const t50BlockErr = [];
t50Block.on('pageerror', (e) => t50BlockErr.push(e.message));
t50Block.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|net::ERR_/.test(m.text())) t50BlockErr.push(m.text()); });
await t50Block.goto(BASE + '/', { waitUntil: 'load' });
await t50Block.addStyleTag({ content: noSmooth });
const t50BlockTop = await t50Block.evaluate(() => { const f = document.querySelector('.ccn-reviews-facade'); return f ? Math.round(f.getBoundingClientRect().top + scrollY) : 0; });
for (let y = 0; y < t50BlockTop; y += 700) { await jump(t50Block, y); await t50Block.waitForTimeout(120); }
await t50Block.waitForFunction(() => { const f = document.querySelector('.ccn-reviews-facade'); return !!f && !f.classList.contains('is-reserved'); }, null, { timeout: 10000 }).catch(() => null);
await t50Block.waitForTimeout(300);
const t50Blocked = await t50Block.evaluate(() => {
	const f = document.querySelector('.ccn-reviews-facade');
	const h = (s) => { const e = f.querySelector(s); return e ? Math.round(e.getBoundingClientRect().height) : 0; };
	return f ? { reserved: f.classList.contains('is-reserved'), google: h('.ccn-reviews-google'), trustbox: h('.ccn-reviews-trustpilot'), chips: h('.ccn-trust--compact') } : null;
});
ok('Reviews with the widget hosts blocked: within 10 s the reserve drops (Google box < 100px, TrustBox box gone), the profile links stay, 0 JS errors',
	!!t50Blocked && !t50Blocked.reserved && t50Blocked.google < 100 && t50Blocked.trustbox === 0 && t50Blocked.chips > 0 && t50BlockErr.length === 0, JSON.stringify({ ...t50Blocked, errors: t50BlockErr.slice(0, 2) }));
await t50BlockCtx.close();
const t50Wide = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const t50WideReqs = [];
t50Wide.on('request', (r) => { if (t50Third.test(r.url())) t50WideReqs.push(r.url()); });
await t50Wide.goto(BASE + '/', { waitUntil: 'load' });
await t50Wide.waitForTimeout(1500);
const t50WideBox = await t50Wide.evaluate(() => { const g = document.querySelector('.ccn-reviews-facade.is-reserved .ccn-reviews-google'); return g ? Math.round(g.getBoundingClientRect().height) : 0; });
ok('Reviews 1440: before any scroll 0 third-party requests, the Google box reserved (>= 296px)', t50WideReqs.length === 0 && t50WideBox >= 296, `${t50WideReqs.length} requests, box ${t50WideBox}px`);
// Footer: the two badges of the production footer from the shared trust row (compact), 44px targets.
const t50Foot = await t50Wide.evaluate(() => [...document.querySelectorAll('.footer-badges .ccn-trust a')].map((a) => ({ text: a.textContent.replace(/\s+/g, ' ').trim(), h: Math.round(a.getBoundingClientRect().height) })));
ok('Footer badges as on production: «Trustpilot 4,5» and «Google-Bewertungen», 44px targets', t50Foot.length === 2 && /^Trustpilot 4,5/.test(t50Foot[0].text)
	&& /^Google-Bewertungen/.test(t50Foot[1].text) && t50Foot.every((a) => a.h >= 44), JSON.stringify(t50Foot));
await t50Wide.close();
// Trust bar under the landing hero: the same chips (13, 126, AVPQ) within the first two screens at 360.
const t50Bar = await browser.newPage({ viewport: { width: 360, height: 800 } });
await t50Bar.goto(BASE + '/container-kaufen/', { waitUntil: 'load' });
const t50BarText = await t50Text(t50Bar, '.ccn-trust-bar .ccn-trust');
const t50BarTop = await t50Bar.evaluate(() => { const b = document.querySelector('.ccn-trust-bar'); return b ? Math.round(b.getBoundingClientRect().top + scrollY) : -1; });
ok('Trust bar (/container-kaufen/): 13 Trustpilot and 126 Google reviews plus AVPQ, within the first two screens at 360', /13 Bewertungen/.test(t50BarText) && /126 Google-Bewertungen/.test(t50BarText)
	&& /AVPQ/.test(t50BarText) && t50BarTop >= 0 && t50BarTop < 1600, `top ${t50BarTop}: ${t50BarText.slice(0, 120)}`);
// FAQ: native details; Enter on the question and a click open the answer; questions h3 under the section h2.
const t50Faq = await t50Bar.evaluate(() => ({ n: document.querySelectorAll('details.ccn-faq-item').length, h2: !!document.querySelector('.ccn-faq h2'), h3: document.querySelectorAll('details.ccn-faq-item > summary > h3').length }));
await t50Bar.focus('details.ccn-faq-item summary').catch(() => null);
await t50Bar.keyboard.press('Enter');
const t50Key = await t50Bar.evaluate(() => { const d = document.querySelector('details.ccn-faq-item'); return !!d && d.open && d.querySelector('.ccn-faq-answer').getBoundingClientRect().height > 0; });
await t50Bar.click('details.ccn-faq-item:nth-of-type(2) summary').catch(() => null);
const t50Click = await t50Bar.evaluate(() => { const d = document.querySelectorAll('details.ccn-faq-item')[1]; return !!d && d.open; });
ok('FAQ (/container-kaufen/): >= 3 details, Enter and click open an answer, questions h3 under the h2', t50Faq.n >= 3 && t50Faq.h2 && t50Faq.h3 === t50Faq.n && t50Key && t50Click, JSON.stringify({ ...t50Faq, enter: t50Key, click: t50Click }));
await t50Bar.close();
// Schema: no FAQPage node and no aggregateRating anywhere (team decision 22.09.2026); FAQ questions only as on
// production — as WebPage.mainEntity once Rank Math is there (T-54), none before.
const t50Ld = [];
for (const p of ['/', '/container-kaufen/', '/container-mieten/', INSPIRATION, '/ueber-uns/', '/product/20-fuss-container-gebraucht/']) {
	const html = await (await fetch(`${BASE}${p}?cb=${Date.now()}`)).text();
	const ld = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]).join(' ');
	t50Ld.push({ p, faqPage: (ld.match(/"FAQPage"/g) || []).length, question: (ld.match(/"Question"/g) || []).length, rating: (html.match(/aggregateRating/g) || []).length,
		rankMath: html.includes('rank-math-schema'), details: (html.match(/<details class="ccn-faq-item"/g) || []).length });
}
ok('Schema: FAQPage 0 and aggregateRating 0 on six pages', t50Ld.every((r) => r.faqPage === 0 && r.rating === 0), JSON.stringify(t50Ld.map((r) => [r.p, r.faqPage, r.rating])));
ok('Schema: FAQ questions as on production (Rank Math: WebPage.mainEntity = FAQ items; before T-54: none)',
	t50Ld.every((r) => (r.rankMath ? r.question === r.details : r.question === 0)) && t50Ld.some((r) => r.details >= 3), JSON.stringify(t50Ld.map((r) => [r.p, r.details, r.question, r.rankMath])));
// Logos (code level: no page carries the block before the migration of /ueber-uns/zertifikate/, T-53a/b).
const t50Logos = themeFile('blocks/lists/logos.php');
ok('Logos block: lazy images, alt from the field, 48px high grey marks', /'loading'\s*=>\s*'lazy'/.test(t50Logos) && /'alt'\s*=>\s*\$ccn_item\['alt'\]/.test(t50Logos)
	&& /\.ccn-logo-img\{[^}]*height:3rem[^}]*filter:grayscale\(1\)/.test(themeCss), 'blocks/lists/logos.php, theme.css .ccn-logo-img');

// Request form (T-51, DESIGN.md "Forms"). The form card block (acf/form-card) replaces the hand-built
// core/group.ccn-form-card of the landings; Contact Form 7's CSS/JS load only where a form is (the block or the
// old shortcode), so a page without a form requests nothing of CF7.
const T51_LANDINGS = ['/container-kaufen/', '/container-mieten/', '/container-transport-logistik/', '/container-modifikation-umbau-dienstleistungen/'];
const T51_CONTACT = ['/kontakt-beratung/', '/container-angebot-anfordern/'];
const t51 = await browser.newPage({ viewport: { width: 360, height: 800 } });
const t51Req = [];
t51.on('request', (r) => t51Req.push(r.url()));
const t51Pages = {};
for (const path of [...T51_LANDINGS, ...T51_CONTACT, '/', '/containerzubehoer/']) {
	t51Req.length = 0;
	await t51.goto(`${BASE}${path}?cb=${Date.now()}`, { waitUntil: 'load' });
	t51Pages[path] = await t51.evaluate(() => ({
		card: document.querySelectorAll('section.ccn-form-card form.wpcf7-form').length,
		group: document.querySelectorAll('.wp-block-group.ccn-form-card').length,
		formsDefer: [...document.scripts].some((s) => /\/assets\/js\/forms\.js/.test(s.src) && s.defer),
	}));
	t51Pages[path].cf7 = t51Req.filter((u) => /\/contact-form-7\//.test(u)).length;
	t51Pages[path].forms = t51Req.filter((u) => /\/assets\/js\/forms\.js/.test(u)).length;
}
const t51CardPages = [...T51_LANDINGS, ...T51_CONTACT];
ok('Request form: the form card block on the 4 landings and the 2 contact pages, no hand-built ccn-form-card group left',
	t51CardPages.every((p) => t51Pages[p].card === 1 && t51Pages[p].group === 0), JSON.stringify(t51CardPages.map((p) => [p, t51Pages[p].card, t51Pages[p].group])));
ok('Request form: CF7 CSS/JS on every page with a form, no CF7 request on / and /containerzubehoer/',
	[...T51_LANDINGS, ...T51_CONTACT].every((p) => t51Pages[p].cf7 >= 2) && ['/', '/containerzubehoer/'].every((p) => t51Pages[p].cf7 === 0),
	JSON.stringify(Object.entries(t51Pages).map(([p, s]) => [p, s.cf7])));
// The fields (T-51): visible labels, <= 4 required, consent after the fields, «Anfrage senden» >= 48px and enabled
// from the start (consent as validation: CF7 would otherwise disable the button), hidden produkt/quelle, German form
// language; forms.js (defer, <= 1 KB) only where the form is.
const t51FormsJs = themeFile('assets/js/forms.js');
ok('Request form: forms.js (defer) wherever the form is, not on / and /containerzubehoer/; <= 1 KB, no form code in main.js',
	[...T51_LANDINGS, ...T51_CONTACT].every((p) => t51Pages[p].forms === 1 && t51Pages[p].formsDefer) && ['/', '/containerzubehoer/'].every((p) => t51Pages[p].forms === 0)
	&& t51FormsJs.length > 0 && t51FormsJs.length <= 1024 && !/wpcf7/.test(themeFile('assets/js/main.js')),
	`${JSON.stringify(Object.entries(t51Pages).map(([p, s]) => [p, s.forms, s.formsDefer]))} forms.js ${t51FormsJs.length} B`);
for (const path of T51_CONTACT) {
	await t51.goto(`${BASE}${path}?cb=${Date.now()}`, { waitUntil: 'load' });
	const f = await t51.evaluate(() => {
		const form = document.querySelector('form.wpcf7-form');
		if (!form) return null;
		const fields = [...form.querySelectorAll('input:not([type=hidden]):not([type=submit]), textarea, select')];
		const label = (el) => (((el.id && form.querySelector(`label[for="${CSS.escape(el.id)}"]`)) || el.closest('label') || {}).textContent || '').trim();
		const consent = form.querySelector('.wpcf7-acceptance input[type=checkbox]');
		const submit = form.querySelector('.wpcf7-submit');
		return {
			fields: fields.map((el) => `${el.name}=${label(el).slice(0, 22)}`),
			unlabelled: fields.filter((el) => !label(el)).map((el) => el.name || el.type),
			required: fields.filter((el) => el.required || el.getAttribute('aria-required') === 'true' || (el === consent && !el.closest('.optional'))).map((el) => el.name),
			consentLast: !!consent && fields[fields.length - 1] === consent && !!consent.closest('label') && !!consent.closest('label').querySelector('a[href*="/datenschutzerklaerung/"]'),
			submit: submit ? submit.value : null, submitH: submit ? Math.round(submit.getBoundingClientRect().height) : 0, disabled: submit ? submit.disabled : null,
			hidden: [...form.querySelectorAll('input[type=hidden]')].map((h) => h.name).filter((n) => !n.startsWith('_')),
			lang: form.closest('.wpcf7') ? form.closest('.wpcf7').getAttribute('lang') : null,
		};
	});
	ok(`Request form ${path}: every field has a visible label (label[for], the consent its own label)`, !!f && f.fields.length >= 5 && f.unlabelled.length === 0,
		f ? f.fields.join(', ') + (f.unlabelled.length ? ` | unlabelled: ${f.unlabelled.join()}` : '') : 'no form');
	ok(`Request form ${path}: 3-4 required, consent last with the Datenschutz link, hidden produkt and quelle`,
		!!f && f.required.length >= 3 && f.required.length <= 4 && f.consentLast && f.hidden.join() === 'produkt,quelle',
		f ? JSON.stringify({ required: f.required, consentLast: f.consentLast, hidden: f.hidden }) : 'no form');
	ok(`Request form ${path}: submit «Anfrage senden» >= 48px, enabled before the consent is ticked, form lang de`,
		!!f && f.submit === 'Anfrage senden' && f.submitH >= 48 && f.disabled === false && /^de/.test(f.lang || ''),
		f ? JSON.stringify({ submit: f.submit, h: f.submitH, disabled: f.disabled, lang: f.lang }) : 'no form');
}
// Empty submit at 360: errors under their fields (CF7 sets aria-invalid and aria-describedby), the summary above
// the fields, the focus on the first invalid field (forms.js), the error colour a token at >= 4.5:1 on the card.
await t51.goto(`${BASE}/kontakt-beratung/?cb=${Date.now()}`, { waitUntil: 'load' });
await t51.waitForFunction(() => { const f = document.querySelector('form.wpcf7-form'); return !!f && !!f.wpcf7; }, null, { timeout: 15000 }).catch(() => null);
await t51.click('form.wpcf7-form .wpcf7-submit', { timeout: 10000 }).catch(() => null);
await t51.waitForFunction(() => document.querySelectorAll('form.wpcf7-form .wpcf7-not-valid-tip').length >= 3, null, { timeout: 20000 }).catch(() => null);
await t51.waitForTimeout(400);
const t51Inv = await t51.evaluate(() => {
	const form = document.querySelector('form.wpcf7-form');
	const hex = (c) => `#${c.match(/\d+/g).slice(0, 3).map((n) => (+n).toString(16).padStart(2, '0')).join('')}`;
	const tips = [...form.querySelectorAll('.wpcf7-not-valid-tip')];
	const invalid = [...form.querySelectorAll('[aria-invalid="true"]')];
	const out = form.querySelector('.wpcf7-response-output');
	const firstWrap = form.querySelector('.wpcf7-form-control-wrap');
	// The background the error text sits on: its nearest ancestor with an opaque background (the form card).
	let box = tips[0] || form;
	while (box.parentElement && !/^rgb\(/.test(getComputedStyle(box).backgroundColor)) box = box.parentElement;
	return {
		tips: tips.length,
		below: tips.every((t) => { const c = t.closest('.wpcf7-form-control-wrap').querySelector('.wpcf7-form-control'); return !!c && t.getBoundingClientRect().top >= c.getBoundingClientRect().bottom - 1; }),
		described: invalid.map((el) => { const d = el.getAttribute('aria-describedby'); const t = d && document.getElementById(d); return `${el.name}:${t ? t.textContent.trim().slice(0, 26) : 'none'}`; }),
		active: document.activeElement ? document.activeElement.name || document.activeElement.className : null,
		activeFirst: invalid.length > 0 && document.activeElement === invalid[0],
		summaryAbove: !!out && getComputedStyle(out).display !== 'none' && !!firstWrap && out.getBoundingClientRect().bottom <= firstWrap.getBoundingClientRect().top,
		summary: out ? out.textContent.trim().slice(0, 40) : '',
		tipColor: tips[0] ? hex(getComputedStyle(tips[0]).color) : null, tipSize: tips[0] ? getComputedStyle(tips[0]).fontSize : null,
		boxBg: /^rgb\(/.test(getComputedStyle(box).backgroundColor) ? hex(getComputedStyle(box).backgroundColor) : '#ffffff', border: invalid[0] ? hex(getComputedStyle(invalid[0]).borderTopColor) : null,
	};
});
const t51TipRatio = t51Inv.tipColor ? ratio(t51Inv.tipColor, t51Inv.boxBg) : 0;
ok('Request form, empty submit at 360: >= 3 errors under their fields, every invalid field described by its error, focus on the first invalid field',
	t51Inv.tips >= 3 && t51Inv.below && t51Inv.described.length >= 3 && t51Inv.described.every((d) => !d.endsWith(':none')) && t51Inv.activeFirst,
	JSON.stringify({ tips: t51Inv.tips, below: t51Inv.below, described: t51Inv.described, active: t51Inv.active }));
ok('Request form errors: --ccn-color-error 14px at >= 4.5:1 on the form card, red field border, summary above the fields',
	t51Inv.tipColor === '#b3261e' && t51Inv.tipSize === '14px' && t51TipRatio >= 4.5 && t51Inv.border === '#b3261e' && t51Inv.summaryAbove,
	JSON.stringify({ color: t51Inv.tipColor, size: t51Inv.tipSize, on: t51Inv.boxBg, ratio: t51TipRatio.toFixed(2), border: t51Inv.border, summary: t51Inv.summary, above: t51Inv.summaryAbove }));
// Without JS the form renders and posts to its own page; CF7 answers the POST with a reload.
const t51NoJs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 360, height: 800 } });
const t51NoJsPage = await t51NoJs.newPage();
await t51NoJsPage.goto(`${BASE}/kontakt-beratung/?cb=${Date.now()}`, { waitUntil: 'load' });
const t51Post = await t51NoJsPage.evaluate(() => {
	const f = document.querySelector('form.wpcf7-form');
	return f ? { method: f.method, action: f.getAttribute('action'), fields: f.querySelectorAll('input[name="your-name"], textarea[name="your-message"]').length,
		h: Math.round(f.getBoundingClientRect().height), submit: !!f.querySelector('.wpcf7-submit:not([disabled])') } : null;
});
ok('Request form without JS: renders and posts to its page (CF7 handles the POST with a reload)',
	!!t51Post && t51Post.method === 'post' && /\/kontakt-beratung\//.test(t51Post.action || '') && t51Post.fields === 2 && t51Post.h > 200 && t51Post.submit, JSON.stringify(t51Post));
await t51NoJs.close();
// Contact pages (T-51): hero band (photo + h1) and the form card first; at 360x800 the h1 and the form (with its
// first field) start in the first screen. The hero leaves its CTA button out when the page opens with the form
// (decided by the first block, not by a slug), the phone line stays; a landing with the form further down keeps it.
const t51First = {};
for (const path of [...T51_CONTACT, '/container-kaufen/']) {
	await t51.goto(`${BASE}${path}?cb=${Date.now()}`, { waitUntil: 'load' });
	await t51.waitForSelector('h1', { timeout: 15000 }).catch(() => null);
	t51First[path] = await t51.evaluate(() => {
		const top = (s) => { const e = document.querySelector(s); return e ? Math.round(e.getBoundingClientRect().top + scrollY) : null; };
		const hero = document.querySelector('.ccn-page-hero');
		const col = document.querySelector('.ccn-landing-full, .ccn-landing-main');
		const first = col && col.querySelector(':scope > section');
		return { h1: top('.ccn-page-hero h1'), form: top('form.wpcf7-form'), field: top('form.wpcf7-form input[name="your-name"]'), photo: !!(hero && hero.querySelector('img.ccn-page-hero-img')),
			cta: hero ? hero.querySelectorAll('.ccn-hero-cta .btn').length : -1, phone: hero ? hero.querySelectorAll('a.ccn-phone-line[href^="tel:"]').length : -1, first: first ? first.classList[0] : null };
	});
}
ok('Contact pages 360x800: hero photo, h1, the form and its first field in the first screen, the form card first',
	T51_CONTACT.every((p) => { const f = t51First[p]; return f.photo && f.h1 !== null && f.h1 <= 800 && f.form !== null && f.form <= 800 && f.field !== null && f.field <= 800 && f.first === 'ccn-form-card'; }),
	JSON.stringify(t51First));
ok('Hero CTA by content: pages that open with the form show no CTA button but the phone line; /container-kaufen/ keeps its CTA',
	T51_CONTACT.every((p) => t51First[p].cta === 0 && t51First[p].phone === 1) && t51First['/container-kaufen/'].cta === 1 && t51First['/container-kaufen/'].phone === 1,
	JSON.stringify(Object.entries(t51First).map(([p, f]) => [p, f.cta, f.phone])));
// After sending (synthetic CF7 events, no submission): CF7 resets a sent form and hides the message meanwhile, so
// forms.js waits for wpcf7reset and then moves the focus to the message (aria-hidden removed, tabindex -1).
await t51.goto(`${BASE}/kontakt-beratung/?cb=${Date.now()}`, { waitUntil: 'load' });
await t51.waitForFunction(() => { const f = document.querySelector('form.wpcf7-form'); return !!f && !!f.wpcf7; }, null, { timeout: 15000 }).catch(() => null);
const t51Sent = await t51.evaluate(async () => {
	const form = document.querySelector('form.wpcf7-form');
	const out = form.querySelector('.wpcf7-response-output');
	const tick = () => new Promise((r) => setTimeout(r, 80));
	const status = (s) => { form.className = form.className.replace(/\b(init|resetting|sent)\b/g, '').trim() + ` ${s}`; form.setAttribute('data-status', s); };
	out.textContent = 'Vielen Dank für Ihre Nachricht!';
	status('resetting');
	form.dispatchEvent(new CustomEvent('wpcf7mailsent', { bubbles: true, detail: { contactFormId: 340, status: 'mail_sent' } }));
	await tick();
	const whileResetting = document.activeElement === out;
	status('sent');
	form.dispatchEvent(new CustomEvent('wpcf7reset', { bubbles: true, detail: { contactFormId: 340 } }));
	await tick();
	return { whileResetting, after: document.activeElement === out, ariaHidden: out.getAttribute('aria-hidden'), tabindex: out.getAttribute('tabindex'), visible: out.getBoundingClientRect().height > 0 };
});
ok('Request form after sending (synthetic CF7 events): the focus moves to the message once CF7 has reset the form, no aria-hidden on it',
	!t51Sent.whileResetting && t51Sent.after && t51Sent.ariaHidden === null && t51Sent.tabindex === '-1' && t51Sent.visible, JSON.stringify(t51Sent));
await t51.close();

// SEO plugin (T-54, DESIGN.md "Breadcrumbs", inc/schema.php): Rank Math replaces Yoast. One <title>, at most one
// meta description (Rank Math prints none without a source: product and post have one now, the pages get theirs with
// the production meta in T-53c); breadcrumbs from Rank Math with «Startseite» and one BreadcrumbList that names the
// visible crumbs; one company node on the front page (Organization + Store, as production); the sitemap index.
const T54_PAGES = ['/', '/container-kaufen/', '/container-mieten/', '/kontakt-beratung/', T49_PRODUCT, '/gebrauchte-seecontainer-in-cuxhaven/'];
const T54_BUSINESS = ['LocalBusiness', 'Store'];
const t54Types = (n) => [].concat(n['@type'] || []);
const t54 = {};
for (const p of T54_PAGES) {
	const html = await (await fetch(`${BASE}${p}?cb=${Date.now()}`)).text();
	const head = html.slice(0, html.indexOf('</head>'));
	const nodes = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/g)]
		.flatMap((m) => { try { const d = JSON.parse(m[1]); return d['@graph'] || [d]; } catch { return [{ '@type': 'INVALID' }]; } });
	const crumbs = (html.match(/<nav class="ccn-breadcrumbs[^"]*" aria-label="Brotkrumen"><ol>([\s\S]*?)<\/ol><\/nav>/) || ['', ''])[1];
	const bc = nodes.filter((n) => t54Types(n).includes('BreadcrumbList'));
	t54[p] = {
		titles: (head.match(/<title>[^<]+<\/title>/g) || []).length, emptyTitle: /<title>\s*<\/title>/.test(head),
		desc: [...head.matchAll(/<meta name="description" content="([^"]*)"/g)].map((m) => m[1].length),
		yoast: (html.match(/yoast-schema-graph|optimized with the Yoast SEO plugin/g) || []).length, rankMath: html.includes('class="rank-math-schema"'),
		invalid: nodes.filter((n) => t54Types(n).includes('INVALID')).length,
		business: nodes.filter((n) => t54Types(n).some((t) => T54_BUSINESS.includes(t))).map((n) => `${t54Types(n).join('+')}${n['@id'] ? ' ' + n['@id'].replace(BASE, '') : ''}`),
		org: nodes.filter((n) => t54Types(n).includes('Organization')).length, website: nodes.filter((n) => t54Types(n).includes('WebSite')).length,
		bc: bc.length, bcNames: bc.length ? bc[0].itemListElement.map((i) => i.item.name) : [],
		crumbs: [...crumbs.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].map((m) => m[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim()),
	};
}
const t54Html = (s) => s.replace(/&#0?39;|&#x27;/g, "'");
ok('SEO plugin: Rank Math only (its JSON-LD on six pages, valid), 0 Yoast marks',
	T54_PAGES.every((p) => t54[p].rankMath && t54[p].yoast === 0 && t54[p].invalid === 0), JSON.stringify(T54_PAGES.map((p) => [p, t54[p].rankMath, t54[p].yoast, t54[p].invalid])));
ok('SEO plugin: one non-empty <title> and at most one non-empty meta description on six pages; product and post have theirs (pages: T-53c)',
	T54_PAGES.every((p) => t54[p].titles === 1 && !t54[p].emptyTitle && t54[p].desc.length <= 1 && t54[p].desc.every((l) => l > 0))
	&& t54[T49_PRODUCT].desc.length === 1 && t54['/gebrauchte-seecontainer-in-cuxhaven/'].desc.length === 1,
	JSON.stringify(T54_PAGES.map((p) => [p, t54[p].titles, t54[p].desc])));
ok('Breadcrumbs (Rank Math): landing, product and post — one BreadcrumbList naming the visible crumbs, «Startseite» first, the product path with its category',
	['/container-kaufen/', T49_PRODUCT, '/gebrauchte-seecontainer-in-cuxhaven/'].every((p) => t54[p].bc === 1 && t54[p].crumbs[0] === 'Startseite'
		&& JSON.stringify(t54[p].crumbs) === JSON.stringify(t54[p].bcNames.map(t54Html))) && t54[T49_PRODUCT].crumbs.length >= 4,
	JSON.stringify(['/container-kaufen/', T49_PRODUCT, '/gebrauchte-seecontainer-in-cuxhaven/'].map((p) => [p, t54[p].bc, t54[p].crumbs.join(' > ')])));
ok('Schema: one company node on the front page (Rank Math Organization + Store, /#organization), no second Organization or WebSite; none doubled on the product',
	t54['/'].business.length === 1 && /^Organization\+Store \/#organization$/.test(t54['/'].business[0]) && t54['/'].org === 1 && t54['/'].website === 1
	&& t54[T49_PRODUCT].business.length <= 1 && t54[T49_PRODUCT].org <= 1 && t54[T49_PRODUCT].website <= 1,
	JSON.stringify({ home: t54['/'].business, homeOrg: t54['/'].org, homeWebsite: t54['/'].website, product: t54[T49_PRODUCT].business }));
const t54Index = await fetch(`${BASE}/sitemap_index.xml?cb=${Date.now()}`);
const t54IndexXml = await t54Index.text();
const t54Robots = await (await fetch(`${BASE}/robots.txt?cb=${Date.now()}`)).text();
const t54Maps = [...t54IndexXml.matchAll(/<sitemap>\s*<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(BASE, ''));
ok('Sitemap: /sitemap_index.xml 200 with >= 4 sitemaps (page, post, product, product_cat), robots.txt points to it',
	t54Index.status === 200 && t54Maps.length >= 4 && ['/page-sitemap.xml', '/post-sitemap.xml', '/product-sitemap.xml', '/product_cat-sitemap.xml'].every((s) => t54Maps.includes(s))
	&& t54Robots.includes(`Sitemap: ${BASE}/sitemap_index.xml`), JSON.stringify({ status: t54Index.status, maps: t54Maps, robots: t54Robots.includes('sitemap_index.xml') }));
// Breadcrumbs geometry (roadmap 149): on the landings and contact pages at 1440 the trail starts at the container edge
// like the hero text (x 136), not in the 820px column of posts; at 360 a long product trail wraps and keeps the current page.
const t54Geo = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const t54X = {};
for (const p of ['/container-kaufen/', '/container-mieten/', '/kontakt-beratung/', '/container-angebot-anfordern/']) {
	await t54Geo.goto(`${BASE}${p}?cb=${Date.now()}`, { waitUntil: 'domcontentloaded' });
	t54X[p] = await t54Geo.evaluate(() => {
		const li = document.querySelector('nav[aria-label="Brotkrumen"] li');
		const hero = document.querySelector('.ccn-page-hero-inner');
		return li && hero ? [Math.round(li.getBoundingClientRect().x), Math.round(hero.getBoundingClientRect().x + parseFloat(getComputedStyle(hero).paddingLeft))] : null;
	});
}
ok('Breadcrumbs 1440: landings and contact pages start the trail at the container edge (x of the hero text, 136px)',
	Object.values(t54X).every((v) => v && Math.abs(v[0] - v[1]) <= 1 && Math.abs(v[0] - 136) <= 1), JSON.stringify(t54X));
await t54Geo.setViewportSize({ width: 360, height: 800 });
await t54Geo.goto(`${BASE}${T49_PRODUCT}?cb=${Date.now()}`, { waitUntil: 'domcontentloaded' });
const t54Fit = await t54Geo.evaluate(() => {
	const ol = document.querySelector('nav[aria-label="Brotkrumen"] ol');
	return ol ? { items: ol.children.length, scroll: ol.scrollWidth, client: ol.clientWidth, last: Math.round(ol.lastElementChild.getBoundingClientRect().width), page: document.documentElement.scrollWidth } : null;
});
ok('Breadcrumbs 360: the product trail (>= 4 crumbs) fits its line box, the current page keeps >= 80px, no page overflow',
	!!t54Fit && t54Fit.items >= 4 && t54Fit.scroll <= t54Fit.client && t54Fit.last >= 80 && t54Fit.page <= 360, JSON.stringify(t54Fit));
await t54Geo.close();

// Migration (T-53a, DESIGN.md "How to measure"): pages, posts, products, forms and media of production (through the
// donor dump). No page names the donor host any more (the knowledge graph logo in the JSON-LD was the last one); the
// product and category sitemaps list the production catalogue under the production category base; the menu group of
// the product categories answers 200 from every link; a product trail runs «Startseite › shop page › its category ›
// product» without the rebuild's old parent category.
const T53A_PAGES = ['/', '/container-kaufen/', '/container-mieten/', '/container-shop/', CAT_STANDARD, T49_PRODUCT,
	'/gebrauchte-seecontainer-in-cuxhaven/', '/kontakt-beratung/', '/projekt-asphaltmischwerk/'];
const t53aDonor = {};
for (const p of T53A_PAGES) {
	const res = await fetch(`${BASE}${p}?cb=${Date.now()}`);
	const html = await res.text();
	t53aDonor[p] = res.status === 200 ? (html.match(/coin-container\.local/g) || []).length : `status ${res.status}`;
}
ok('Migration: 0 links to the donor host coin-container.local in the HTML of nine pages, the JSON-LD logo included',
	Object.values(t53aDonor).every((n) => n === 0), JSON.stringify(t53aDonor));
const t53aLocs = async (path) => {
	const res = await fetch(`${BASE}${path}?cb=${Date.now()}`);
	return { status: res.status, locs: [...(await res.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]) };
};
const t53aProd = await t53aLocs('/product-sitemap.xml');
const t53aCat = await t53aLocs('/product_cat-sitemap.xml');
const t53aProducts = t53aProd.locs.filter((u) => u.startsWith(`${BASE}/product/`));
ok('Migration: product-sitemap.xml lists the 42 production products, product_cat-sitemap.xml only categories under /container-kaufen/',
	t53aProd.status === 200 && t53aProducts.length === 42 && t53aCat.status === 200 && t53aCat.locs.length >= 3
	&& t53aCat.locs.every((u) => u.startsWith(`${BASE}${CAT_BASE}`)),
	JSON.stringify({ products: t53aProducts.length, other: t53aProd.locs.length - t53aProducts.length, cats: t53aCat.locs.map((u) => u.replace(BASE, '')) }));
const t53aNav = await browser.newPage();
await t53aNav.goto(`${BASE}/?cb=${Date.now()}`, { waitUntil: 'domcontentloaded' });
const t53aGroup = await t53aNav.evaluate((cat) => {
	const li = [...document.querySelectorAll('#site-nav .site-menu > li')]
		.find((l) => [...l.querySelectorAll('.sub-menu a')].some((a) => new URL(a.href).pathname.startsWith(cat)));
	return li ? [li.querySelector(':scope > a').href, ...[...li.querySelectorAll('.sub-menu a')].map((a) => a.href)] : [];
}, CAT_BASE);
await t53aNav.close();
const t53aLinks = {};
for (const u of t53aGroup) {
	t53aLinks[u.replace(BASE, '')] = (await fetch(`${u}${u.includes('?') ? '&' : '?'}cb=${Date.now()}`, { redirect: 'manual' })).status;
}
ok('Migration: the menu group of the product categories (parent and sub-menu, >= 7 links) answers 200 from every link, the categories under /container-kaufen/',
	t53aGroup.length >= 7 && Object.values(t53aLinks).every((s) => s === 200) && Object.keys(t53aLinks).filter((p) => p.startsWith(CAT_BASE)).length >= 3,
	JSON.stringify(t53aLinks));
const t53aPosted = (await (await fetch(`${BASE}${T49_PRODUCT}?cb=${Date.now()}`)).text()).match(/<span class="posted_in">([\s\S]*?)<\/span>/);
const t53aCats = t53aPosted ? [...t53aPosted[1].matchAll(/<a [^>]*>([^<]+)<\/a>/g)].map((m) => m[1].replace(/&amp;/g, '&').trim()) : [];
const t53aTrail = t54[T49_PRODUCT].crumbs;
ok('Migration: the product trail is «Startseite › shop page › one of its categories › product», no old parent category',
	t53aTrail.length === 4 && t53aTrail[0] === 'Startseite' && t53aCats.includes(t53aTrail[2]) && !t53aTrail.some((c) => /COIN/.test(c)),
	JSON.stringify({ trail: t53aTrail, categories: t53aCats }));

// Production features (T-56, DESIGN.md "How to measure"): ports of transmax-child modules and two blocks for the
// content migration. llms.txt: the curated list of production, answered by PHP as text/plain with X-Robots-Tag
// noindex (production serves a static copy, the header comes from .htaccess there); entries without a published
// page are left out, so every link points to this host.
const t56Get = async (path, init) => {
	const res = await fetch(`${BASE}${path}${path.includes('?') ? '&' : '?'}cb=${Date.now()}`, init);
	return { res, text: await res.text() };
};
const t56Llms = await t56Get('/llms.txt');
const t56LlmsLinks = t56Llms.text.match(/^- \[[^\]]+\]\([^)]+\)/gm) || [];
ok('llms.txt (T-56): 200 text/plain, X-Robots-Tag noindex, «# Coin Container» and >= 20 links, all on this host',
	t56Llms.res.status === 200 && /^text\/plain/.test(t56Llms.res.headers.get('content-type') || '')
	&& /noindex/i.test(t56Llms.res.headers.get('x-robots-tag') || '') && t56Llms.text.startsWith('# Coin Container\n')
	&& t56LlmsLinks.length >= 20 && t56LlmsLinks.every((l) => l.includes(`](${BASE}/`)),
	JSON.stringify({ status: t56Llms.res.status, type: t56Llms.res.headers.get('content-type'), robots: t56Llms.res.headers.get('x-robots-tag'), links: t56LlmsLinks.length }));

// Last updated (inc/freshness.php): production's 38 cluster pages and the children of /glossar/, pages only; the
// <time datetime> is the modified time in UTC (REST modified_gmt), the name links to /ueber-uns/.
const t56Fresh = /<p class="ccn-freshness">Zuletzt aktualisiert: <time datetime="([^"]+)">(\d{1,2}\. [A-ZÄÖÜ][a-zäöü]+ \d{4})<\/time> · Redaktion: <a href="([^"]+)">Coin Container Team, Hamburg<\/a><\/p>/;
const t56Pages = async (query) => {
	const res = await fetch(`${BASE}/wp-json/wp/v2/pages?${query}&_fields=id,link,modified_gmt&cb=${Date.now()}`);
	return res.ok ? res.json() : [];
};
const [t56Cluster] = await t56Pages('slug=seecontainer-preise');
const [t56GlossarHub] = await t56Pages('slug=glossar');
const [t56GlossarTerm] = t56GlossarHub ? await t56Pages(`parent=${t56GlossarHub.id}&per_page=1`) : [];
const t56FreshOn = {};
for (const p of [t56Cluster, t56GlossarTerm].filter(Boolean)) {
	const path = new URL(p.link).pathname;
	const m = (await t56Get(path)).text.match(t56Fresh);
	t56FreshOn[path] = m ? { utc: new Date(m[1]).toISOString().slice(0, 19) === p.modified_gmt, date: m[2], about: new URL(m[3]).pathname } : null;
}
ok('Last updated (T-56): a cluster page and a glossary page end with «Zuletzt aktualisiert: <date> · Redaktion: Coin Container Team, Hamburg», <time datetime> = modified (UTC), the name to /ueber-uns/',
	Object.keys(t56FreshOn).length === 2 && Object.values(t56FreshOn).every((v) => v && v.utc && v.about === '/ueber-uns/'), JSON.stringify(t56FreshOn));
const t56FreshOff = {};
for (const path of [new URL(postUrl).pathname, '/kontakt-beratung/', '/container-kaufen/', '/glossar/', '/']) {
	t56FreshOff[path] = ((await t56Get(path)).text.match(/class="ccn-freshness/g) || []).length;
}
ok('Last updated (T-56): not on a post, the contact page, a landing outside the list, the glossary hub or the front page',
	Object.values(t56FreshOff).every((n) => n === 0), JSON.stringify(t56FreshOff));

// Diesel surcharge: the theme registers exactly one shortcode, [ccn_dieselzuschlag], fed by Site Settings → Preise →
// diesel_surcharge (code level: no page uses it before the content migration renames production's
// [coin_dieselzuschlag], T-53b; the rendering is checked with WP-CLI in the T-56 report).
const t56PhpFiles = readdirSync(themeDir, { recursive: true }).map(String)
	.filter((f) => f.endsWith('.php') && !/^(vendor|tests|node_modules)[\\/]/.test(f));
const t56Shortcodes = t56PhpFiles.flatMap((f) => [...themeFile(f).matchAll(/add_shortcode\(\s*'([^']+)'/g)].map((m) => m[1]));
const t56SiteSettings = JSON.parse(themeFile('acf-json/group_ccn_site_settings.json') || '{}').fields || [];
ok('Shortcodes (T-56): the theme registers exactly one, [ccn_dieselzuschlag], read from the Site Settings field diesel_surcharge',
	t56Shortcodes.length === 1 && t56Shortcodes[0] === 'ccn_dieselzuschlag' && t56SiteSettings.some((f) => f.name === 'diesel_surcharge')
	&& themeFile('inc/shortcodes.php').includes("ccn_setting( 'diesel_surcharge' )"),
	JSON.stringify({ shortcodes: t56Shortcodes, phpFiles: t56PhpFiles.length }));

// Price table (blocks/lists/price-table.php): code level until the content migration places it (T-53b; the WP-CLI
// render check against Site Settings is in the T-56 report): a caption, column and row headers, a focusable region
// named by the caption, the ranges of Site Settings → Preise (used / One Way / new), the swipe hint behind a
// container query (shown only while the table overflows its box, no JS). Its rules and the link cards' live in
// assets/css/content-cards.css (outside theme.css, see "First TCP window"), on the tokens like theme.css.
const t56PriceTpl = themeFile('blocks/lists/price-table.php');
const t56PriceRows = (t56SiteSettings.find((f) => f.name === 'price_rows') || {}).sub_fields || [];
const t56CardsCssFile = themeFile('assets/css/content-cards.css');
const t56CardsHex = t56CardsCssFile.replace(/\/\*[\s\S]*?\*\//g, '').match(/#[0-9a-fA-F]{3,8}\b/g) || [];
ok('Price table (T-56): registered; <caption>, th scope col/row, tabindex 0 region labelled by the caption; Site Settings rows size + used/oneway/new min/max; hint only while the table overflows (content-cards.css, tokens only)',
	blockTemplates.includes('blocks/lists/price-table.php') && /<caption id=/.test(t56PriceTpl)
	&& t56PriceTpl.includes('<th scope="col">') && t56PriceTpl.includes('<th scope="row">')
	&& /class="ccn-table-wrap" tabindex="0" role="region" aria-labelledby=/.test(t56PriceTpl)
	&& ['size', 'used_min', 'used_max', 'oneway_min', 'oneway_max', 'new_min', 'new_max'].every((n) => t56PriceRows.some((f) => f.name === n))
	&& t56CardsCssFile.includes('.ccn-table-hint{display:none') && t56CardsCssFile.includes('@container (max-width:31.99em){.ccn-table-hint{display:block}}')
	&& t56CardsHex.length === 0 && !/transition\s*:\s*all/.test(t56CardsCssFile),
	JSON.stringify({ rows: t56PriceRows.map((f) => f.name), rawHex: t56CardsHex }));

// Internal links (inc/internal-links.php, production's link plan 1:1): the 20 and 40 Fuß products end the summary
// (after the categories) with «Alle 20/40 Fuß Container» linking to their size page; Kühlcontainer and the shop carry
// one «Siehe auch:» line after the product grid; every target answers 200.
const t56ProductLinks = {};
for (const path of ['/product/20-fuss-container-gebraucht/', '/product/40-fuss-container-gebraucht/']) {
	const html = (await t56Get(path)).text;
	const nav = html.match(/<nav class="ccn-links ccn-links--product" aria-labelledby="([^"]+)"><p id="([^"]+)" class="ccn-links__title">([^<]+)<\/p><ul>(.*?)<\/ul><\/nav>/);
	const at = nav ? html.indexOf(nav[0]) : -1;
	t56ProductLinks[path] = nav ? {
		title: nav[3], named: nav[1] === nav[2], hrefs: [...nav[4].matchAll(/href="([^"]+)"/g)].map((m) => new URL(m[1]).pathname),
		afterMeta: at > html.indexOf('class="product_meta"'), beforeTabs: at < html.indexOf('woocommerce-tabs'),
	} : null;
}
const t56P20 = t56ProductLinks['/product/20-fuss-container-gebraucht/'];
const t56P40 = t56ProductLinks['/product/40-fuss-container-gebraucht/'];
ok('Internal links (T-56): 20/40 Fuß products end the summary with «Alle 20/40 Fuß Container» -> /20-|/40-fuss-container-kaufen/ (nav named by its title, after the categories, before the tabs)',
	!!t56P20 && !!t56P40 && t56P20.title === 'Alle 20 Fuß Container' && t56P40.title === 'Alle 40 Fuß Container'
	&& t56P20.hrefs.join() === '/20-fuss-container-kaufen/' && t56P40.hrefs.join() === '/40-fuss-container-kaufen/'
	&& [t56P20, t56P40].every((v) => v.named && v.afterMeta && v.beforeTabs), JSON.stringify(t56ProductLinks));
const t56Archive = {};
for (const path of [CAT_COOLING, '/container-shop/']) {
	const html = (await t56Get(path)).text;
	const line = html.match(/<p class="ccn-links ccn-links--archive">Siehe auch: (.*?)<\/p>/);
	t56Archive[path] = line ? {
		hrefs: [...line[1].matchAll(/href="([^"]+)"/g)].map((m) => new URL(m[1]).pathname),
		afterGrid: html.indexOf('<ul class="products') > -1 && html.indexOf(line[0]) > html.indexOf('<ul class="products'),
	} : null;
}
const t56Targets = {};
for (const p of new Set([...Object.values(t56ProductLinks), ...Object.values(t56Archive)].flatMap((v) => (v ? v.hrefs : [])))) {
	t56Targets[p] = (await fetch(`${BASE}${p}?cb=${Date.now()}`, { redirect: 'manual' })).status;
}
const t56Cool = t56Archive[CAT_COOLING];
const t56Shop = t56Archive['/container-shop/'];
ok('Internal links (T-56): «Siehe auch:» after the grid — Kühlcontainer -> /kuehlcontainer-mieten/ + /container-kaufen/, the shop -> 4 categories; every target 200',
	!!t56Cool && !!t56Shop && t56Cool.hrefs.join() === '/kuehlcontainer-mieten/,/container-kaufen/' && t56Shop.hrefs.length === 4
	&& t56Cool.afterGrid && t56Shop.afterGrid && Object.keys(t56Targets).length >= 7 && Object.values(t56Targets).every((s) => s === 200),
	JSON.stringify({ archive: t56Archive, targets: t56Targets }));

// Related links block (blocks/lists/related-links.php): code level until the content migration places it (T-53b; the
// WP-CLI render check is in the T-56 report): no markup without a published link, at most six hand-picked pages, posts
// or products, a nav named by its h2 (default «Verwandte Leistungen»).
const t56RelTpl = themeFile('blocks/lists/related-links.php');
const t56RelLinks = (JSON.parse(themeFile('acf-json/group_ccn_block_related_links.json') || '{}').fields || []).find((f) => f.name === 'links') || {};
const t56RelEmpty = t56RelTpl.indexOf('if ( ! $ccn_links )');
ok('Related links block (T-56): registered; returns before any markup without links; nav aria-labelledby its h2, default «Verwandte Leistungen»; relationship page/post/product, max 6',
	blockTemplates.includes('blocks/lists/related-links.php') && t56RelEmpty > -1 && t56RelEmpty < t56RelTpl.indexOf('<section')
	&& t56RelTpl.includes('<nav aria-labelledby="<?php echo esc_attr( $ccn_id ); ?>">') && t56RelTpl.includes('<h2 id="<?php echo esc_attr( $ccn_id ); ?>"')
	&& t56RelTpl.includes("__( 'Verwandte Leistungen', 'coin-container' )") && t56RelLinks.type === 'relationship' && t56RelLinks.max === 6
	&& ['page', 'post', 'product'].every((t) => (t56RelLinks.post_type || []).includes(t)),
	JSON.stringify({ type: t56RelLinks.type, max: t56RelLinks.max, postTypes: t56RelLinks.post_type }));

// «Ähnliche Beiträge» (template-parts/related-posts.php): a post of the largest category shows 1-3 cards of other posts
// of its categories under the h2 «Ähnliche Beiträge», after the post navigation, never itself (production's K69 bug).
const t56TopCat = ((await (await fetch(`${BASE}/wp-json/wp/v2/categories?orderby=count&order=desc&per_page=1&_fields=id,count&cb=${Date.now()}`)).json()) || [])[0];
const t56CatPost = t56TopCat ? ((await (await fetch(`${BASE}/wp-json/wp/v2/posts?categories=${t56TopCat.id}&per_page=1&_fields=link&cb=${Date.now()}`)).json()) || [])[0] : null;
const t56PostPath = t56CatPost ? new URL(t56CatPost.link).pathname : '';
const t56PostHtml = t56PostPath ? (await t56Get(t56PostPath)).text : '';
const t56RelPosts = t56PostHtml.match(/<section class="ccn-related-posts" aria-labelledby="ccn-related-posts-title">\s*<h2 id="ccn-related-posts-title" class="ccn-related-posts-heading">([^<]+)<\/h2>([\s\S]*?)<\/section>/);
const t56RelHrefs = t56RelPosts ? [...t56RelPosts[2].matchAll(/class="ccn-related-card-link" href="([^"]+)"/g)].map((m) => new URL(m[1]).pathname) : [];
const t56PostNav = t56PostHtml.indexOf('post-navigation');
ok('Related posts (T-56): «Ähnliche Beiträge» (h2) with 1-3 cards of other posts after the post navigation, never the post itself',
	!!t56RelPosts && t56RelPosts[1] === 'Ähnliche Beiträge' && t56RelHrefs.length >= 1 && t56RelHrefs.length <= 3
	&& !t56RelHrefs.includes(t56PostPath) && new Set(t56RelHrefs).size === t56RelHrefs.length
	&& t56PostNav > -1 && t56PostNav < t56PostHtml.indexOf('class="ccn-related-posts"'),
	JSON.stringify({ post: t56PostPath, category: t56TopCat, cards: t56RelHrefs }));

// REST (inc/rest-auth-header-fallback.php, production K67b): on hosts that drop the Authorization header (KAS) the
// Application Password comes as X-WP-Authorization. Made-up credentials through that header must reach the Application
// Password check exactly like Authorization (401 invalid_username), not stay anonymous; no credentials -> anonymous
// (the users route is closed for anonymous visitors). Needs Application Passwords in use, as on production.
const t56Basic = `Basic ${Buffer.from('ccn-smoke-nobody:not-a-password').toString('base64')}`;
const t56Rest = async (headers) => {
	const r = await t56Get('/wp-json/wp/v2/users/me', { headers });
	let code = '';
	try { code = JSON.parse(r.text).code || ''; } catch { code = 'not json'; }
	return `${r.res.status} ${code}`;
};
const t56RestAnswers = { xWp: await t56Rest({ 'X-WP-Authorization': t56Basic }), authorization: await t56Rest({ Authorization: t56Basic }), none: await t56Rest({}) };
ok('REST (T-56): X-WP-Authorization reaches the Application Password check like Authorization (401 invalid_username); without credentials anonymous (no 200/401)',
	t56RestAnswers.xWp === '401 invalid_username' && t56RestAnswers.authorization === t56RestAnswers.xWp && !/^(200|401)/.test(t56RestAnswers.none),
	JSON.stringify(t56RestAnswers));

// First TCP window (T-56 review, DESIGN.md "Do / don't"): theme.css blocks the first paint of every page. Sent gzip it
// must fit the first window of a new connection (initcwnd 10 x 1 460 = 14 600 bytes; above it Lighthouse adds a round
// trip: front page FCP 913 -> 1 059 ms in T-56), counted as the bytes of the response body, not its Content-Length.
// The price table and the link cards keep their rules in assets/css/content-cards.css, loaded after theme.css only
// where they show: the front page keeps its requests (Lighthouse mobile counts 14 = these 12 plus /favicon.ico and its
// redirect, which Chrome adds outside Playwright), the product page gets none of it, a post with related posts does.
const { get: t56HttpGet } = await import(BASE.startsWith('https') ? 'node:https' : 'node:http');
const t56HomeHead = (await t56Get('/')).text;
const t56CssHref = ((t56HomeHead.match(/<link[^>]+id=['"]coin-container-css['"][^>]+href=['"]([^'"]+)['"]/) || [])[1] || '').replace(/&#038;/g, '&');
const t56CssGz = await new Promise((resolve) => {
	t56HttpGet(t56CssHref, { headers: { 'Accept-Encoding': 'gzip' } }, (res) => {
		let bytes = 0;
		res.on('data', (c) => { bytes += c.length; });
		res.on('end', () => resolve({ status: res.statusCode, encoding: res.headers['content-encoding'] || '', bytes }));
	}).on('error', (e) => resolve({ status: 0, encoding: '', bytes: -1, error: e.message }));
});
ok('First TCP window (T-56): theme.css sent gzip in <= 14 600 bytes (bytes of the response body, not Content-Length)',
	t56CssGz.status === 200 && t56CssGz.encoding === 'gzip' && t56CssGz.bytes > 0 && t56CssGz.bytes <= 14600, JSON.stringify(t56CssGz));
const t56Lh = await browser.newContext({
	viewport: { width: 412, height: 823 }, deviceScaleFactor: 1.75, isMobile: true, hasTouch: true,
	userAgent: 'Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Mobile Safari/537.36',
});
const t56HomePage = await t56Lh.newPage();
const t56HomeReqs = [];
t56HomePage.on('request', (r) => t56HomeReqs.push(r.url()));
await t56HomePage.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => t56HomeReqs.push('goto timeout'));
await t56Lh.close();
const t56CardsTag = "id='ccn-content-cards-css'";
const t56ProductHead = (await t56Get('/product/20-fuss-container-gebraucht/')).text;
const t56PostHead = (await t56Get(t56PostPath || '/iso-container-einfach-erklaert/')).text;
ok('First TCP window (T-56): front page 12 requests in Lighthouse mobile emulation (Lighthouse: 14 with the favicon pair), none to content-cards.css; product page without it; a post with related posts loads it after theme.css',
	t56HomeReqs.length === 12 && !t56HomeReqs.some((u) => u.includes('content-cards.css')) && !t56ProductHead.includes(t56CardsTag)
	&& t56PostHead.indexOf("id='coin-container-css'") > -1 && t56PostHead.indexOf(t56CardsTag) > t56PostHead.indexOf("id='coin-container-css'"),
	JSON.stringify({ home: t56HomeReqs.length, product: t56ProductHead.includes(t56CardsTag), post: t56PostHead.includes(t56CardsTag) }));

// Content migration (T-53b, DESIGN.md "How to measure"): the 30 Elementor records of production are blocks now
// (group A: hand-made landings synced unit by unit; group B: converted and replaced or created), production's
// [coin_*] shortcodes became blocks in 15 more records. No page of that set answers anything but 200 or carries
// Elementor markup, a raw [coin_ shortcode or the donor host.
const T53B_PAGES = ['/', '/container-kaufen/', '/container-mieten/', '/containerzubehoer/', '/container-transport-logistik/',
	'/container-modifikation-umbau-dienstleistungen/', '/container-services/',
	'/nachhaltige-containerloesungen-ihr-partner-fuer-umweltfreundliche-container/', INSPIRATION, '/container-angebot-anfordern/',
	'/kontakt-beratung/', '/container-shop/', '/weihnachtsgruesse-coin-container/', '/weihnachten-coin-container/',
	'/container-projekte-weltweit/', '/intermodaler-containertransport-nachhaltige-logistik/',
	'/umlackierung-ral-7016-20-hc-open-side-umbau/', '/containerkauf-teure-fehler/', '/groesste-containerhaefen-europas-teu/',
	'/container-im-sommer-und-im-winter-wie-sie-ueberhitzung-frost-und-kondenswasser-vermeiden/',
	'/container-mieten-oder-kaufen-ratgeber-2026/', '/double-door-container-beidseitiger-zugang-logistik/',
	'/cny-2026-containerlieferungen-europa/', '/kondenswasser-im-container-wie-man-es-vermeidet-und-was-wirklich-zaehlt/',
	'/datenschutzerklaerung/', '/impressum-und-kontakt-coin-container-inspiration-gmbh/', '/allgemeine-geschaeftsbedingungen-agb/',
	'/cookies-richtlinien-eu/', '/modulare-gewerbeloesungen-hamburg/', '/container-projekte-referenzen/'];
const T53B_PRICE_PAGES = ['/seecontainer-preise/', '/20-fuss-container-kaufen/', '/40-fuss-container-kaufen/', '/lagercontainer-mieten-hamburg/',
	'/seecontainer-kaufen-bremen/', '/ueberseecontainer-kaufen/', '/seecontainer-kaufen-duisburg/', '/seecontainer-kaufen-frankfurt/',
	'/seecontainer-kaufen-muenchen/', '/seecontainer-kaufen-stuttgart/', '/seecontainer-kaufen-berlin/', '/container-ab-rotterdam-antwerpen/',
	'/seecontainer-kaufen-hamburg/'];
const T53B_SC_PAGES = [...T53B_PRICE_PAGES, '/container-transport-kosten-lieferzeiten-seecontainer/', '/ueber-uns/bewertungen/'];
const t53bHtml = {};
for (const p of [...T53B_PAGES, ...T53B_SC_PAGES]) {
	const r = await t56Get(p);
	t53bHtml[p] = { status: r.res.status, html: r.text };
}
const t53bBad = Object.entries(t53bHtml).filter(([, v]) => v.status !== 200 || /elementor/i.test(v.html) || v.html.includes('[coin_') || v.html.includes('coin-container.local'))
	.map(([p, v]) => `${p} ${v.status}${/elementor/i.test(v.html) ? ' elementor' : ''}${v.html.includes('[coin_') ? ' [coin_' : ''}${v.html.includes('coin-container.local') ? ' donor-host' : ''}`);
ok(`Migration (T-53b): ${T53B_PAGES.length} converted records and ${T53B_SC_PAGES.length} shortcode pages answer 200 without Elementor markup, a raw [coin_ shortcode or the donor host`,
	t53bBad.length === 0, t53bBad.join(', ') || `${Object.keys(t53bHtml).length} pages`);
// [coin_preise groesse=…] → the price-table block (13 pages + the hub body of /container-kaufen/), [coin_dieselzuschlag] → the
// theme's [ccn_dieselzuschlag] with Site Settings → Preise (3× on the transport cost post), [coin_hero_trust] → trust bar,
// [coin_reviews] → the reviews widget facade.
const t53bKaufen = (await t56Get('/container-kaufen/')).text;
const t53bPrice = [...T53B_PRICE_PAGES.map((p) => [p, t53bHtml[p].html]), ['/container-kaufen/', t53bKaufen]]
	.filter(([, h]) => !(/<section class="ccn-price-table [^"]*"/.test(h) && /<caption id="ccn-price-table-[^"]+" class="screen-reader-text">/.test(h) && /<th scope="row">\d+ Fu/.test(h)))
	.map(([p]) => p);
const t53bSurcharge = (t53bHtml['/container-transport-kosten-lieferzeiten-seecontainer/'].html.match(/<span class="ccn-surcharge">\d+(,\d)? %<\/span>/g) || []).length;
ok('Migration (T-53b): price tables render on the 13 pages of [coin_preise] and on /container-kaufen/ (caption, size rows); the transport cost post shows the diesel surcharge 3× from Site Settings',
	t53bPrice.length === 0 && t53bSurcharge === 3, JSON.stringify({ withoutTable: t53bPrice, surcharge: t53bSurcharge }));
ok('Migration (T-53b): [coin_hero_trust] → trust bar on /seecontainer-kaufen-hamburg/, [coin_reviews] → reviews widget facade on /ueber-uns/bewertungen/',
	/<section class="ccn-trust-bar /.test(t53bHtml['/seecontainer-kaufen-hamburg/'].html) && /class="ccn-reviews-facade/.test(t53bHtml['/ueber-uns/bewertungen/'].html));
// Legal pages: production's texts (e-mail of production, no Elementor), the inspiration landing under production's slug
// with production's counters (decision V (a): 10 000 as on production), its old slug not answering 200 (301 map: T-53c).
// The e-mail counts inside the content only (entry-content up to </main>): the footer prints it on every page.
const t53bLegalMail = ['/datenschutzerklaerung/', '/impressum-und-kontakt-coin-container-inspiration-gmbh/'].every((p) => {
	const h = t53bHtml[p].html;
	const start = h.indexOf('<div class="entry-content">');
	const end = h.indexOf('</main>', start);
	return start > -1 && end > start && h.slice(start, end).includes('info@coin-container.de');
});
ok('Migration (T-53b): legal pages converted (Impressum and Datenschutz name info@coin-container.de in their content)', t53bLegalMail);
const t53bInsp = t53bHtml[INSPIRATION].html;
const t53bOld = await fetch(`${BASE}/container-inspiration-ideen/?cb=${Date.now()}`, { redirect: 'manual' });
ok(`Migration (T-53b): ${INSPIRATION} 200 with production's counters 20+ / 10.000+ / 50+, the old slug not 200 (301 map: T-53c)`,
	t53bHtml[INSPIRATION].status === 200 && /data-target="10000" data-suffix="\+">10\.000\+/.test(t53bInsp) && /data-target="20" data-suffix="\+">20\+/.test(t53bInsp)
	&& /data-target="50" data-suffix="\+">50\+/.test(t53bInsp) && t53bOld.status !== 200, String(t53bOld.status));
// Hub boxes of production (transmax-child/functions.php: «Verwandte Leistungen», «… im Überblick», «Passende Seiten»):
// related-links blocks (up to six links) on the four hubs and Containerzubehör.
const t53bBoxes = {};
for (const [p, h] of [['/container-kaufen/', t53bKaufen], ...['/container-mieten/', '/container-transport-logistik/', '/container-modifikation-umbau-dienstleistungen/', '/containerzubehoer/'].map((x) => [x, t53bHtml[x].html])]) {
	t53bBoxes[p] = [...h.matchAll(/<nav aria-labelledby="([^"]+)">\s*<h2 id="\1" class="ccn-related-links-heading">([^<]+)<\/h2>/g)].map((m) => m[2]);
}
ok('Migration (T-53b): production hub boxes as related-links — «Verwandte Leistungen» on 4 hubs, «… im Überblick» on transport and modification, «Passende Seiten» on Containerzubehör',
	['/container-kaufen/', '/container-mieten/', '/container-transport-logistik/', '/container-modifikation-umbau-dienstleistungen/'].every((p) => t53bBoxes[p].includes('Verwandte Leistungen'))
	&& t53bBoxes['/container-transport-logistik/'].includes('Transport und Lieferung im Überblick') && t53bBoxes['/container-modifikation-umbau-dienstleistungen/'].includes('Umbau-Ratgeber im Überblick')
	&& t53bBoxes['/containerzubehoer/'].includes('Passende Seiten'), JSON.stringify(t53bBoxes));
// Gallery rail (blocks/lists/gallery-rail.php): photos in the .ccn-rail row, a focusable list named by the heading (or a label),
// lazy images, its stylesheet in <head> after theme.css only where it renders, no carousel library, the buttons scroll the row.
const t53bGrTpl = themeFile('blocks/lists/gallery-rail.php');
const t53bRef = t53bHtml['/container-projekte-referenzen/'].html;
const t53bRails = [...t53bRef.matchAll(/<ul id="(ccn-gallery-rail-\d+)" class="ccn-gallery-rail-list ccn-rail" role="list" tabindex="0"\s+aria-(labelledby="([^"]+)"|label="[^"]+")\s*>/g)];
const t53bNamed = t53bRails.every((m) => !m[3] || t53bRef.includes(`id="${m[3]}"`));
const t53bImgs = [...t53bRef.matchAll(/<li class="ccn-gallery-rail-item">\s*(?:<figure>\s*)?<img ([^>]+)>/g)].map((m) => m[1]);
const t53bHeadEnd = t53bRef.indexOf('</head>');
const t53bGrCss = t53bRef.indexOf("id='ccn-gallery-rail-css'");
ok('Gallery rail (T-53b): 17 project rails on /container-projekte-referenzen/ — focusable lists named by their headings, every image lazy, gallery-rail.css in <head> after theme.css, no carousel library (Swiper, Slick, Splide, Glide, Owl)',
	t53bRails.length >= 17 && t53bNamed && t53bImgs.length >= 17 && t53bImgs.every((a) => /loading="lazy"/.test(a)) && t53bGrCss > -1 && t53bGrCss < t53bHeadEnd
	&& t53bGrCss > t53bRef.indexOf("id='coin-container-css'") && !/swiper|slick|splide|glide|owl\.carousel/i.test(t53bRef) && !/data-autoplay|autoplay\s*[:=]/i.test(t53bGrTpl)
	&& !t56HomeHead.includes('gallery-rail.css'), JSON.stringify({ rails: t53bRails.length, named: t53bNamed, images: t53bImgs.length, css: t53bGrCss > -1 && t53bGrCss < t53bHeadEnd }));
const t53bRailPage = await browser.newPage({ viewport: { width: 360, height: 800 } });
await t53bRailPage.goto(`${BASE}/container-projekte-referenzen/?cb=${Date.now()}`, { waitUntil: 'load' });
const t53bScroll = await t53bRailPage.evaluate(async () => {
	const rail = document.querySelector('.ccn-gallery-rail .ccn-rail');
	const nav = rail && rail.parentElement.querySelector('.ccn-rail-nav');
	const next = nav && nav.querySelector('.ccn-rail-btn[data-dir="1"]');
	if (!next) return { ready: false };
	rail.style.scrollBehavior = 'auto';
	next.click();
	await new Promise((r) => setTimeout(r, 900));
	return { ready: nav.classList.contains('is-ready'), left: Math.round(rail.scrollLeft), overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth };
});
await t53bRailPage.close();
ok('Gallery rail (T-53b): at 360 the «Weiter» button is wired and scrolls the row, the page itself does not scroll sideways',
	t53bScroll.ready && t53bScroll.left > 0 && t53bScroll.overflow <= 0, JSON.stringify(t53bScroll));
// Front page after the sync of its texts: the document still fits the first TCP window (sent gzip <= 14 600 bytes).
const t53bHomeGz = await new Promise((resolve) => {
	t56HttpGet(`${BASE}/?cb=${Date.now()}`, { headers: { 'Accept-Encoding': 'gzip' } }, (res) => {
		let bytes = 0;
		res.on('data', (c) => { bytes += c.length; });
		res.on('end', () => resolve({ status: res.statusCode, encoding: res.headers['content-encoding'] || '', bytes }));
	}).on('error', (e) => resolve({ status: 0, bytes: -1, error: e.message }));
});
ok('First TCP window (T-53b): the front page document sent gzip in <= 14 600 bytes after the text sync', t53bHomeGz.status === 200 && t53bHomeGz.bytes > 0 && t53bHomeGz.bytes <= 14600, JSON.stringify(t53bHomeGz));

// Meta descriptions: Rank Math builds og:/twitter:description from the excerpt in wp_head, outside the main loop, where
// the theme's read-more link (excerpt_more, functions.php) must not land as escaped markup; the blog index keeps its
// read-more links inside the loop. The front page has no description tags yet (Rank Math meta of production: T-53c).
const T53B_META_PAGES = ['/container-masse-groessen/', '/seecontainer-preise/', '/containerkauf-teure-fehler/', '/product/20-fuss-container-gebraucht/', '/nachrichten-trends-aus-der-containerwelt/'];
const t53bMeta = {};
for (const p of [...T53B_META_PAGES, '/']) {
	const { text } = await t56Get(p);
	const tags = [...text.matchAll(/<meta (?:property="og:description"|name="twitter:description") content="([^"]*)"/g)].map((m) => m[1]);
	t53bMeta[p] = { tags: tags.length, dirty: tags.filter((v) => /&lt;|<|more-link/.test(v)).length, moreLinks: (text.match(/class="more-link"/g) || []).length };
}
ok('Meta descriptions (T-53b): og:description and twitter:description on 5 pages (a page, a hub, a post, a product, the blog index) carry no read-more link or other markup, the front page none either; the blog index keeps its read-more links',
	T53B_META_PAGES.every((p) => t53bMeta[p].tags === 2) && Object.values(t53bMeta).every((m) => m.dirty === 0) && t53bMeta['/nachrichten-trends-aus-der-containerwelt/'].moreLinks > 0,
	JSON.stringify(t53bMeta));

await browser.close();
console.log(results.join('\n'));
const fails = results.filter((r) => r.startsWith('FAIL')).length;
console.log(`\n${results.length - fails}/${results.length} PASS`);
process.exit(fails ? 1 : 0);
