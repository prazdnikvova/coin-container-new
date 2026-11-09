<?php
/**
 * Internal links of production, ported 1:1 (transmax-child/inc/seo-internal-links.php,
 * cards K4 15.10.2026 and K70 27.10.2026: rules R1, R4 and R5 of the link plan, 45 rows).
 *
 * R1  product -> landing page of its size (32 rows): "Alle 20 Fuß Container" /
 *     "Alle 40 Fuß Container" (the title follows the first link; "Passende
 *     Alternativen" for any other target) at the end of the product summary,
 *     woocommerce_single_product_summary priority 45: after the categories
 *     (meta, 40), before the description tab.
 * R4  category -> hub and landing pages (9 rows) and R5 shop -> category spokes
 *     (4 rows): one «Siehe auch:» line after the product grid,
 *     woocommerce_after_shop_loop priority 25, as on production (where the
 *     category text stands between the grid and the line).
 *
 * Static config, no extra queries; texts and links can be replaced with the
 * filter ccn_internal_links_config. Keys: 'product:<slug>', 'term:<product_cat
 * slug>', 'shop'; values: lists of [ path, anchor ]. Paths are site-relative and
 * printed with home_url(), so the config works on every environment. No link to
 * the current page, no target twice, no nofollow. Styles: theme.css "Internal links".
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Texts and links (production config, CSV order of the link plan).
 *
 * @return array{labels: array<string, string>, links: array<string, array<int, array{0: string, 1: string}>>}
 */
