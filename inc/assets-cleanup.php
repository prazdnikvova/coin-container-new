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
 * Contact Form 7 assets load only on pages that actually contain a form, so the
 * ~40KB of CF7 CSS/JS never touches the other 30+ pages.
 */
function ccn_page_has_form() {
	if ( ! is_singular() ) {
		return false;
	}
	$post = get_post();
	return $post && has_shortcode( $post->post_content, 'contact-form-7' );
}
add_filter( 'wpcf7_load_js', 'ccn_maybe_load_cf7' );
add_filter( 'wpcf7_load_css', 'ccn_maybe_load_cf7' );
function ccn_maybe_load_cf7( $load ) {
	return ccn_page_has_form();
}

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

/**
 * The theme uses ACF blocks styled by theme.css only. WooCommerce enqueues
 * its blocks stylesheet (wc-blocks.css) as soon as post content contains any
 * block — the theme ships no WC blocks, so it is dead weight. Late hook:
 * Woo enqueues it after the wp_enqueue_scripts cleanup pass.
 */
add_action( 'wp_enqueue_scripts', 'ccn_drop_wc_blocks_style', 9999 );
add_action( 'wp_print_styles', 'ccn_drop_wc_blocks_style', 99 );
function ccn_drop_wc_blocks_style() {
	wp_dequeue_style( 'wc-blocks-style' );
	wp_deregister_style( 'wc-blocks-style' );
}

/**
 * WooCommerce stylesheets (general/layout/smallscreen, 3 requests) load only
 * where products can actually render: Woo pages and pages embedding the
 * featured-products block or a products shortcode. Landings, blog and legal
 * pages carry no product markup — dropping the styles there keeps them
 * within the request budget.
 */
add_action( 'wp_enqueue_scripts', 'ccn_scope_wc_styles', 9998 );
function ccn_scope_wc_styles() {
	if ( ! class_exists( 'WooCommerce' ) ) {
		return;
	}
	if ( is_woocommerce() || is_cart() || is_checkout() || is_account_page() ) {
		return;
	}
	$post = get_post();
	if ( $post && ( has_block( 'acf/featured-products', $post ) || has_shortcode( $post->post_content, 'products' ) ) ) {
		return;
	}
	foreach ( array( 'woocommerce-general', 'woocommerce-layout', 'woocommerce-smallscreen' ) as $ccn_handle ) {
		wp_dequeue_style( $ccn_handle );
	}
}
