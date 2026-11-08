<?php
/**
 * LocalBusiness JSON-LD — Yoast (free) outputs Organization but not a postal
 * address / geo. This adds a LocalBusiness node on the front page for local
 * SEO (the strongest competitor ranks partly on this). Data comes from Site
 * Settings so it stays admin-editable.
 *
 * FAQ (T-50): the question/answer pairs of the acf/faq blocks of a page, emitted
 * as Site Settings → Schema → faq_schema_mode says. Default = production
 * (transmax-child/inc/seo-qapage.php): the questions as mainEntity of the
 * WebPage node of Rank Math's graph, no FAQPage node; that needs Rank Math
 * (T-54), so before it nothing is printed. "faqpage" prints an own FAQPage
 * node, "none" nothing. aggregateRating / Review are never emitted: reviews of
 * the own business are self-serving for Google (team decision 22.09.2026).
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action( 'wp_head', 'ccn_local_business_schema', 20 );
function ccn_local_business_schema() {
	if ( ! is_front_page() || ! function_exists( 'ccn_setting' ) ) {
		return;
	}

	$address = ccn_setting( 'address' ); // "Weidestraße 122B, 22083 Hamburg"
	$street  = $address;
	$zip     = '';
	$city    = '';
	if ( preg_match( '/^(.*?),\s*(\d{5})\s+(.+)$/u', $address, $m ) ) {
		$street = trim( $m[1] );
		$zip    = $m[2];
		$city   = trim( $m[3] );
	}

	$schema = array(
		'@context'  => 'https://schema.org',
		'@type'     => 'LocalBusiness',
		'@id'       => home_url( '/#localbusiness' ),
		'name'      => ccn_setting( 'company_name', get_bloginfo( 'name' ) ),
		'url'       => home_url( '/' ),
		'image'     => get_template_directory_uri() . '/assets/img/logo.webp',
		'telephone' => ccn_setting( 'phone' ),
		'email'     => ccn_setting( 'email' ),
		'address'   => array(
			'@type'           => 'PostalAddress',
			'streetAddress'   => $street,
			'postalCode'      => $zip,
			'addressLocality' => $city,
			'addressCountry'  => 'DE',
		),
		'geo'       => array(
			'@type'     => 'GeoCoordinates',
			'latitude'  => '53.5753',
			'longitude' => '10.0409',
		),
		'areaServed' => 'Europe',
	);

	$sameas = array_filter(
		array(
			ccn_setting( 'social_facebook' ),
			ccn_setting( 'social_instagram' ),
			ccn_setting( 'social_linkedin' ),
			ccn_setting( 'social_ebay' ),
			ccn_setting( 'social_pinterest' ),
			ccn_setting( 'social_xing' ),
			ccn_setting( 'social_kleinanzeigen' ),
		)
	);
	if ( $sameas ) {
		$schema['sameAs'] = array_values( $sameas );
	}

	echo '<script type="application/ld+json">' . wp_json_encode( $schema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ) . "</script>\n";
}

/**
 * Question/answer pairs of every acf/faq block of a post, nested blocks included.
 *
 * @param int|WP_Post $post Post or ID.
 * @return array[] Pairs of 'question' (text) and 'answer' (HTML).
 */
function ccn_faq_items( $post ) {
	$post = get_post( $post );
	if ( ! $post || ! has_block( 'acf/faq', $post ) ) {
		return array();
	}
	$pairs = array();
	$walk  = function ( $blocks ) use ( &$walk, &$pairs ) {
		foreach ( $blocks as $block ) {
			if ( 'acf/faq' === $block['blockName'] ) {
				$data  = isset( $block['attrs']['data'] ) ? (array) $block['attrs']['data'] : array();
				$count = isset( $data['items'] ) ? (int) $data['items'] : 0;
				for ( $i = 0; $i < $count; $i++ ) {
					$question = isset( $data[ 'items_' . $i . '_question' ] ) ? trim( (string) $data[ 'items_' . $i . '_question' ] ) : '';
					$answer   = isset( $data[ 'items_' . $i . '_answer' ] ) ? trim( (string) $data[ 'items_' . $i . '_answer' ] ) : '';
					if ( '' !== $question && '' !== $answer ) {
						$pairs[] = array(
							'question' => $question,
							'answer'   => $answer,
						);
					}
				}
			}
			if ( ! empty( $block['innerBlocks'] ) ) {
				$walk( $block['innerBlocks'] );
			}
		}
	};
	$walk( parse_blocks( $post->post_content ) );
	return $pairs;
}

/**
 * FAQ schema mode from Site Settings; ACF defaults do not reach get_fields( 'option' ).
 *
 * @return string webpage-mainentity | faqpage | none.
 */
function ccn_faq_schema_mode() {
	$mode = (string) ccn_setting( 'faq_schema_mode', 'webpage-mainentity' );
	return in_array( $mode, array( 'webpage-mainentity', 'faqpage', 'none' ), true ) ? $mode : 'webpage-mainentity';
}

/**
 * Question nodes as on production: name and the answer as plain text.
 *
 * @param array[] $pairs Pairs from ccn_faq_items().
 * @return array[]
 */
function ccn_faq_question_nodes( $pairs ) {
	$nodes = array();
	foreach ( $pairs as $pair ) {
		$nodes[] = array(
			'@type'          => 'Question',
			'name'           => wp_strip_all_tags( $pair['question'] ),
			'acceptedAnswer' => array(
				'@type' => 'Answer',
				'text'  => trim( preg_replace( '/\s+/u', ' ', wp_strip_all_tags( $pair['answer'] ) ) ),
			),
		);
	}
	return $nodes;
}

// Default mode: the questions as mainEntity of Rank Math's WebPage node (or an own
// WebPage node when the graph has none), as production does. Inert until T-54.
add_filter( 'rank_math/json_ld', 'ccn_faq_rank_math_json_ld', 100, 2 );
function ccn_faq_rank_math_json_ld( $data, $jsonld ) {
	unset( $jsonld );
	if ( ! is_singular() || 'webpage-mainentity' !== ccn_faq_schema_mode() ) {
		return $data;
	}
	$pairs = ccn_faq_items( get_queried_object_id() );
	if ( ! $pairs ) {
		return $data;
	}
	foreach ( (array) $data as $key => $node ) {
		if ( is_array( $node ) && in_array( 'WebPage', (array) ( $node['@type'] ?? '' ), true ) ) {
			$data[ $key ]['mainEntity'] = ccn_faq_question_nodes( $pairs );
			return $data;
		}
	}
	$url                   = get_permalink( get_queried_object_id() );
	$data['ccnFaqWebpage'] = array(
		'@type'      => 'WebPage',
		'@id'        => $url . '#webpage',
		'url'        => $url,
		'mainEntity' => ccn_faq_question_nodes( $pairs ),
	);
	return $data;
}

// Mode "faqpage": an own FAQPage node (not the production setting).
add_action( 'wp_head', 'ccn_faq_page_schema', 21 );
function ccn_faq_page_schema() {
	if ( ! is_singular() || 'faqpage' !== ccn_faq_schema_mode() ) {
		return;
	}
	$pairs = ccn_faq_items( get_queried_object_id() );
	if ( ! $pairs ) {
		return;
	}
	$schema = array(
		'@context'   => 'https://schema.org',
		'@type'      => 'FAQPage',
		'mainEntity' => ccn_faq_question_nodes( $pairs ),
	);
	echo '<script type="application/ld+json">' . wp_json_encode( $schema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_HEX_TAG ) . "</script>\n";
}
