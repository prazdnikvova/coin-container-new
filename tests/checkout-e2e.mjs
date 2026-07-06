// Coin Container checkout e2e: add to cart -> cart -> checkout (COD) -> order.
// Note: jQuery IS expected on cart/checkout (WooCommerce core needs it) —
// that is the documented exception to the vanilla-JS policy.
import { chromium } from 'playwright';

const BASE = process.env.CCN_BASE_URL || 'http://coin-container-new.local';
const results = [];
const ok = (name, cond, extra = '') => results.push(`${cond ? 'PASS' : 'FAIL'} ${name}${extra ? ' — ' + extra : ''}`);

const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();

// A product with a price (containers without a price can't be ordered).
await page.goto(BASE + '/product/20-fuss-container-one-way/', { waitUntil: 'domcontentloaded' });
const addBtn = page.locator('button.single_add_to_cart_button');
ok('Add-to-cart present', await addBtn.count() === 1);
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

const placeBtn = page.locator('#place_order');
let ordered = false;
if (await placeBtn.count()) {
	await placeBtn.click().catch(() => {});
  await page.waitForLoadState('networkidle').catch(() => {});
  ordered = /order-received|bestellung|danke|received/i.test(page.url()) ||
            (await page.locator('.woocommerce-order, .woocommerce-thankyou-order-received').count()) >= 1;
}
ok('Order placed (COD)', ordered, page.url());

await browser.close();
console.log(results.join('\n'));
const fails = results.filter((r) => r.startsWith('FAIL')).length;
console.log(`\n${results.length - fails}/${results.length} PASS`);
process.exit(fails ? 1 : 0);
