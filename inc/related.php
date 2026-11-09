<?php
/**
 * Link cards: the excerpt helper of the related-links block and the
 * «Ähnliche Beiträge» under single posts (T-56).
 *
 * Production lessons (transmax-child/inc/blog-related-fix.php, card K69): the
 * post itself never shows up in its own block (post__not_in), and a card never
 * renders the content of the post it points to (Elementor printed its CSS into
 * the card text there): the excerpt comes from the stored text, without
 * running the_content.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Plain-text excerpt of a page, post or product for a card: the manual
 * excerpt, else the text of the content (blocks of the theme and shortcodes
 * removed, nothing rendered), cut at a word boundary.
 *
 * @param int|WP_Post $post   Post.
 * @param int         $length Maximum length in characters.
 * @return string Plain text, '' when there is none.
 */
function ccn_card_excerpt( $post, $length = 120 ) {
	$post = get_post( $post );
	if ( ! $post ) {
		return '';
	}
	$text = has_excerpt( $post ) ? $post->post_excerpt : excerpt_remove_blocks( $post->post_content );
	$text = strip_shortcodes( $text );
	// Production shortcodes without a handler here ([coin_*], replaced by the content migration T-53b).
	$text = (string) preg_replace( '/\[\/?coin_[a-z_]+[^\]]*\]/', '', $text );
	$text = html_entity_decode( wp_strip_all_tags( $text, true ), ENT_QUOTES | ENT_HTML5, 'UTF-8' );
	$text = trim( (string) preg_replace( '/\s+/u', ' ', $text ) );
	if ( mb_strlen( $text ) <= $length ) {
		return $text;
	}
	$cut   = mb_substr( $text, 0, $length );
	$space = mb_strrpos( $cut, ' ' );
	if ( false !== $space && $space > $length / 2 ) {
		$cut = mb_substr( $cut, 0, $space );
	}
	return rtrim( $cut, " \t,.;:–-" ) . '…';
}
