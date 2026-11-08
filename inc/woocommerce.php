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

// Sale badge wording as on the original site ("Angebot!", uppercased via CSS).
add_filter( 'woocommerce_sale_flash', 'ccn_sale_flash' );
function ccn_sale_flash() {
	return '<span class="onsale">' . esc_html__( 'Angebot!', 'coin-container' ) . '</span>';
}

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
 *
 * The card draws the square image contained in a 4:3 box (DESIGN.md "Cards"),
 * i.e. at three quarters of the box width: "sizes" says so instead of WP's
 * "auto" (the box width), which kept phones on the 768px file after the grid
 * went to one column (T-48); the 500px file is enough there.
 */
remove_action( 'woocommerce_before_shop_loop_item_title', 'woocommerce_template_loop_product_thumbnail', 10 );
add_action( 'woocommerce_before_shop_loop_item_title', 'ccn_loop_product_thumbnail', 10 );
function ccn_loop_product_thumbnail() {
	global $product;
	if ( ! $product ) {
		return;
	}
	add_filter( 'wp_img_tag_add_auto_sizes', '__return_false' );
	echo $product->get_image( // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- WC image HTML
		'woocommerce_thumbnail',
		array(
			'loading' => 'lazy',
			'sizes'   => '(max-width: 575px) calc(75vw - 44px), (max-width: 1023px) calc(38vw - 40px), 270px',
		)
	);
	remove_filter( 'wp_img_tag_add_auto_sizes', '__return_false' );
}

/**
 * Inside post content (featured-products block) the content filter adds the
 * "auto" again; drop it for the loop thumbnails only (see above).
 *
 * @param string $img Filtered img tag.
 * @return string
 */
add_filter( 'wp_content_img_tag', 'ccn_loop_thumbnail_sizes' );
function ccn_loop_thumbnail_sizes( $img ) {
	return str_contains( $img, 'attachment-woocommerce_thumbnail' ) ? str_replace( 'sizes="auto, ', 'sizes="', $img ) : $img;
}

/**
 * Loop card titles one level down. WooCommerce prints them as h2, which is
 * right on the shop (cards under the page h1) but too high inside the
 * featured-products block when the block has its own h2 heading. The block
 * swaps the title callback around its loop and swaps it back afterwards.
 *
 * @param bool $as_h3 True: card titles as h3; false: back to WooCommerce's h2.
 */
function ccn_loop_title_as_h3( $as_h3 ) {
	$from     = $as_h3 ? 'woocommerce_template_loop_product_title' : 'ccn_loop_product_title_h3';
	$to       = $as_h3 ? 'ccn_loop_product_title_h3' : 'woocommerce_template_loop_product_title';
	$priority = has_action( 'woocommerce_shop_loop_item_title', $from );
	if ( false === $priority ) {
		return;
	}
	remove_action( 'woocommerce_shop_loop_item_title', $from, $priority );
	add_action( 'woocommerce_shop_loop_item_title', $to, $priority );
}

/**
 * Same markup and class filter as woocommerce_template_loop_product_title(),
 * as an h3.
 */
function ccn_loop_product_title_h3() {
	echo '<h3 class="' . esc_attr( apply_filters( 'woocommerce_product_loop_title_classes', 'woocommerce-loop-product__title' ) ) . '">' . wp_kses_post( get_the_title() ) . '</h3>';
}

/**
 * "Ähnliche Produkte" in a fixed order. WooCommerce shuffles the candidates
 * before it picks four and then sorts the four by "rand", so every load of a
 * product page showed other cards (T-44 note 7). Now the candidates (same
 * categories, as before) are sorted by menu order, then title, and the first
 * four keep that order: the same products on every load.
 */
add_filter( 'woocommerce_product_related_posts_shuffle', '__return_false' );
add_filter( 'woocommerce_related_products', 'ccn_related_products_order' );
add_filter( 'woocommerce_output_related_products_args', 'ccn_related_products_args' );

/**
 * @param int[] $ids Related product IDs (all candidates, before the limit).
 * @return int[]
 */
function ccn_related_products_order( $ids ) {
	if ( empty( $ids ) ) {
		return $ids;
	}
	return get_posts(
		array(
			'post_type'      => 'product',
			'post__in'       => array_map( 'absint', (array) $ids ),
			'orderby'        => array(
				'menu_order' => 'ASC',
				'title'      => 'ASC',
			),
			'posts_per_page' => count( $ids ),
			'fields'         => 'ids',
			'no_found_rows'  => true,
		)
	);
}

/**
 * Keep that order: "none" skips WooCommerce's shuffle ("rand" is its default)
 * and "asc" its final reverse.
 *
 * @param array $args Related products arguments.
 * @return array
 */
function ccn_related_products_args( $args ) {
	$args['orderby'] = 'none';
	$args['order']   = 'asc';
	return $args;
}
