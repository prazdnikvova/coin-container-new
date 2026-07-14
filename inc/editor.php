<?php
/**
 * Use the classic editor for pages still built with ACF flexible content
 * (the Sections template landings). The block editor pushes non-block ACF
 * field groups into a collapsed "Meta Boxes" drawer at the bottom, which is
 * easy to miss; the classic editor makes the flexible-content builder the
 * main, full-width editing surface. The front page uses the block editor:
 * it is being migrated to ACF blocks (decision 2026-07-14).
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_filter( 'use_block_editor_for_post', 'ccn_classic_editor_for_sections', 10, 2 );
function ccn_classic_editor_for_sections( $use_block_editor, $post ) {
	if ( ! $post instanceof WP_Post || 'page' !== $post->post_type ) {
		return $use_block_editor;
	}
	if ( 'template-sections.php' === get_page_template_slug( $post->ID ) ) {
		return false;
	}
	return $use_block_editor;
}
