<?php
/**
 * B2B shop (T-57a), ported from production (transmax-child/inc/b2b-shop.php):
 * the web shop sells only to businesses, tradespeople, public bodies and legal
 * persons (§ 14 BGB); private customers get an individual offer instead of the
 * checkout.
 *
 * 1. Prices: no price suffix (production decision 20.09.2026: the net-price
 *    statement lives in the B2B note) and «ab» before every shown price
 *    (decision 21.10.2026, K55: a listed price is the lower bound, the binding
 *    figure is in the written offer). Visible text only: the JSON-LD
 *    Offer.price of Rank Math reads the raw product price.
 * 2. The B2B note on the product page, the cart and the checkout, with the way
 *    for private customers (the request page).
 * 3. Checkout: a required confirmation «Ich bestelle als Unternehmer …», kept on
 *    the order as _coin_b2b_confirm = ja (production's meta key: one key for
 *    the orders and exports of both sites) and shown in the order screen.
 *
 * Site Settings → Shop → «B2B mode» switches it (on by default); off, prices,
 * notes and the checkout are WooCommerce's own. The texts are production's,
 * byte for byte, as German gettext source strings (DESIGN.md "Shop: B2B
 * note"); the English pages get them from the TranslatePress dictionary.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Whether the shop runs in B2B mode (Site Settings → Shop, on by default:
 * true until the field is saved off). A price asked for before ACF has loaded
 * its fields (acf/init) gets the default: reading Site Settings that early
 * would fill the request cache of ccn_setting() without them.
 *
 * @return bool
 */
function ccn_b2b_enabled() {
	if ( ! did_action( 'acf/init' ) ) {
		return true;
	}
	return (bool) ccn_setting( 'b2b_mode', true );
}

/**
 * No price suffix in B2B mode, whatever the WooCommerce settings hold: the
 * option and the suffix HTML of every price.
 *
 * @param mixed $value Option value or suffix HTML.
 * @return mixed
 */
function ccn_b2b_no_price_suffix( $value ) {
	return ccn_b2b_enabled() ? '' : $value;
}
add_filter( 'option_woocommerce_price_display_suffix', 'ccn_b2b_no_price_suffix' );
add_filter( 'woocommerce_get_price_suffix', 'ccn_b2b_no_price_suffix', 99 );

/**
 * «ab» before a shown price. Products without a price keep their empty
 * output. On sale the word goes before the current amount (<ins>, which
 * WooCommerce hides from screen readers) and the struck-out regular price
 * stays as it is; WooCommerce's screen-reader sentence after it reads
 * «Aktueller Preis: ab …» instead of «Aktueller Preis ist: …» (its German
 * text, as on production).
 *
 * @param string     $price   Price HTML.
 * @param WC_Product $product Product.
 * @return string
 */
function ccn_b2b_price_from( $price, $product ) {
	if ( ! ccn_b2b_enabled() || '' === trim( (string) $price ) || ! $product instanceof WC_Product ) {
		return $price;
	}
	$from = esc_html_x( 'ab', 'price prefix: from', 'coin-container' );
	if ( ! preg_match( '/<ins\b/', $price, $ins, PREG_OFFSET_CAPTURE ) ) {
		return '<span class="ccn-price-from">' . $from . '</span> ' . $price;
	}
	$price = substr_replace( $price, '<span class="ccn-price-from" aria-hidden="true">' . $from . '</span> ', $ins[0][1], 0 );
	return str_replace( 'Aktueller Preis ist: ', esc_html__( 'Aktueller Preis: ab', 'coin-container' ) . ' ', $price );
}
add_filter( 'woocommerce_get_price_html', 'ccn_b2b_price_from', 20, 2 );

/**
 * Link target for private customers: the request page of production
 * (/container-angebot-anfordern/). Site Settings → Calls to action → «Request
 * page URL» while it points at that page, else the page's permalink; without
 * the page, the setting as it is.
 *
 * @return string URL, '' when there is neither.
 */
function ccn_b2b_offer_url() {
	$url  = (string) ccn_setting( 'anfrage_url' );
	$page = get_page_by_path( 'container-angebot-anfordern' );
	if ( ! $page ) {
		return $url;
	}
	$permalink = (string) get_permalink( $page );
	$path      = static function ( $u ) {
		return untrailingslashit( (string) wp_parse_url( $u, PHP_URL_PATH ) );
	};
	return ( '' !== $url && $path( $url ) === $path( $permalink ) ) ? $url : $permalink;
}

/**
 * The B2B note: product page (after the short description, before the
 * add-to-cart form, as on production), cart (above the cart table) and
 * checkout (above the customer details).
 */
