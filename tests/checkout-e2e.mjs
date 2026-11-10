// Coin Container checkout e2e: add to cart -> cart -> checkout (COD) -> order.
// Note: jQuery IS expected on cart/checkout (WooCommerce core needs it) —
// that is the documented exception to the vanilla-JS policy.
// B2B shop (T-57a, inc/b2b.php): no order without the confirmation «Ich bestelle als Unternehmer …»; the order
// placed with it carries _coin_b2b_confirm = ja, read through WP-CLI. Every run places one real order in the
// database of the site.
// The product (T-60): CCN_E2E_PRODUCT, the slug of a published product with a price, in stock; without it the
// 20 Fuß One Way container. README "Tests".
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';

const BASE = process.env.CCN_BASE_URL || 'http://coin-container-new.local';
const PRODUCT = String(process.env.CCN_E2E_PRODUCT || '20-fuss-container-one-way').replace(/^\/+|\/+$/g, '');
const results = [];
const ok = (name, cond, extra = '') => results.push(`${cond ? 'PASS' : 'FAIL'} ${name}${extra ? ' — ' + extra : ''}`);

// WP-CLI of the site behind BASE: CCN_PHP, CCN_PHP_INI, CCN_WP_CLI (wp-cli.phar) and CCN_WP_PATH, else taken from
// Local by Flywheel (sites.json: the site whose domain is the host of BASE, its PHP version, php.ini and folder).
const wpEval = (code) => {
	const appData = process.env.APPDATA || '';
	let site = {};
	try {
		const sites = JSON.parse(readFileSync(`${appData}/Local/sites.json`, 'utf8'));
		const [id, s] = Object.entries(sites).find(([, v]) => v.domain === new URL(BASE).hostname) || [];
		if (id) site = { id, path: String(s.path || '').replace(/^~/, homedir()), php: (s.services && s.services.php && s.services.php.version) || '' };
	} catch { /* no Local: the CCN_* variables */ }
	const services = `${appData}/Local/lightning-services`;
	const phpDir = (() => { try { return readdirSync(services).filter((d) => site.php && d.startsWith(`php-${site.php}`)).sort().pop(); } catch { return ''; } })();
	const php = process.env.CCN_PHP || (phpDir ? `${services}/${phpDir}/bin/win64/php.exe` : 'php');
	const ini = process.env.CCN_PHP_INI || (site.id ? `${appData}/Local/run/${site.id}/conf/php/php.ini` : '');
	const phar = process.env.CCN_WP_CLI || `${process.env['ProgramFiles(x86)'] || ''}/Local/resources/extraResources/bin/wp-cli/wp-cli.phar`;
	const wpPath = process.env.CCN_WP_PATH || (site.path ? `${site.path}/app/public` : '');
	const args = [...(ini && existsSync(ini) ? ['-c', ini] : []), phar, `--path=${wpPath}`, 'eval', code];
	try {
		// The last line: PHP start-up warnings of Local's php.ini go to stdout before the result.
		return execFileSync(php, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim().split(/\r?\n/).pop();
	} catch (e) {
		return `WP-CLI failed: ${String(e.message).split('\n')[0].slice(0, 160)}`;
	}
};

const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();

// A product with a price (containers without a price can't be ordered).
const productResp = await page.goto(`${BASE}/product/${PRODUCT}/`, { waitUntil: 'domcontentloaded' });
const addBtn = page.locator('button.single_add_to_cart_button');
ok('Add-to-cart present', !!productResp && productResp.status() === 200 && await addBtn.count() === 1, `${PRODUCT} ${productResp ? productResp.status() : 'no response'}`);
await addBtn.click();
await page.waitForLoadState('networkidle');

// Cart
await page.goto(BASE + '/warenkorb/', { waitUntil: 'domcontentloaded' });
const cartItems = await page.locator('.cart_item, .wc-block-cart-items__row').count();
ok('Cart has the item', cartItems >= 1, String(cartItems));

// Checkout
await page.goto(BASE + '/kasse/', { waitUntil: 'domcontentloaded' });
ok('Checkout loads', (await page.locator('form.checkout, form.wc-block-checkout, .woocommerce-checkout').count()) >= 1);

// Classic checkout field fill (shortcode checkout).
const fill = async (sel, val) => { const l = page.locator(sel); if (await l.count()) await l.first().fill(val); };
await fill('#billing_first_name', 'Max');
await fill('#billing_last_name', 'Mustermann');
await fill('#billing_address_1', 'Weidestraße 122B');
await fill('#billing_postcode', '22083');
await fill('#billing_city', 'Hamburg');
await fill('#billing_phone', '+49 40 56123656');
await fill('#billing_email', 'max@example.com');

const codRadio = page.locator('#payment_method_cod');
ok('COD available', await codRadio.count() >= 1);
if (await codRadio.count()) await codRadio.check().catch(() => {});

// B2B: «Bestellung» without the confirmation fails on the server with production's notice; still the checkout.
const placeBtn = page.locator('#place_order');
const b2bBox = page.locator('input[name="coin_b2b_confirm"]');
const b2bText = 'Bitte bestätigen Sie, dass Sie als Unternehmer bestellen. Der Webshop richtet sich ausschließlich an gewerbliche Kunden — Privatkunden erhalten ein individuelles Angebot.';
let refused = { box: await b2bBox.count() };
if (refused.box === 1 && await placeBtn.count()) {
	await b2bBox.uncheck().catch(() => {});
	const [resp] = await Promise.all([
		page.waitForResponse((r) => r.url().includes('wc-ajax=checkout'), { timeout: 30000 }).catch(() => null),
		placeBtn.click().catch(() => {}),
	]);
	const json = resp ? await resp.json().catch(() => ({})) : {};
	const notice = page.locator('.woocommerce-NoticeGroup-checkout');
	await notice.first().waitFor({ timeout: 10000 }).catch(() => {});
	refused = { ...refused, result: json.result || '', notice: (await notice.count()) ? (await notice.first().innerText()).trim() : '', path: new URL(page.url()).pathname };
}
ok('B2B: no order without the confirmation — production notice, still on the checkout', refused.result === 'failure'
	&& refused.notice.includes(b2bText) && refused.path === '/kasse/', JSON.stringify(refused));

// With the confirmation the order goes through.
let ordered = false;
if (await placeBtn.count()) {
	if (await b2bBox.count()) await b2bBox.check().catch(() => {});
	await placeBtn.click().catch(() => {});
	await page.waitForURL(/order-received/, { timeout: 30000 }).catch(() => {});
	await page.waitForLoadState('networkidle').catch(() => {});
	ordered = /order-received|bestellung|danke|received/i.test(page.url()) ||
		(await page.locator('.woocommerce-order, .woocommerce-thankyou-order-received').count()) >= 1;
}
ok('Order placed (COD)', ordered, page.url());

// The confirmation on the order: production's meta key and value (HPOS or posts storage alike).
const orderId = Number((page.url().match(/order-received\/(\d+)/) || [])[1] || 0);
const meta = orderId ? wpEval(`$o = wc_get_order( ${orderId} ); echo $o ? var_export( $o->get_meta( '_coin_b2b_confirm' ), true ) : 'no order';`) : 'no order id';
ok('B2B: the order carries _coin_b2b_confirm = ja (WP-CLI, wc_get_order()->get_meta())', meta === "'ja'", `#${orderId}: ${meta}`);

await browser.close();
console.log(results.join('\n'));
const fails = results.filter((r) => r.startsWith('FAIL')).length;
console.log(`\n${results.length - fails}/${results.length} PASS`);
process.exit(fails ? 1 : 0);
