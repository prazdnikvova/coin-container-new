<?php
/**
 * "Zuletzt aktualisiert" line on the cluster and glossary pages, ported 1:1
 * from production (transmax-child/inc/geo-freshness.php, GEO analysis
 * 17.09.2026): the same 38 slugs plus every child page of the glossary hub,
 * pages only, the date from post_modified, «Redaktion: Coin Container Team,
 * Hamburg» linking to /ueber-uns/.
 *
 * Production appends the line through the_content; here the page templates
 * print it after the content (page.php and both landing templates), so the
 * blocks of a page stay untouched. Markup: <p class="ccn-freshness"> with a
 * <time datetime> (UTC from post_modified_gmt). The schema's dateModified
 * comes from Rank Math. Olga asked for no visible dates (06.10.2026,
 * OPEN #73 point 3): open, so the list stays exactly as on production.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Slugs of the pages that show the line (production list, 38 entries).
 *
 * @return string[]
 */
function ccn_freshness_slugs() {
	return array(
		'seecontainer-preise', 'gebrauchte-seecontainer-kaufen', '20-fuss-container-kaufen',
		'40-fuss-container-kaufen', 'kuehlcontainer-mieten', 'materialcontainer-mieten',
		'lagercontainer-mieten', 'sanitaercontainer-mieten', 'container-masse-groessen',
		'seecontainer-baugenehmigung', 'container-ratgeber', 'seecontainer-umbauen-ideen',
		'container-daemmen-isolieren', 'container-lackierung', 'seecontainer-lieferung-absetzen',
		'lagercontainer-mieten-hamburg', 'seecontainer-kaufen-bremen', 'container-transport-europa',
		'8-fuss-container-kaufen', 'isoliercontainer-kaufen', 'wohncontainer', 'containerschloss',
		'seecontainer-sicher-kaufen', 'ueberseecontainer-kaufen', 'container-projekte-referenzen', 'container-ideen-inspiration',
		'bewertungen', 'zertifikate', 'ansprechpartner', 'sanitaercontainer-kaufen', 'buerocontainer-kaufen', 'buerocontainer-mieten',
		'seecontainer-kaufen-duisburg', 'container-ab-rotterdam-antwerpen',
		'seecontainer-kaufen-frankfurt', 'seecontainer-kaufen-muenchen', 'seecontainer-kaufen-stuttgart', 'seecontainer-kaufen-berlin',
	);
}

/**
 * Whether a page shows the line: one of the slugs, or a child of the
 * glossary hub (slug glossar).
 *
 * @param int|WP_Post|null $post Page; the current post by default.
 * @return bool
 */
function ccn_has_freshness( $post = null ) {
	$post = get_post( $post );
	if ( ! $post || 'page' !== $post->post_type ) {
		return false;
	}
	if ( in_array( $post->post_name, ccn_freshness_slugs(), true ) ) {
		return true;
	}
	$parent = (int) $post->post_parent;
	return $parent > 0 && 'glossar' === get_post_field( 'post_name', $parent );
}

/**
 * Print the line for the current page (singular page views only).
 *
 * @param string $wrap_class Optional class of a wrapping div (the full-width
 *                           landing puts the line into the content container).
 */
function ccn_freshness( $wrap_class = '' ) {
	if ( ! is_page() || ! ccn_has_freshness() ) {
		return;
	}
	$post = get_post();
	$line = sprintf(
		'<p class="ccn-freshness">%1$s <time datetime="%2$s">%3$s</time> · %4$s <a href="%5$s">%6$s</a></p>',
		esc_html__( 'Zuletzt aktualisiert:', 'coin-container' ),
		esc_attr( (string) get_post_modified_time( 'c', true, $post ) ),
		esc_html( (string) get_the_modified_date( 'j. F Y', $post ) ),
		esc_html__( 'Redaktion:', 'coin-container' ),
		esc_url( home_url( '/ueber-uns/' ) ),
		esc_html__( 'Coin Container Team, Hamburg', 'coin-container' )
	);
	if ( '' !== $wrap_class ) {
		$line = '<div class="' . esc_attr( $wrap_class ) . '">' . $line . '</div>';
	}
	echo $line; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- every part escaped above.
}
