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
	ok(`Landing ${slug} CTA banner`, await page.locator('.ccn-cta .btn').count() === 2 && await page.locator('.ccn-cta .btn[href^="tel:"]').count() === 1);
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
			.map((s) => [...s.querySelectorAll('h2, h3, p, li.product, .ccn-card, .btn, .rich-text, img')].find(vis)).filter(Boolean).map((e) => Math.round(e.getBoundingClientRect().left));
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
for (const path of ['/', '/container-kaufen/', '/container-mieten/', '/containerzubehoer/', '/ueber-uns/', '/container-inspiration-ideen/']) {
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
const wooPages = ['/container-shop/', '/product-category/cointainer/standardcontainer/', T49_PRODUCT, '/warenkorb/'];
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
	Object.entries(wcCss).every(([p, n]) => (['/container-shop/', '/product-category/cointainer/standardcontainer/', '/warenkorb/'].includes(p) ? n === 3 : n === 0)), JSON.stringify(wcCss));
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
for (const path of [T49_PRODUCT, '/product-category/cointainer/standardcontainer/', '/container-shop/', '/container-kaufen/', '/containerzubehoer/',
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
for (const path of ['/container-shop/', '/product-category/cointainer/standardcontainer/', '/product-category/cointainer/spezialcontainer/', '/container-shop/?orderby=menu_order']) {
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
// Logos (code level: no page carries the block before the migration of /ueber-uns/zertifikate/, T-53a/b).
const t50Logos = themeFile('blocks/lists/logos.php');
ok('Logos block: lazy images, alt from the field, 48px high grey marks', /'loading'\s*=>\s*'lazy'/.test(t50Logos) && /'alt'\s*=>\s*\$ccn_item\['alt'\]/.test(t50Logos)
	&& /\.ccn-logo-img\{[^}]*height:3rem[^}]*filter:grayscale\(1\)/.test(themeCss), 'blocks/lists/logos.php, theme.css .ccn-logo-img');

await browser.close();
console.log(results.join('\n'));
const fails = results.filter((r) => r.startsWith('FAIL')).length;
console.log(`\n${results.length - fails}/${results.length} PASS`);
process.exit(fails ? 1 : 0);
