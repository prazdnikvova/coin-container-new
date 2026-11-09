<?php
/**
 * TranslatePress (free) compatibility (T-55), ported from the K62 pilot of
 * production (transmax-child/inc/trp-compat.php, cards K62/P2 and K62/P3-2).
 *
 * Included right after the REST header fallback, before the rest of inc/:
 * the memory headroom has to be in place before TranslatePress starts its
 * output buffer (init, priority 0), and inc/trp-seo-en.php and the language
 * switcher use the helpers below. Without TranslatePress every helper answers
 * as for the default language and every filter here stays inert.
 *
 * What it does:
 * 1. ccn_trp_is_default_language() / ccn_trp_default_language() /
 *    ccn_trp_current_language() for the other files.
 * 2. Memory headroom for the translated render, and a render journal in
 *    debug.log when WP_DEBUG is on.
 * 3. TranslatePress' own front-end assets off: the theme prints its own
 *    language switcher (template-parts/language-switcher.php).
 * 4. WooCommerce and Contact Form 7: shop e-mails in the default language,
 *    customer data out of the dictionary, CF7 responses translated on /en/.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Default language of TranslatePress ('' without the plugin).
 *
 * @return string Locale, e.g. de_DE_formal.
 */
function ccn_trp_default_language() {
	static $default = null;
	if ( null === $default ) {
		$settings = class_exists( 'TRP_Translate_Press' ) ? TRP_Translate_Press::get_trp_instance()->get_component( 'settings' )->get_settings() : array();
		$default  = isset( $settings['default-language'] ) ? (string) $settings['default-language'] : '';
	}
	return $default;
}

/**
 * Language of the current request: TranslatePress sets $TRP_LANGUAGE from the
 * URL on plugins_loaded; until then (or without the plugin) the site is German.
 *
 * @return string Locale, '' without TranslatePress.
 */
function ccn_trp_current_language() {
	global $TRP_LANGUAGE;
	return ( class_exists( 'TRP_Translate_Press' ) && ! empty( $TRP_LANGUAGE ) ) ? (string) $TRP_LANGUAGE : '';
}

/**
 * True without TranslatePress or when the request is in its default language.
 *
 * @return bool
 */
function ccn_trp_is_default_language() {
	$current = ccn_trp_current_language();
	return '' === $current || ccn_trp_default_language() === $current;
}

/*
 * Memory headroom for TranslatePress' translate_page() (pilot K62/P2). The
 * plugin parses the whole page with simple_html_dom inside its output-buffer
 * display handler and needs 9-15 MB on top of the finished page. Running out
 * of memory there cannot even be reported: PHP stops with "Cannot use output
 * buffering in output buffering display handlers" and the visitor gets HTTP
 * 200 with an empty body (pilot: 6 of ~205 first renders of English pages at
 * 256M, 0 of 300 at 512M). On a translated language the limit goes up to 512M
 * through core's wp_raise_memory_limit() - only when it is lower, never down.
 */
add_filter( 'ccn_trp_memory_limit', 'ccn_trp_memory_limit_value' );
function ccn_trp_memory_limit_value() {
	return '512M';
}

add_action( 'init', 'ccn_trp_raise_memory_limit', -1 );
function ccn_trp_raise_memory_limit() {
	if ( is_admin() || wp_doing_cron() || ccn_trp_is_default_language() ) {
		return;
	}
	wp_raise_memory_limit( 'ccn_trp' );
}

/*
 * Render journal of the translated language, WP_DEBUG only (debug.log). A
 * fatal error inside the display handler ends PHP before any shutdown hook or
 * destructor runs (tested with PHP 8.2), so a shutdown check would never see
 * the empty page; the checks sit inside the handler instead. Its start notes
 * the request and logs it when memory is already past half of the limit (a
 * fatal that follows then has its address in the log); its end logs an empty
 * result (HTTP 200 without a body) and renders that came within 20 % of the
 * limit.
 */
