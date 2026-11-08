<?php
/**
 * Live review widgets (T-50, DESIGN.md "Trust"): Google reviews through the
 * Trustindex free widget (plugin wp-reviews-plugin-for-google, configured as on
 * production: layout 13, set drop-shadow, no widget ID) and the Trustpilot
 * TrustBox, both started by main.js only when the reviews block comes within
 * 1200px of the viewport.
 *
 * The widget markup is not part of the page: ~26 KB raw / ~4 KB gzip would push
 * the front page document past the first TCP window (14.6 KB) and add a round
 * trip to FCP and LCP. The block prints a facade; the widget HTML comes from
 * GET /wp-json/ccn/v1/reviews when it is needed. Never put [trustindex] into
 * content directly: the plugin then queues its loader and stylesheet for the
 * first paint. Neither widget sets cookies or web storage (Playwright probe
 * 08.11.2026); the third-party requests start only near the section.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * TrustBox template "Review Collector": the only TrustBox the profile's plan
 * allows (Trustpilot answers 400 "BusinessUnit does not have access to that
 * trustbox" for eight others, 08.11.2026). Its iframe is 52px high.
 */
const CCN_TRUSTBOX_TEMPLATE = '56278e9abfbbba0bdcd568bc';
const CCN_TRUSTBOX_HEIGHT   = 52;

/**
 * Google reviews widget HTML of the Trustindex free widget. The facade already
 * decides when it loads (1200px ahead), so the loader's own lazy mode is switched
 * off with the widget's documented data-lazy-load-disabled attribute: otherwise
 * the loader formats the widget only once it is in view and its slider moves on
 * screen (layout shift 0.45 at 360px, measured 08.11.2026).
 *
 * @return string HTML; '' without the plugin, a connection or reviews.
 */
function ccn_google_reviews_html() {
	if ( ! shortcode_exists( 'trustindex' ) ) {
		return '';
	}
	$html = trim( (string) do_shortcode( '[trustindex no-registration=google]' ) );
	return (string) preg_replace( '/<div (?=[^>]*\bclass="ti-widget\b)/', '<div data-lazy-load-disabled="1" ', $html, 1 );
}

add_action( 'rest_api_init', 'ccn_register_reviews_route' );
function ccn_register_reviews_route() {
	register_rest_route(
		'ccn/v1',
		'/reviews',
		array(
			'methods'             => 'GET',
			'callback'            => 'ccn_reviews_route',
			'permission_callback' => '__return_true',
		)
	);
}

/**
 * REST callback: the Google widget HTML for the reviews facade.
 *
 * @return WP_REST_Response
 */
function ccn_reviews_route() {
	return rest_ensure_response( array( 'html' => ccn_google_reviews_html() ) );
}

/**
 * Data attributes of the TrustBox snippet (public IDs only, no integration key).
 *
 * @return array Attribute => value; empty without a valid business unit ID.
 */
function ccn_trustbox_attributes() {
	$unit = (string) ccn_setting( 'trustpilot_businessunit' );
	if ( ! preg_match( '/^[a-f0-9]{24}$/', $unit ) ) {
		return array();
	}
	return array(
		'data-locale'           => 'de-DE',
		'data-template-id'      => CCN_TRUSTBOX_TEMPLATE,
		'data-businessunit-id'  => $unit,
		'data-style-height'     => CCN_TRUSTBOX_HEIGHT . 'px',
		'data-style-width'      => '100%',
		'data-theme'            => 'light',
	);
}
