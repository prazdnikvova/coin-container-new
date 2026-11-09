<?php
/**
 * Container-Glossar (T-57c, DESIGN.md "Glossary"): the A–Z index of the hub
 * /glossar/ and the DefinedTermSet / DefinedTerm JSON-LD, ported from
 * production (transmax-child/inc/seo-migration-glossar.php, its the_content
 * filter; transmax-child/inc/seo-rankmath.php, section 3d).
 *
 * The glossary is plain pages, as on production: the hub (the top-level page
 * with the slug glossar, the page get_page_by_path( 'glossar' ) finds) and one
 * published child page per term, /glossar/<slug>/. Production reads index and
 * schema from a data file (glossar-terms.php); here the pages are the only
 * source: the name is the title of the child page, the short definition its
 * Rank Math meta description (else the first sentence of its text), the
 * address its permalink. A term the team adds as a published child page of
 * the hub joins the index and the schema by itself.
 *
 * - Index: after the hub text (the_content 20, main query, in the loop, as
 *   production), one <div class="ccn-glossary-index"> with an <h2> per first
 *   letter (anything outside A–Z and Ä/Ö/Ü under «#»), letters in natural
 *   order, a <ul> of «<a>Name</a> – definition» per letter, names in natural,
 *   case-insensitive order. No CSS of its own: the prose rules of
 *   .entry-content style the headings and lists. No gettext: every word is
 *   content, so TranslatePress translates it as page text on /en/.
 * - JSON-LD (rank_math/json_ld 99, production's priority): a DefinedTermSet
 *   on the hub with every term in the order of the pages (menu order, then
 *   ID: production's data order), a DefinedTerm on each child page inside
 *   that set; keys and structure as on production, node keys ccnGlossarySet /
 *   ccnGlossaryTerm.
 * - Cost: two SQL queries on the hub (its children, then their meta in one
 *   query), at most one on a child page (its parent). No transient: the index
 *   is current the moment a page is saved.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Slug of the hub page (production's coin_glossar_hub_slug()).
 *
 * @return string
 */
function ccn_glossary_hub_slug() {
	return 'glossar';
}

/**
 * Name of the term set in the schema, production's.
 *
 * @return string
 */
function ccn_glossary_set_name() {
	return 'Container-Glossar';
}

/**
 * Whether a post is the published hub: the top-level page with the hub slug.
 *
 * @param int|WP_Post|null $post Post or ID.
 * @return bool
 */
function ccn_glossary_is_hub( $post ) {
	$post = get_post( $post );
	return $post instanceof WP_Post && 'page' === $post->post_type && 'publish' === $post->post_status
		&& 0 === (int) $post->post_parent && ccn_glossary_hub_slug() === $post->post_name;
}

/**
 * The hub of a term page: the page's parent when the page is a published
 * child of the hub.
 *
 * @param int|WP_Post|null $post Post or ID.
 * @return WP_Post|null
 */
function ccn_glossary_hub_of( $post ) {
	$post = get_post( $post );
	if ( ! $post instanceof WP_Post || 'page' !== $post->post_type || 'publish' !== $post->post_status || (int) $post->post_parent <= 0 ) {
		return null;
	}
	$parent = get_post( (int) $post->post_parent );
	return ccn_glossary_is_hub( $parent ) ? $parent : null;
}

/**
 * Short definition of a term page: its Rank Math meta description
 * (production's 'short'), else the first sentence of its text.
 *
 * @param WP_Post $page Term page.
 * @return string Plain text, '' when the page has none.
 */
function ccn_glossary_description( $page ) {
	$text = trim( (string) get_post_meta( $page->ID, 'rank_math_description', true ) );
	if ( '' !== $text && false !== strpos( $text, '%' ) && class_exists( '\RankMath\Helper' ) ) {
		// Rank Math variables, resolved as for the meta tag of the page.
		$text = trim( (string) \RankMath\Helper::replace_vars( $text, $page ) );
	}
	if ( '' !== $text ) {
		return $text;
	}
	$plain = function_exists( 'ccn_card_excerpt' ) ? ccn_card_excerpt( $page, 300 ) : '';
	return preg_match( '/^(.+?[.!?])(?:\s|$)/u', $plain, $m ) ? $m[1] : wp_trim_words( $plain, 25, '…' );
}

/**
 * The terms of a hub: its published child pages in production's data order
 * (menu order, then ID), each with name, short definition and address.
 * Memoized per request (the schema in the head and the index in the content
 * read the same list).
 *
 * @param WP_Post $hub Hub page.
 * @return array[] Items of 'name', 'description', 'url'.
 */
