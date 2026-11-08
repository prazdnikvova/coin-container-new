<?php
/**
 * Visible breadcrumbs (T-49, DESIGN.md "Breadcrumbs"). The trail and its
 * BreadcrumbList schema come from the SEO plugin: Rank Math once it is
 * installed (T-54), Yoast until then. The theme only prints the trail and
 * adds no schema of its own.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Yoast prints its trail only when its breadcrumbs setting is on or the theme
 * declares support: the trail must not depend on a plugin setting.
 */
add_action( 'after_setup_theme', 'ccn_seo_support' );
function ccn_seo_support() {
	add_theme_support( 'yoast-seo-breadcrumbs' );
}

/**
 * Print the trail: <nav aria-label="Brotkrumen"> with an ordered list, the
 * current page last and not linked (aria-current). Nothing on the front page
 * or without an SEO plugin.
 *
 * @param string $extra_class Extra classes for the <nav> (e.g. ccn-container).
 */
function ccn_breadcrumbs( $extra_class = '' ) {
	if ( is_front_page() ) {
		return;
	}
	$ccn_class = trim( 'ccn-breadcrumbs ' . $extra_class );
	$ccn_label = __( 'Brotkrumen', 'coin-container' );
	if ( function_exists( 'rank_math_the_breadcrumbs' ) ) {
		rank_math_the_breadcrumbs(
			array(
				'wrap_before' => '<nav class="' . esc_attr( $ccn_class ) . '" aria-label="' . esc_attr( $ccn_label ) . '"><p>',
				'wrap_after'  => '</p></nav>',
			)
		);
		return;
	}
	if ( ! function_exists( 'yoast_breadcrumb' ) ) {
		return;
	}
	// Yoast's markup as a list: <ol> with an <li> per crumb, no text separator (CSS draws it).
	$ccn_filters = array(
		'wpseo_breadcrumb_output_wrapper'      => 'ccn_breadcrumbs_list_tag',
		'wpseo_breadcrumb_single_link_wrapper' => 'ccn_breadcrumbs_item_tag',
		'wpseo_breadcrumb_separator'           => '__return_empty_string',
	);
	foreach ( $ccn_filters as $ccn_hook => $ccn_callback ) {
		add_filter( $ccn_hook, $ccn_callback );
	}
	$ccn_trail = yoast_breadcrumb( '', '', false );
	foreach ( $ccn_filters as $ccn_hook => $ccn_callback ) {
		remove_filter( $ccn_hook, $ccn_callback );
	}
	if ( $ccn_trail ) {
		printf( '<nav class="%1$s" aria-label="%2$s">%3$s</nav>', esc_attr( $ccn_class ), esc_attr( $ccn_label ), wp_kses_post( $ccn_trail ) );
	}
}

/**
 * @return string
 */
function ccn_breadcrumbs_list_tag() {
	return 'ol';
}

/**
 * @return string
 */
function ccn_breadcrumbs_item_tag() {
	return 'li';
}
