<?php
/**
 * Use the classic editor for pages built with ACF flexible content (the front
 * page and any page on the Sections template). The block editor pushes non-block
 * ACF field groups into a collapsed "Meta Boxes" drawer at the bottom, which is
 * easy to miss; the classic editor makes the flexible-content builder the main,
 * full-width editing surface.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_filter( 'use_block_editor_for_post', 'ccn_classic_editor_for_sections', 10, 2 );
function ccn_classic_editor_for_sections( $use_block_editor, $post ) {
	if ( ! $post instanceof WP_Post || 'page' !== $post->post_type ) {
		return $use_block_editor;
	}
	$is_front    = ( (int) get_option( 'page_on_front' ) === (int) $post->ID );
	$template    = get_page_template_slug( $post->ID );
	$is_sections = ( 'template-sections.php' === $template );

	if ( $is_front || $is_sections ) {
		return false;
	}
	return $use_block_editor;
}