function ccn_glossary_terms( $hub ) {
	static $memo = array();
	if ( isset( $memo[ $hub->ID ] ) ) {
		return $memo[ $hub->ID ];
	}
	$pages = get_posts(
		array(
			'post_type'              => 'page',
			'post_status'            => 'publish',
			'post_parent'            => $hub->ID,
			'numberposts'            => -1,
			'orderby'                => array(
				'menu_order' => 'ASC',
				'ID'         => 'ASC',
			),
			'update_post_term_cache' => false,
		)
	);
	$terms = array();
	foreach ( $pages as $page ) {
		$terms[] = array(
			'name'        => $page->post_title,
			'description' => ccn_glossary_description( $page ),
			'url'         => (string) get_permalink( $page ),
		);
	}
	$memo[ $hub->ID ] = $terms;
	return $terms;
}

/**
 * The A–Z index, production's grouping and order.
 *
 * @param array[] $terms Terms from ccn_glossary_terms().
 * @return string HTML, '' without terms.
 */
function ccn_glossary_index_html( $terms ) {
	$groups = array();
	foreach ( $terms as $i => $term ) {
		$letter = mb_strtoupper( mb_substr( $term['name'], 0, 1 ) );
		if ( ! preg_match( '/[A-ZÄÖÜ]/u', $letter ) ) {
			$letter = '#';
		}
		$groups[ $letter ][ $i ] = $term['name'];
	}
	if ( ! $groups ) {
		return '';
	}
	uksort( $groups, 'strnatcasecmp' );

	$out = '<div class="ccn-glossary-index">';
	foreach ( $groups as $letter => $names ) {
		asort( $names, SORT_NATURAL | SORT_FLAG_CASE );
		$out .= '<h2>' . esc_html( (string) $letter ) . '</h2><ul>';
		foreach ( array_keys( $names ) as $i ) {
			$term = $terms[ $i ];
			$out .= '<li><a href="' . esc_url( $term['url'] ) . '">' . esc_html( $term['name'] ) . '</a>'
				. ( '' !== $term['description'] ? ' – ' . esc_html( $term['description'] ) : '' ) . '</li>';
		}
		$out .= '</ul>';
	}
	return $out . '</div>';
}

add_filter( 'the_content', 'ccn_glossary_index_content', 20 );
/**
 * The index under the text of the hub (main query, in the loop: not in
 * excerpts, feeds or the REST content of the editor).
 *
 * @param string $content Content.
 * @return string
 */
function ccn_glossary_index_content( $content ) {
	if ( ! is_page() || ! in_the_loop() || ! is_main_query() || ! ccn_glossary_is_hub( get_the_ID() ) ) {
		return $content;
	}
	return $content . ccn_glossary_index_html( ccn_glossary_terms( get_post( get_the_ID() ) ) );
}

/**
 * The @id of the term set: the hub's address with #definedtermset.
 *
 * @param WP_Post $hub Hub page.
 * @return string
 */
function ccn_glossary_set_id( $hub ) {
	return trailingslashit( (string) get_permalink( $hub ) ) . '#definedtermset';
}

add_filter( 'rank_math/json_ld', 'ccn_glossary_json_ld', 99, 2 );
/**
 * DefinedTermSet on the hub, DefinedTerm on a term page (production's 3d).
 *
 * @param array  $data   Graph nodes of Rank Math (key => node).
 * @param object $jsonld Rank Math's JsonLD instance.
 * @return array
 */
function ccn_glossary_json_ld( $data, $jsonld ) {
	unset( $jsonld );
	if ( ! is_array( $data ) || ! is_singular( 'page' ) ) {
		return $data;
	}
	$page = get_queried_object();
	if ( ccn_glossary_is_hub( $page ) ) {
		$terms = ccn_glossary_terms( $page );
		if ( ! $terms ) {
			return $data;
		}
		$set_id = ccn_glossary_set_id( $page );
		$has    = array();
		foreach ( $terms as $term ) {
			$has[] = array(
				'@type'            => 'DefinedTerm',
				'@id'              => trailingslashit( $term['url'] ) . '#definedterm',
				'name'             => $term['name'],
				'url'              => $term['url'],
				'inDefinedTermSet' => $set_id,
			);
		}
		$data['ccnGlossarySet'] = array(
			'@type'          => 'DefinedTermSet',
			'@id'            => $set_id,
			'name'           => ccn_glossary_set_name(),
			'url'            => get_permalink( $page ),
			'publisher'      => array( '@id' => home_url( '/#organization' ) ),
			'hasDefinedTerm' => $has,
		);
		return $data;
	}
	$hub = ccn_glossary_hub_of( $page );
	if ( ! $hub ) {
		return $data;
	}
	$url                     = (string) get_permalink( $page );
	$data['ccnGlossaryTerm'] = array(
		'@type'            => 'DefinedTerm',
		'@id'              => trailingslashit( $url ) . '#definedterm',
		'name'             => $page->post_title,
		'description'      => ccn_glossary_description( $page ),
		'url'              => $url,
		'inDefinedTermSet' => array(
			'@type' => 'DefinedTermSet',
			'@id'   => ccn_glossary_set_id( $hub ),
			'name'  => ccn_glossary_set_name(),
			'url'   => get_permalink( $hub ),
		),
	);
	return $data;
}