function ccn_internal_links_config() {
	static $config = null;
	if ( null !== $config ) {
		return $config;
	}

	$config = (array) apply_filters(
		'ccn_internal_links_config',
		array(
			'labels' => array(
				'product_title'    => __( 'Passende Alternativen', 'coin-container' ),
				// K70: the product block title by the size of its first link.
				'product_title_20' => __( 'Alle 20 Fuß Container', 'coin-container' ),
				'product_title_40' => __( 'Alle 40 Fuß Container', 'coin-container' ),
				'archive_lead'     => __( 'Siehe auch:', 'coin-container' ),
				'separator'        => ' · ',
			),
			'links'  => array(
				// R1: product -> landing page of its size.
				'product:20-fuss-container-gebraucht'               => array( array( '/20-fuss-container-kaufen/', '20 Fuß Container kaufen' ) ),
				'product:20-fuss-container-one-way'                 => array( array( '/20-fuss-container-kaufen/', '20 Fuß Container kaufen' ) ),
				'product:20-fuss-double-door'                       => array( array( '/20-fuss-container-kaufen/', '20 Fuß Container kaufen' ) ),
				'product:20-fuss-flat-rack-collapsible-ends'        => array( array( '/20-fuss-container-kaufen/', '20 Fuß Container kaufen' ) ),
				'product:20-fuss-hard-top'                          => array( array( '/20-fuss-container-kaufen/', '20 Fuß Container kaufen' ) ),
				'product:20-fuss-high-cube-container'               => array( array( '/20-fuss-container-kaufen/', '20 Fuß Container kaufen' ) ),
				'product:20-fuss-high-cube-double-door'             => array( array( '/20-fuss-container-kaufen/', '20 Fuß Container kaufen' ) ),
				'product:20-fuss-high-cube-open-side'               => array( array( '/20-fuss-container-kaufen/', '20 Fuß Container kaufen' ) ),
				'product:20-fuss-high-cube-pallet-wide'             => array( array( '/20-fuss-container-kaufen/', '20 Fuß Container kaufen' ) ),
				'product:20-fuss-isoliercontainer'                  => array( array( '/20-fuss-container-kaufen/', '20 Fuß Container kaufen' ) ),
				'product:20-fuss-kuehlcontainer-zuverlaessige-kuehlung' => array( array( '/20-fuss-container-kaufen/', '20 Fuß Container kaufen' ) ),
				'product:20-fuss-open-side-container'               => array( array( '/20-fuss-container-kaufen/', '20 Fuß Container kaufen' ) ),
				'product:20-fuss-open-top-container'                => array( array( '/20-fuss-container-kaufen/', '20 Fuß Container kaufen' ) ),
				'product:20-fuss-pallet-wide'                       => array( array( '/20-fuss-container-kaufen/', '20 Fuß Container kaufen' ) ),
				'product:20-fuss-tank-container'                    => array( array( '/20-fuss-container-kaufen/', '20 Fuß Container kaufen' ) ),
				'product:20-fuss-wechselbrueckencontainer'          => array( array( '/20-fuss-container-kaufen/', '20 Fuß Container kaufen' ) ),
				'product:40-flat-rack-collapsible-ends'             => array( array( '/40-fuss-container-kaufen/', '40 Fuß Container kaufen' ) ),
				'product:40-fuss-container-gebraucht'               => array( array( '/40-fuss-container-kaufen/', '40 Fuß Container kaufen' ) ),
				'product:40-fuss-container'                         => array( array( '/40-fuss-container-kaufen/', '40 Fuß Container kaufen' ) ),
				'product:40-fuss-double-door'                       => array( array( '/40-fuss-container-kaufen/', '40 Fuß Container kaufen' ) ),
				'product:40-fuss-flat-rack-collapsible-ends'        => array( array( '/40-fuss-container-kaufen/', '40 Fuß Container kaufen' ) ),
				'product:40-fuss-hard-top-container'                => array( array( '/40-fuss-container-kaufen/', '40 Fuß Container kaufen' ) ),
				'product:40-fuss-hc-isoliercontainer'               => array( array( '/40-fuss-container-kaufen/', '40 Fuß Container kaufen' ) ),
				'product:40-fuss-hc-kuehlcontainer'                 => array( array( '/40-fuss-container-kaufen/', '40 Fuß Container kaufen' ) ),
				'product:40-fuss-hc-open-top'                       => array( array( '/40-fuss-container-kaufen/', '40 Fuß Container kaufen' ) ),
				'product:40-fuss-high-cube-container-gebraucht'     => array( array( '/40-fuss-container-kaufen/', '40 Fuß Container kaufen' ) ),
				'product:40-fuss-high-cube-container'               => array( array( '/40-fuss-container-kaufen/', '40 Fuß Container kaufen' ) ),
				'product:40-fuss-high-cube-double-door'             => array( array( '/40-fuss-container-kaufen/', '40 Fuß Container kaufen' ) ),
				'product:40-fuss-high-cube-hard-top'                => array( array( '/40-fuss-container-kaufen/', '40 Fuß Container kaufen' ) ),
				'product:40-fuss-high-cube-open-side'               => array( array( '/40-fuss-container-kaufen/', '40 Fuß Container kaufen' ) ),
				'product:40-fuss-high-cube-pallet-wide'             => array( array( '/40-fuss-container-kaufen/', '40 Fuß Container kaufen' ) ),
				'product:40-fuss-open-top-container'                => array( array( '/40-fuss-container-kaufen/', '40 Fuß Container kaufen' ) ),
				// R4: category -> hub and landing pages 20/40.
				'term:barcontainer'                                 => array( array( '/container-kaufen/', 'Container kaufen' ) ),
				'term:gebrauchte-seecontainer-kaufen'               => array(
					array( '/20-fuss-container-kaufen/', '20 Fuß Container kaufen' ),
					array( '/40-fuss-container-kaufen/', '40 Fuß Container kaufen' ),
				),
				'term:kuehlcontainer'                               => array(
					array( '/kuehlcontainer-mieten/', 'Kühlcontainer mieten' ), // K70: purchase category -> rental page.
					array( '/container-kaufen/', 'Container kaufen' ),
				),
				'term:spezialcontainer'                             => array( array( '/container-kaufen/', 'Container kaufen' ) ),
				'term:standardcontainer'                            => array(
					array( '/container-kaufen/', 'Container kaufen' ),
					array( '/20-fuss-container-kaufen/', '20 Fuß Container kaufen' ),
					array( '/40-fuss-container-kaufen/', '40 Fuß Container kaufen' ),
				),
				// R5: hub -> spokes.
				'shop'                                              => array(
					array( '/container-kaufen/barcontainer/', 'Barcontainer' ),
					array( '/container-kaufen/containerzubehor/', 'Containerzubehör' ),
					array( '/container-kaufen/containerzubehor/containerschlosser/', 'Containerschlösser' ),
					array( '/container-kaufen/standardcontainer/', 'Standardcontainer' ),
				),
			),
		)
	);

	return $config;
}

/**
 * Configured text, '' when missing.
 *
 * @param string $name Label key.
 * @return string
 */
