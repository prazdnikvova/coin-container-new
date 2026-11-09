<?php
/**
 * Title: Coin: Product landing page
 * Slug: coin-container/landing-product
 * Description: Intro, featured products, text with two photos, the price table of Site Settings → Preise, the trust chips and the CTA band. For a Landing template (the featured image is the hero band).
 * Categories: coin-container
 * Block Types: core/post-content
 * Post Types: page
 * Viewport Width: 1200
 *
 * Block data: ccn_block_data() in inc/editor.php, field keys from acf-json/.
 * Products: the featured ones until a category or product slugs are set.
 * Prices and trust chips come from Site Settings, the pattern holds none.
 */

$ccn_blocks = ccn_pattern_block(
	'acf/intro',
	array(
		'heading' => array( 'field_ccn_in_heading', ccn_placeholder( 'heading' ) ),
		'text'    => array( 'field_ccn_in_text', ccn_placeholder_html( 'intro' ) ),
	)
);

$ccn_blocks .= ccn_pattern_block(
	'acf/featured-products',
	array(
		'heading'    => array( 'field_ccn_fp_heading', ccn_placeholder( 'heading' ) ),
		'count'      => array( 'field_ccn_fp_count', 4 ),
		'category'   => array( 'field_ccn_fp_category', '' ),
		'include'    => array( 'field_ccn_fp_include', '' ),
		'background' => array( 'field_ccn_fp_background', 'light' ),
	)
);

$ccn_blocks .= ccn_pattern_block(
	'acf/text-image',
	array(
		'heading'   => array( 'field_ccn_ti_heading', ccn_placeholder( 'heading' ) ),
		'text'      => array( 'field_ccn_ti_text', ccn_placeholder_html( 'text' ) ),
		'highlight' => array( 'field_ccn_ti_highlight', ccn_placeholder( 'highlight' ) ),
		'image_1'   => array( 'field_ccn_ti_image_1', 0 ),
		'image_2'   => array( 'field_ccn_ti_image_2', 0 ),
	)
);

$ccn_blocks .= ccn_pattern_block(
	'acf/price-table',
	array(
		'heading'       => array( 'field_ccn_pt_heading', ccn_placeholder( 'heading' ) ),
		'sizes'         => array( 'field_ccn_pt_sizes', array() ),
		'show_footnote' => array( 'field_ccn_pt_show_footnote', 1 ),
	)
);

$ccn_blocks .= ccn_pattern_block( 'acf/trust-bar' );

// Button text and URL empty: the band then takes Site Settings → Calls to action.
$ccn_blocks .= ccn_pattern_block(
	'acf/cta-banner',
	array(
		'heading' => array( 'field_ccn_cb_heading', ccn_placeholder( 'heading' ) ),
		'text'    => array( 'field_ccn_cb_text', ccn_placeholder( 'teaser' ) ),
		'image'   => array( 'field_ccn_cb_image', 0 ),
	)
);

echo $ccn_blocks; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- block markup from serialize_block(), the editor parses it.