function ccn_b2b_note() {
	if ( ! ccn_b2b_enabled() ) {
		return;
	}
	$url = ccn_b2b_offer_url();
	printf(
		'<div class="ccn-b2b-note" role="note">%1$s %2$s<br>%3$s %4$s</div>',
		sprintf(
			/* translators: 1: opening <strong> tag, 2: closing </strong> tag. */
			esc_html__( '%1$sVerkauf ausschließlich an Unternehmer%2$s, Gewerbetreibende, Behörden und juristische Personen (§ 14 BGB).', 'coin-container' ),
			'<strong>',
			'</strong>'
		),
		esc_html__( 'Alle Preise netto zzgl. MwSt. und Lieferung.', 'coin-container' ),
		esc_html__( 'Sie bestellen als Privatperson?', 'coin-container' ),
		sprintf(
			/* translators: 1: opening link tag to the request page, 2: closing link tag. */
			esc_html__( '%1$sFordern Sie ein individuelles Angebot an%2$s.', 'coin-container' ),
			$url ? '<a href="' . esc_url( $url ) . '">' : '',
			$url ? '</a>' : ''
		)
	);
}
add_action( 'woocommerce_single_product_summary', 'ccn_b2b_note', 25 );
add_action( 'woocommerce_before_cart', 'ccn_b2b_note' );
add_action( 'woocommerce_checkout_before_customer_details', 'ccn_b2b_note' );

/**
 * Styles of the note and the confirmation, inline on the three pages that
 * show them (as on production; at most 300 bytes, tokens only), so theme.css
 * stays in the first TCP window. The confirmation box: theme.css gives every
 * input of a WooCommerce form row the full width and every label bold type,
 * so the box and its sentence take the WooCommerce checkbox look back here
 * (ids: an inline style comes before theme.css).
 */
function ccn_b2b_note_css() {
	if ( ! ccn_b2b_enabled() || ! ( is_product() || is_cart() || is_checkout() ) ) {
		return;
	}
	echo '<style id="ccn-b2b-css">.ccn-b2b-note{margin-bottom:var(--ccn-space-4);padding:var(--ccn-space-4);border-left:4px solid var(--ccn-color-secondary);background:var(--ccn-color-light);font-size:var(--ccn-fs-small)}#coin_b2b_confirm_field label{font-weight:400}#coin_b2b_confirm{width:auto}</style>' . "\n";
}
add_action( 'wp_head', 'ccn_b2b_note_css', 1 );

/**
 * Checkout: the required confirmation after the order notes. WooCommerce
 * marks it required the way it marks its own fields (row class
 * validate-required, aria-required on the box, the asterisk); the check
 * itself runs on the server (ccn_b2b_confirm_check()).
 *
 * @param WC_Checkout $checkout Checkout.
 */
function ccn_b2b_confirm_field( $checkout ) {
	if ( ! ccn_b2b_enabled() ) {
		return;
	}
	woocommerce_form_field(
		'coin_b2b_confirm',
		array(
			'type'     => 'checkbox',
			'class'    => array( 'form-row-wide', 'ccn-b2b-confirm' ),
			'required' => true,
			'label'    => __( 'Ich bestelle als Unternehmer, Gewerbetreibender, Behörde oder juristische Person zu gewerblichen Zwecken (§ 14 BGB).', 'coin-container' ),
		),
		$checkout->get_value( 'coin_b2b_confirm' )
	);
}
add_action( 'woocommerce_after_order_notes', 'ccn_b2b_confirm_field' );

/**
 * Whether the checkout form carries the confirmation. WooCommerce has
 * verified its checkout nonce before the hooks that ask.
 *
 * @return bool
 */
function ccn_b2b_confirmed() {
	// phpcs:ignore WordPress.Security.NonceVerification.Missing -- the checkout nonce is verified by WooCommerce (WC_Checkout::process_checkout()).
	return isset( $_POST['coin_b2b_confirm'] ) && wc_string_to_bool( sanitize_text_field( wp_unslash( $_POST['coin_b2b_confirm'] ) ) );
}

/**
 * No order without the confirmation: the error notice of production.
 */
function ccn_b2b_confirm_check() {
	if ( ccn_b2b_enabled() && ! ccn_b2b_confirmed() ) {
		wc_add_notice( __( 'Bitte bestätigen Sie, dass Sie als Unternehmer bestellen. Der Webshop richtet sich ausschließlich an gewerbliche Kunden — Privatkunden erhalten ein individuelles Angebot.', 'coin-container' ), 'error' );
	}
}
add_action( 'woocommerce_checkout_process', 'ccn_b2b_confirm_check' );

/**
 * The confirmation on the order (production's key and value), set before
 * WooCommerce saves the new order, so it is stored with the order itself.
 *
 * @param WC_Order $order Order being created.
 */
function ccn_b2b_confirm_meta( $order ) {
	if ( ccn_b2b_enabled() && ccn_b2b_confirmed() ) {
		$order->update_meta_data( '_coin_b2b_confirm', 'ja' );
	}
}
add_action( 'woocommerce_checkout_create_order', 'ccn_b2b_confirm_meta' );

/**
 * Order screen, after the billing address: the confirmation of an order that
 * carries it. Shown whatever the mode is now: it is a record of that order.
 *
 * @param WC_Order $order Order.
 */
function ccn_b2b_admin_confirmed( $order ) {
	if ( $order instanceof WC_Order && 'ja' === $order->get_meta( '_coin_b2b_confirm' ) ) {
		printf(
			'<p><strong>%1$s</strong> %2$s</p>',
			esc_html__( 'B2B bestätigt:', 'coin-container' ),
			esc_html__( 'Kunde hat gewerbliche Bestellung nach § 14 BGB bestätigt.', 'coin-container' )
		);
	}
}
add_action( 'woocommerce_admin_order_data_after_billing_address', 'ccn_b2b_admin_confirmed' );
