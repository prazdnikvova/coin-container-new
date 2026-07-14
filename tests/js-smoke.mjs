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

// Homepage: featured products render (WooCommerce loop)
ok('Featured products on home', await page.locator('.section-featured ul.products li.product').count() >= 3);

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

// Landing pages rebuilt as sections: hero + content + CTA, all images WebP
const respLanding = await page.goto(BASE + '/container-kaufen/', { waitUntil: 'domcontentloaded' });
ok('Landing 200', respLanding.status() === 200, String(respLanding.status()));
ok('Landing has hero section', (await page.locator('.section-hero .hero-title').count()) === 1);
ok('Landing has CTA section', (await page.locator('.section-cta').count()) >= 1);
ok('No PNG/JPEG images in content', await page.evaluate(() =>
	![...document.images].some((i) => /\.(png|jpe?g)(\?|$)/i.test(i.currentSrc || i.src))));

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
