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
 * Lightweight catalog filter bar before the shop loop: category links + the
 * native ordering dropdown. Pure server-rendered links, zero JS — replaces the
 * heavy AJAX-filter plugin used on the old site.
 */
add_action( 'woocommerce_before_shop_loop', 'ccn_catalog_filter', 25 );
function ccn_catalog_filter() {
	if ( ! is_shop() && ! is_product_category() ) {
		return;
	}
	$terms = get_terms(
		array(
			'taxonomy'   => 'product_cat',
			'hide_empty' => true,
			'parent'     => 0,
		)
	);
	if ( is_wp_error( $terms ) || ! $terms ) {
		return;
	}
	$current = is_product_category() ? get_queried_object_id() : 0;
	echo '<nav class="catalog-filter" aria-label="' . esc_attr__( 'Kategorien', 'coin-container' ) . '">';
	printf(
		'<a class="catalog-filter-link%s" href="%s">%s</a>',
		$current ? '' : ' is-active',
		esc_url( get_permalink( wc_get_page_id( 'shop' ) ) ),
		esc_html__( 'Alle', 'coin-container' )
	);
	foreach ( $terms as $term ) {
		$active = ( $term->term_id === $current );
		printf(
			'<a class="catalog-filter-link%s" href="%s">%s</a>',
			$active ? ' is-active' : '',
			esc_url( get_term_link( $term ) ),
			esc_html( $term->name )
		);
		// One level of children, so subcategories are reachable too.
		$children = get_terms(
			array(
				'taxonomy'   => 'product_cat',
				'hide_empty' => true,
				'parent'     => $term->term_id,
			)
		);
		if ( ! is_wp_error( $children ) ) {
			foreach ( $children as $child ) {
				printf(
					'<a class="catalog-filter-link catalog-filter-child%s" href="%s">%s</a>',
					( $child->term_id === $current ) ? ' is-active' : '',
					esc_url( get_term_link( $child ) ),
					esc_html( $child->name )
				);
			}
		}
	}
	echo '</nav>';
}

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