function ccn_internal_links_label( $name ) {
	$labels = ccn_internal_links_config()['labels'] ?? array();
	return is_array( $labels ) && isset( $labels[ $name ] ) ? (string) $labels[ $name ] : '';
}

/**
 * Links of one source as [ url, anchor ] pairs, without a link to the current
 * page and without a target twice.
 *
 * @param string $key  Config key ('product:<slug>', 'term:<slug>', 'shop').
 * @param string $here URL of the current page.
 * @return array<int, array{0: string, 1: string}>
 */
function ccn_internal_links_for( $key, $here ) {
	$all   = ccn_internal_links_config()['links'] ?? array();
	$items = is_array( $all ) && isset( $all[ $key ] ) ? (array) $all[ $key ] : array();
	$here  = untrailingslashit( (string) wp_parse_url( (string) $here, PHP_URL_PATH ) );
	$seen  = array();
	$out   = array();
	foreach ( $items as $item ) {
		if ( ! is_array( $item ) || count( $item ) < 2 ) {
			continue;
		}
		list( $path, $anchor ) = array_values( $item );
		$anchor                = trim( (string) $anchor );
		$url                   = home_url( '/' . ltrim( (string) $path, '/' ) );
		$target                = untrailingslashit( (string) wp_parse_url( $url, PHP_URL_PATH ) );
		if ( '' === $anchor || $target === $here || isset( $seen[ $target ] ) ) {
			continue;
		}
		$seen[ $target ] = true;
		$out[]           = array( $url, $anchor );
	}
	return $out;
}

add_action( 'woocommerce_single_product_summary', 'ccn_product_internal_links', 45 );
/**
 * R1: the product page, end of the summary.
 */
function ccn_product_internal_links() {
	global $product;
	if ( ! is_product() || ! $product instanceof WC_Product ) {
		return;
	}
	$links = ccn_internal_links_for( 'product:' . $product->get_slug(), (string) get_permalink( $product->get_id() ) );
	if ( ! $links ) {
		return;
	}
	// K70: "Alle 20/40 Fuß Container" when the first link goes to a size landing page, else the generic title.
	$title = '';
	if ( preg_match( '#/(20|40)-fuss-container-kaufen/?$#', (string) wp_parse_url( $links[0][0], PHP_URL_PATH ), $m ) ) {
		$title = ccn_internal_links_label( 'product_title_' . $m[1] );
	}
	if ( '' === $title ) {
		$title = ccn_internal_links_label( 'product_title' );
	}
	$id = wp_unique_id( 'ccn-links-' );
	echo '<nav class="ccn-links ccn-links--product"' . ( '' !== $title ? ' aria-labelledby="' . esc_attr( $id ) . '"' : '' ) . '>';
	if ( '' !== $title ) {
		echo '<p id="' . esc_attr( $id ) . '" class="ccn-links__title">' . esc_html( $title ) . '</p>';
	}
	echo '<ul>';
	foreach ( $links as $link ) {
		echo '<li><a href="' . esc_url( $link[0] ) . '">' . esc_html( $link[1] ) . '</a></li>';
	}
	echo '</ul></nav>';
}

add_action( 'woocommerce_after_shop_loop', 'ccn_archive_internal_links', 25 );
/**
 * R4 + R5: product category and shop, one line after the product grid.
 */
function ccn_archive_internal_links() {
	if ( is_shop() ) {
		$key  = 'shop';
		$here = (string) get_permalink( wc_get_page_id( 'shop' ) );
	} elseif ( is_product_category() ) {
		$term = get_queried_object();
		if ( ! $term instanceof WP_Term ) {
			return;
		}
		$key  = 'term:' . $term->slug;
		$link = get_term_link( $term );
		$here = is_wp_error( $link ) ? '' : (string) $link;
	} else {
		return;
	}
	$links = ccn_internal_links_for( $key, $here );
	if ( ! $links ) {
		return;
	}
	$parts = array();
	foreach ( $links as $link ) {
		$parts[] = '<a href="' . esc_url( $link[0] ) . '">' . esc_html( $link[1] ) . '</a>';
	}
	$lead = ccn_internal_links_label( 'archive_lead' );
	echo '<p class="ccn-links ccn-links--archive">'
		. ( '' !== $lead ? esc_html( $lead ) . ' ' : '' )
		. implode( esc_html( ccn_internal_links_label( 'separator' ) ), $parts ) // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- every part escaped above.
		. '</p>';
}
