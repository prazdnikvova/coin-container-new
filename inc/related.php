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

/**
 * IDs of up to three published posts that share a category with the post,
 * newest first, the post itself left out (production's K69 lesson). Cached
 * per post for 12 hours; saving, trashing, restoring or deleting a post
 * starts a new cache generation, so a changed post shows at once.
 *
 * @param int $post_id Post ID.
 * @return int[]
 */
function ccn_related_post_ids( $post_id ) {
	$post_id = (int) $post_id;
	if ( $post_id <= 0 || 'post' !== get_post_type( $post_id ) ) {
		return array();
	}
	$key = 'ccn_related_posts_' . $post_id . '_' . (int) get_option( 'ccn_related_posts_gen', 0 );
	$ids = get_transient( $key );
	if ( is_array( $ids ) ) {
		return array_map( 'intval', $ids );
	}
	$cats = array_map( 'intval', (array) wp_get_post_categories( $post_id ) );
	$ids  = array();
	if ( $cats ) {
		$ids = get_posts(
			array(
				'post_type'           => 'post',
				'post_status'         => 'publish',
				'category__in'        => $cats,
				'post__not_in'        => array( $post_id ),
				'posts_per_page'      => 3,
				'orderby'             => 'date',
				'order'               => 'DESC',
				'ignore_sticky_posts' => true,
				'no_found_rows'       => true,
				'fields'              => 'ids',
			)
		);
	}
	$ids = array_map( 'intval', (array) $ids );
	set_transient( $key, $ids, 12 * HOUR_IN_SECONDS );
	return $ids;
}

add_action( 'save_post_post', 'ccn_related_posts_flush' );
add_action( 'trashed_post', 'ccn_related_posts_flush' );
add_action( 'untrashed_post', 'ccn_related_posts_flush' );
add_action( 'before_delete_post', 'ccn_related_posts_flush' );
/**
 * New cache generation of «Ähnliche Beiträge» when a post changes.
 *
 * @param int $post_id Post ID.
 */
function ccn_related_posts_flush( $post_id ) {
	if ( 'post' !== get_post_type( $post_id ) || wp_is_post_revision( $post_id ) ) {
		return;
	}
	update_option( 'ccn_related_posts_gen', (int) get_option( 'ccn_related_posts_gen', 0 ) + 1, true );
}
