<?php
/**
 * Visible breadcrumbs (T-49, DESIGN.md "Breadcrumbs") from Rank Math (T-54).
 * The plugin builds the trail and its BreadcrumbList schema from the same
 * crumbs; the theme only prints them as an ordered list. The trail follows
 * production (transmax-child/inc/breadcrumbs.php): «Startseite», the shop level
 * after it on products and product categories (named after the landing at the
 * category base, «Container kaufen», since T-53c), parent categories, a
 * product's primary category, names with HTML entities decoded.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// «Startseite» instead of the "Home" of the plugin settings, as on production.
add_filter( 'rank_math/frontend/breadcrumb/strings', 'ccn_breadcrumb_strings' );
function ccn_breadcrumb_strings( $strings ) {
	$strings['home'] = __( 'Startseite', 'coin-container' );
	return $strings;
}

// The shop page as the level after Startseite on products and product categories:
// Rank Math adds it only when the product base contains the shop slug (ours is /product/).
add_filter( 'rank_math/frontend/breadcrumb/is_using_shop_base', '__return_true' );

// Parents of a subcategory: off in the plugin settings, on in code, as on production.
add_filter( 'rank_math/frontend/breadcrumb/settings', 'ccn_breadcrumb_settings' );
function ccn_breadcrumb_settings( $settings ) {
	$settings['show_ancestors'] = true;
	return $settings;
}

/**
 * Primary product category: Rank Math's primary-term meta, else the deepest
 * category that is not "uncategorized" (the first one on a tie, which is
 * production's rule for products in top-level categories only).
 *
 * @param int $post_id Product ID.
 * @return WP_Term|null
 */
function ccn_breadcrumb_primary_cat( $post_id ) {
	$primary = (int) get_post_meta( $post_id, 'rank_math_primary_product_cat', true );
	$term    = $primary ? get_term( $primary, 'product_cat' ) : null;
	if ( $term instanceof WP_Term ) {
		return $term;
	}
	$terms = get_the_terms( $post_id, 'product_cat' );
	if ( ! $terms || is_wp_error( $terms ) ) {
		return null;
	}
	$best  = null;
	$depth = -1;
	foreach ( $terms as $candidate ) {
		$candidate_depth = count( get_ancestors( $candidate->term_id, 'product_cat' ) );
		if ( 'uncategorized' !== $candidate->slug && $candidate_depth > $depth ) {
			$best  = $candidate;
			$depth = $candidate_depth;
		}
	}
	return $best;
}

/**
 * Products: the primary category (with its parents) goes between the shop page
 * and the product (Rank Math does that only with a primary taxonomy set, which
 * production leaves at 0). Then HTML entities in every name are decoded, for
 * the visible trail and the schema alike.
 *
 * @param array $crumbs Crumbs: [ name, url, 'hide_in_schema' => bool ].
 * @return array
 */
add_filter( 'rank_math/frontend/breadcrumb/items', 'ccn_breadcrumb_items' );
function ccn_breadcrumb_items( $crumbs ) {
	if ( ! is_array( $crumbs ) ) {
		return $crumbs;
	}
	// The shop level of products and categories names the landing at the category
	// base (/container-kaufen/), as production does: there that page is the shop.
	// The shop archive keeps its own page here (/container-shop/, decision T-53c 1).
	if ( function_exists( 'is_product' ) && ( is_product() || is_product_category() ) && function_exists( 'ccn_category_base_page' ) ) {
		$landing  = ccn_category_base_page();
		$shop_url = wc_get_page_permalink( 'shop' );
		foreach ( $crumbs as $key => $crumb ) {
			if ( $landing && isset( $crumb[1] ) && $crumb[1] === $shop_url ) {
				$crumbs[ $key ][0] = get_the_title( $landing );
				$crumbs[ $key ][1] = get_permalink( $landing );
			}
		}
	}
	if ( function_exists( 'is_product' ) && is_product() && count( $crumbs ) >= 2 ) {
		$cat      = ccn_breadcrumb_primary_cat( get_queried_object_id() );
		$cat_link = $cat ? get_term_link( $cat ) : '';
		if ( is_string( $cat_link ) && '' !== $cat_link && ! in_array( $cat_link, array_column( $crumbs, 1 ), true ) ) {
			$insert = array();
			foreach ( array_reverse( get_ancestors( $cat->term_id, 'product_cat' ) ) as $ancestor_id ) {
				$ancestor = get_term( $ancestor_id, 'product_cat' );
				$link     = $ancestor instanceof WP_Term ? get_term_link( $ancestor ) : '';
				if ( is_string( $link ) && '' !== $link ) {
					$insert[] = array( $ancestor->name, $link, 'hide_in_schema' => false );
				}
			}
			$insert[] = array( $cat->name, $cat_link, 'hide_in_schema' => false );
			array_splice( $crumbs, count( $crumbs ) - 1, 0, $insert );
		}
	}
	foreach ( $crumbs as $key => $crumb ) {
		$crumbs[ $key ][0] = html_entity_decode( (string) $crumb[0], ENT_QUOTES | ENT_HTML5, 'UTF-8' );
	}
	return $crumbs;
}

/**
 * Print the trail: <nav aria-label="Brotkrumen"> with an ordered list, the
 * current page last and not linked (aria-current). Rank Math's own markup (a
 * <p> with separator spans) is replaced through its html filter for this call;
 * the separator is drawn by CSS. Nothing on the front page or without Rank Math.
 *
 * @param string $extra_class Extra classes for the <nav> (e.g. ccn-container).
 */
function ccn_breadcrumbs( $extra_class = '' ) {
	if ( is_front_page() || ! function_exists( 'rank_math_the_breadcrumbs' ) ) {
		return;
	}
	$ccn_class = trim( 'ccn-breadcrumbs ' . $extra_class );
	$ccn_list  = function ( $html, $crumbs ) use ( $ccn_class ) {
		unset( $html );
		$crumbs = array_values( (array) $crumbs );
		$last   = count( $crumbs ) - 1;
		$items  = '';
		foreach ( $crumbs as $i => $crumb ) {
			$name = isset( $crumb[0] ) ? (string) $crumb[0] : '';
			$url  = isset( $crumb[1] ) ? (string) $crumb[1] : '';
			if ( $i === $last ) {
				$items .= '<li aria-current="page">' . esc_html( $name ) . '</li>';
			} elseif ( '' === $url ) {
				$items .= '<li>' . esc_html( $name ) . '</li>';
			} else {
				$items .= '<li><a href="' . esc_url( $url ) . '">' . esc_html( $name ) . '</a></li>';
			}
		}
		return '<nav class="' . esc_attr( $ccn_class ) . '" aria-label="' . esc_attr__( 'Brotkrumen', 'coin-container' ) . '"><ol>' . $items . '</ol></nav>';
	};
	add_filter( 'rank_math/frontend/breadcrumb/html', $ccn_list, 10, 2 );
	rank_math_the_breadcrumbs();
	remove_filter( 'rank_math/frontend/breadcrumb/html', $ccn_list, 10 );
}
