<?php
/**
 * WooCommerce integration: theme support, loop layout, lean markup.
 * No gallery zoom/slider/lightbox — those pull jQuery + extra libs; the single
 * product shows a simple, fast gallery instead (vanilla-JS policy).
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action( 'after_setup_theme', 'ccn_woocommerce_support' );
function ccn_woocommerce_support() {
	add_theme_support(
		'woocommerce',
		array(
			'thumbnail_image_width' => 500,
			'single_image_width'    => 800,
		)
	);
}

// 4-up product grid, 12 per page.
add_filter( 'loop_shop_columns', function () { return 4; } );
add_filter( 'loop_shop_per_page', function () { return 12; } );

// Full-width shop: drop the default sidebar.
remove_action( 'woocommerce_sidebar', 'woocommerce_get_sidebar', 10 );

// Show result count / ordering but keep it simple; leave breadcrumbs to Yoast (T-20).
remove_action( 'woocommerce_before_main_content', 'woocommerce_breadcrumb', 20 );

/**
 * Lazy-load product loop thumbnails. WooCommerce marks them eager by default,
 * so featured products (below the fold on the home page) would otherwise
 * compete with the hero LCP and inflate the initial payload.
 */
remove_action( 'woocommerce_before_shop_loop_item_title', 'woocommerce_template_loop_product_thumbnail', 10 );
add_action( 'woocommerce_before_shop_loop_item_title', 'ccn_loop_product_thumbnail', 10 );
function ccn_loop_product_thumbnail() {
	global $product;
	if ( ! $product ) {
		return;
	}
	echo $product->get_image( // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- WC image HTML
		'woocommerce_thumbnail',
		array( 'loading' => 'lazy' )
	);
}
