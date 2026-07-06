<?php
/**
 * Front-end asset cleanup — the theme is vanilla-JS only.
 *
 * Policy (see project decision 2026-07-06): jQuery is removed everywhere except
 * the WooCommerce transactional pages (cart / checkout / account), whose core
 * scripts still depend on it. Theme code never depends on jQuery.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * True on the WooCommerce pages whose core JS still needs jQuery.
 */
function ccn_is_wc_transactional() {
	if ( ! class_exists( 'WooCommerce' ) ) {
		return false;
	}
	return is_cart() || is_checkout() || is_account_page();
}

/**
 * Strip the emoji detector (inline script + styles) — dead weight on every page.
 */
remove_action( 'wp_head', 'print_emoji_detection_script', 7 );
remove_action( 'wp_print_styles', 'print_emoji_styles' );
add_filter( 'emoji_svg_url', '__return_false' );

/**
 * Drop jquery-migrate from the jQuery bundle (nothing on the front end uses
 * the deprecated APIs it shims).
 */
add_action( 'wp_default_scripts', 'ccn_drop_jquery_migrate' );
function ccn_drop_jquery_migrate( $scripts ) {
	if ( is_admin() || empty( $scripts->registered['jquery'] ) ) {
		return;
	}
	$jquery = $scripts->registered['jquery'];
	$jquery->deps = array_diff( $jquery->deps, array( 'jquery-migrate' ) );
}

/**
 * Contact Form 7 assets stay off until a page actually renders a form —
 * re-enabled selectively when the form pages are built (task T-19).
 */
add_filter( 'wpcf7_load_js', '__return_false' );
add_filter( 'wpcf7_load_css', '__return_false' );

/**
 * Late dequeues. Cart fragments are disabled everywhere (the header cart count
 * renders server-side); on non-transactional pages the whole jQuery/Woo stack
 * goes away.
 */
add_action( 'wp_enqueue_scripts', 'ccn_cleanup_assets', 99 );
function ccn_cleanup_assets() {
	// No jQuery-powered AJAX cart on any page.
	wp_dequeue_script( 'wc-cart-fragments' );

	if ( ccn_is_wc_transactional() ) {
		return;
	}

	// WooCommerce front-end stack is only needed where the store UI lives.
	$scripts = array(
		'woocommerce',
		'wc-add-to-cart',
		'wc-single-product',
		'wc-order-attribution',
		'sourcebuster-js',
	);
	foreach ( $scripts as $handle ) {
		wp_dequeue_script( $handle );
	}

	// With the Woo scripts gone nothing on the page needs jQuery.
	wp_dequeue_script( 'jquery' );
	wp_deregister_script( 'jquery' );
}
