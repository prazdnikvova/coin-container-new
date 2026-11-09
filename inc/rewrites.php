<?php
/**
 * Child pages of the landing at the product category base (/container-kaufen/),
 * ported from production (transmax-child/inc/seo-migration-kaufen-hierarchie.php).
 *
 * The product categories live under the same base (woocommerce_permalinks
 * category_base, since T-53a), and WooCommerce registers the catch-all
 * `container-kaufen/(.+?)/?$ -> product_cat=…` among the top rules, so a page
 * such as /container-kaufen/buerocontainer-kaufen/ would be read as a category
 * and answer 404. One explicit rule per published descendant of that landing
 * (its own path -> page_id), added on init before the WooCommerce rules,
 * restores the page hierarchy; categories without a page of the same path stay
 * with WooCommerce.
 *
 * The landing is the page whose path equals the category base, so nothing here
 * names an ID or a slug. Rules are stored by WordPress: after adding, renaming
 * or moving a child page, flush them once (Settings > Permalinks > Save, or
 * `wp rewrite flush`); nothing flushes on a front-end request.
 *
 * Redirects of production's old addresses (top-level /buerocontainer-kaufen/,
 * /containerzubehoer/, /gebrauchte-seecontainer-kaufen/, the shop pagination
 * /container-kaufen/page/N/ …) are not here: they live in the 301 map of the
 * project library, served by the web server (DESIGN.md "URLs and redirects").
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * The published landing page at the product category base, or null.
 *
 * @return WP_Post|null
 */
function ccn_category_base_page() {
	if ( ! function_exists( 'wc_get_permalink_structure' ) ) {
		return null;
	}
	$structure = wc_get_permalink_structure();
	$base      = trim( (string) ( $structure['category_base'] ?? '' ), '/' );
	$page      = '' !== $base ? get_page_by_path( $base ) : null;
	return ( $page instanceof WP_Post && 'publish' === $page->post_status ) ? $page : null;
}

add_action( 'init', 'ccn_category_base_child_rules', 5 );
/**
 * One top rule per published descendant of the category base landing.
 */
function ccn_category_base_child_rules() {
	$landing = ccn_category_base_page();
	if ( ! $landing ) {
		return;
	}
	$children = get_pages(
		array(
			'child_of'    => $landing->ID,
			'post_status' => 'publish',
		)
	);
	foreach ( $children as $child ) {
		$path = get_page_uri( $child );
		if ( '' !== $path ) {
			add_rewrite_rule( '^' . preg_quote( $path, '/' ) . '/?$', 'index.php?page_id=' . (int) $child->ID, 'top' );
		}
	}
}
