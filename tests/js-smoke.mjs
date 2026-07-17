// Coin Container smoke test: rendering, accessibility basics, security hardening.
// Requires a local WordPress site running this theme.
import { chromium } from 'playwright';

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

await browser.close();
console.log(results.join('\n'));
const fails = results.filter((r) => r.startsWith('FAIL')).length;
console.log(`\n${results.length - fails}/${results.length} PASS`);
process.exit(fails ? 1 : 0);