add_filter( 'trp_before_translate_content', 'ccn_trp_render_start', 0 );
function ccn_trp_render_start( $output ) {
	if ( ! WP_DEBUG ) {
		return $output;
	}
	$limit                     = wp_convert_hr_to_bytes( (string) ini_get( 'memory_limit' ) );
	$GLOBALS['ccn_trp_render'] = array(
		'bytes' => is_string( $output ) ? strlen( $output ) : 0,
		'limit' => $limit,
	);
	if ( $limit > 0 && memory_get_usage() > 0.5 * $limit ) {
		error_log( sprintf( 'ccn trp-compat: translated render starts at %d of %d bytes for %s', memory_get_usage(), $limit, ccn_trp_request_uri() ) ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log -- WP_DEBUG only.
	}
	return $output;
}

add_filter( 'trp_translated_html', 'ccn_trp_render_end', PHP_INT_MAX );
function ccn_trp_render_end( $html ) {
	if ( ! WP_DEBUG || empty( $GLOBALS['ccn_trp_render'] ) ) {
		return $html;
	}
	$start = $GLOBALS['ccn_trp_render'];
	unset( $GLOBALS['ccn_trp_render'] );
	if ( $start['bytes'] > 0 && ( ! is_string( $html ) || '' === $html ) && 200 === http_response_code() ) {
		error_log( sprintf( 'ccn trp-compat: empty 200 response for %s (%d bytes before translation)', ccn_trp_request_uri(), $start['bytes'] ) ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log -- WP_DEBUG only.
	}
	$peak = memory_get_peak_usage();
	if ( $start['limit'] > 0 && $peak > 0.8 * $start['limit'] ) {
		error_log( sprintf( 'ccn trp-compat: translated render peak %d of %d bytes for %s', $peak, $start['limit'], ccn_trp_request_uri() ) ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log -- WP_DEBUG only.
	}
	return $html;
}

/**
 * Request path for the log lines.
 *
 * @return string
 */
function ccn_trp_request_uri() {
	return isset( $_SERVER['REQUEST_URI'] ) ? esc_url_raw( wp_unslash( $_SERVER['REQUEST_URI'] ) ) : '';
}

/*
 * TranslatePress' own front-end assets stay off; each would be one more
 * request on every page (the front page has none to spare):
 * - trp-language-switcher-v2 (stylesheet + script): the switcher v2 enqueues
 *   them on every page even with its floater off; the theme prints its own
 *   switcher (template-parts/language-switcher.php);
 * - trp-frontend-compatibility: on WooCommerce sites it clears the cart
 *   fragments in sessionStorage when one of TranslatePress' switchers is
 *   clicked; the theme has neither (cart fragments are off,
 *   inc/assets-cleanup.php);
 * - trp-dynamic-translator (English pages only) depends on jQuery, which the
 *   theme removes outside the WooCommerce pages (inc/assets-cleanup.php,
 *   priority 99): there it would be printed without its dependency, so it is
 *   dropped with it. Where jQuery stays (shop, products, cart, checkout,
 *   account) it translates the text that scripts add to the page.
 */
add_action( 'wp_enqueue_scripts', 'ccn_trp_dequeue_assets', 100 );
function ccn_trp_dequeue_assets() {
	if ( ! class_exists( 'TRP_Translate_Press' ) ) {
		return;
	}
	wp_dequeue_style( 'trp-language-switcher-v2' );
	wp_dequeue_script( 'trp-language-switcher-js-v2' );
	wp_dequeue_script( 'trp-frontend-compatibility' );
	if ( ! wp_script_is( 'jquery', 'registered' ) ) {
		wp_dequeue_script( 'trp-dynamic-translator' );
	}
}

/*
 * TranslatePress prints <template id="tp-language" data-tp-language="…"> at
 * the start of the footer of every page. Only its paid Automatic User
 * Language Detection add-on reads it; on the front page those bytes are part
 * of the first TCP window the document has to fit into (DESIGN.md "Do /
 * don't").
 */
add_action( 'wp', 'ccn_trp_drop_language_template' );
function ccn_trp_drop_language_template() {
	if ( class_exists( 'TRP_Translate_Press' ) ) {
		remove_filter( 'wp_footer', array( TRP_Translate_Press::get_trp_instance()->get_component( 'url_converter' ), 'add_tp_language_lang_attribute' ), 1 );
	}
}

/*
 * Shop e-mails (new order, cancelled, failed ...) always in the default
 * language: the shop team reads German (pilot K62/P3-2). Without this,
 * TranslatePress sends them in the language of the order unless the first
 * recipient is a user with a profile language. Customer e-mails keep the
 * customer's language.
 */
add_filter( 'trp_woo_email_language', 'ccn_trp_shop_email_language', 10, 2 );
function ccn_trp_shop_email_language( $language, $is_customer_email ) {
	if ( $is_customer_email ) {
		return $language;
	}
	$default = ccn_trp_default_language();
	return '' === $default ? $language : $default;
}

/*
 * Contact Form 7 (pilot K62/P3-2): the form responses (errors, the thank-you
 * text) come back as JSON of the REST feedback request, which TranslatePress
 * translates only for the routes of its rule table. Register the CF7 routes,
 * key "message" at any depth (top level and invalid_fields[].message).
 */
add_filter( 'trp_rest_api_translation_config', 'ccn_trp_cf7_rest_config' );
function ccn_trp_cf7_rest_config( $config ) {
	$config['contact-form-7/v1/contact-forms'] = array( 'message' );
	return $config;
}

/**
 * The order whose page or e-mail is being rendered: the e-mail being sent,
 * the thank-you page or the order view of the account (pilot K62/P3-2).
 *
 * @return WC_Order|null
 */
function ccn_trp_order_in_context() {
	global $TRP_EMAIL_ORDER;
	if ( ! function_exists( 'wc_get_order' ) ) {
		return null;
	}
	$id = 0;
	if ( ! empty( $TRP_EMAIL_ORDER ) ) {
		$id = (int) $TRP_EMAIL_ORDER;
	} elseif ( function_exists( 'is_wc_endpoint_url' ) ) {
		if ( is_wc_endpoint_url( 'order-received' ) ) {
			$id = absint( get_query_var( 'order-received' ) );
		} elseif ( is_wc_endpoint_url( 'view-order' ) ) {
			$id = absint( get_query_var( 'view-order' ) );
		}
	}
	$order = $id ? wc_get_order( $id ) : null;
	return $order instanceof WC_Order ? $order : null;
}

/**
 * Personal values of an order (names, company, street, postcode and city,
 * phone, e-mail, note lines), lower-cased, as array keys.
 *
 * @param WC_Order $order Order.
 * @return array
 */
function ccn_trp_order_personal_values( WC_Order $order ) {
	$values = array( $order->get_billing_email(), $order->get_billing_phone(), $order->get_shipping_phone() );
	foreach ( array( 'billing', 'shipping' ) as $type ) {
		$field = function ( $name ) use ( $order, $type ) {
			return trim( (string) call_user_func( array( $order, "get_{$type}_{$name}" ) ) );
		};
		array_push(
			$values,
			$field( 'first_name' ),
			$field( 'last_name' ),
			$field( 'first_name' ) . ' ' . $field( 'last_name' ),
			$field( 'company' ),
			$field( 'address_1' ),
			$field( 'address_2' ),
			$field( 'postcode' ) . ' ' . $field( 'city' ),
			$field( 'city' ) . ' ' . $field( 'postcode' )
		);
	}
	foreach ( preg_split( '/\R/u', (string) $order->get_customer_note() ) as $line ) {
		$values[] = $line;
	}
	$keys = array();
	foreach ( $values as $value ) {
		$value = mb_strtolower( trim( (string) $value ) );
		// Single letters, two-letter state codes and empty fields would match ordinary strings.
		if ( mb_strlen( $value ) >= 3 ) {
			$keys[ $value ] = true;
		}
	}
	return $keys;
}

/*
 * Customer data stays out of the dictionary (pilot K62/P3-2). On English
 * order pages and in order e-mails TranslatePress registers every text node:
 * the customer's name, street, postcode and city and e-mail became
 * dictionary rows - personal data of real buyers in a translation table,
 * which a translation pipeline would send on. For the order in context every
 * string equal to one of its personal values is dropped before TranslatePress
 * looks it up or stores it; the node stays as rendered.
 */
add_filter( 'trp_translateable_strings', 'ccn_trp_drop_personal_strings' );
function ccn_trp_drop_personal_strings( $info ) {
	if ( empty( $info['translateable_strings'] ) || ccn_trp_is_default_language() ) {
		return $info;
	}
	$order = ccn_trp_order_in_context();
	if ( ! $order ) {
		return $info;
	}
	$personal = ccn_trp_order_personal_values( $order );
	$dropped  = 0;
	foreach ( $info['translateable_strings'] as $key => $string ) {
		$norm = mb_strtolower( trim( html_entity_decode( wp_strip_all_tags( (string) $string ), ENT_QUOTES, 'UTF-8' ) ) );
		if ( isset( $personal[ $norm ] ) ) {
			unset( $info['translateable_strings'][ $key ], $info['nodes'][ $key ] );
			++$dropped;
		}
	}
	if ( $dropped ) {
		// Keep both lists dense and aligned: TranslatePress pairs them by key.
		$info['translateable_strings'] = array_values( $info['translateable_strings'] );
		$info['nodes']                 = array_values( $info['nodes'] );
	}
	return $info;
}
