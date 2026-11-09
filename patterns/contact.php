<?php
/**
 * Title: Coin: Contact page
 * Slug: coin-container/contact
 * Description: The request form first, with e-mail, phone and address from Site Settings beside it, then a text section. For the template Landing (full width): a page that opens with the form shows no button in the hero band.
 * Categories: coin-container
 * Block Types: core/post-content
 * Post Types: page
 * Viewport Width: 1200
 *
 * Block data: ccn_block_data() in inc/editor.php, field keys from acf-json/.
 * The form stays empty: it is picked in the block sidebar.
 */

$ccn_blocks = ccn_pattern_block(
	'acf/form-card',
	array(
		'form'          => array( 'field_ccn_fc_form', '' ),
		'heading'       => array( 'field_ccn_fc_heading', ccn_placeholder( 'heading' ) ),
		'intro'         => array( 'field_ccn_fc_intro', ccn_placeholder( 'intro' ) ),
		'show_contacts' => array( 'field_ccn_fc_show_contacts', 1 ),
	)
);

$ccn_blocks .= ccn_pattern_block(
	'acf/text-section',
	array(
		'image'   => array( 'field_ccn_ts_image', 0 ),
		'heading' => array( 'field_ccn_ts_heading', ccn_placeholder( 'heading' ) ),
		'text'    => array( 'field_ccn_ts_text', ccn_placeholder_html( 'text' ) ),
	)
);

echo $ccn_blocks; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- block markup from serialize_block(), the editor parses it.
