<?php
/**
 * Title: Coin: Service landing page
 * Slug: coin-container/landing-service
 * Description: Intro, text section on light grey, three info cards, FAQ, request form and the CTA band. For a Landing template (the featured image is the hero band).
 * Categories: coin-container
 * Block Types: core/post-content
 * Post Types: page
 * Viewport Width: 1200
 *
 * Block data: ccn_block_data() in inc/editor.php, field keys from acf-json/.
 * Images and the form stay empty: they are picked in the block sidebar.
 */

$ccn_blocks = ccn_pattern_block(
	'acf/intro',
	array(
		'heading' => array( 'field_ccn_in_heading', ccn_placeholder( 'heading' ) ),
		'text'    => array( 'field_ccn_in_text', ccn_placeholder_html( 'intro' ) ),
	)
);

$ccn_blocks .= ccn_pattern_block(
	'acf/text-section',
	array(
		'image'      => array( 'field_ccn_ts_image', 0 ),
		'heading'    => array( 'field_ccn_ts_heading', ccn_placeholder( 'heading' ) ),
		'text'       => array( 'field_ccn_ts_text', ccn_placeholder_html( 'text' ) ),
		'background' => array( 'field_ccn_ts_background', 'light' ),
	)
);

$ccn_blocks .= ccn_pattern_block(
	'acf/info-cards',
	array( 'heading' => array( 'field_ccn_ic_heading', ccn_placeholder( 'heading' ) ) ) + ccn_block_rows(
		'cards',
		'field_ccn_ic_cards',
		array_fill(
			0,
			3,
			array(
				'image' => array( 'field_ccn_ic_image', 0 ),
				'title' => array( 'field_ccn_ic_title', ccn_placeholder( 'title' ) ),
				'text'  => array( 'field_ccn_ic_text', ccn_placeholder_html( 'teaser' ) ),
			)
		)
	)
);

$ccn_blocks .= ccn_pattern_block(
	'acf/faq',
	array( 'heading' => array( 'field_ccn_fq_heading', ccn_placeholder( 'heading' ) ) ) + ccn_block_rows(
		'items',
		'field_ccn_fq_items',
		array_fill(
			0,
			3,
			array(
				'question' => array( 'field_ccn_fq_question', ccn_placeholder( 'question' ) ),
				'answer'   => array( 'field_ccn_fq_answer', ccn_placeholder_html( 'answer' ) ),
			)
		)
	)
);

$ccn_blocks .= ccn_pattern_block(
	'acf/form-card',
	array(
		'form'          => array( 'field_ccn_fc_form', '' ),
		'heading'       => array( 'field_ccn_fc_heading', ccn_placeholder( 'heading' ) ),
		'intro'         => array( 'field_ccn_fc_intro', ccn_placeholder( 'intro' ) ),
		'show_contacts' => array( 'field_ccn_fc_show_contacts', 0 ),
	)
);

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
