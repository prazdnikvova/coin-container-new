// One-off: open pages in a real browser, report load state + console errors +
// what actually renders, save screenshots. Diagnostic for the theme-switch issue.
import { chromium } from 'playwright';

const BASE = 'http://coin-container-new.local';
const SHOTS = process.env.SHOT_DIR || '.';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

for (const [name, path] of [['home', '/'], ['kaufen', '/container-kaufen/'], ['shop', '/container-shop/']]) {
	errors.length = 0;
	const t0 = Date.now();
	const resp = await page.goto(BASE + path, { waitUntil: 'load' });
	const loadMs = Date.now() - t0;
	const title = await page.title();
	const h1 = await page.locator('h1').first().textContent().catch(() => '(no h1)');
	const bodyText = (await page.locator('body').innerText()).trim();
	const sections = await page.locator('.section-hero, .section-text, .section-cta, ul.products').count();
	await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: false });
	console.log(`--- ${name} (${path})`);
	console.log(`status=${resp.status()} load=${loadMs}ms title="${title}"`);
	console.log(`h1="${(h1 || '').trim()}" | theme-sections=${sections} | body-chars=${bodyText.length}`);
	console.log(`console-errors=${errors.length}${errors.length ? ' | ' + errors.join(' ; ') : ''}`);
}
await browser.close();
