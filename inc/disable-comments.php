<?php
/**
 * Comments are switched off on the whole site — parity with production
 * (owner's decision 19.10.2026, card K40).
 *
 * Code only, no DB writes. Reversible: remove the require in functions.php,
 * and bring back a comments template and its comments_template() calls in
 * single.php and page.php, which the theme no longer has (T-60). The DB side
 * (comment_status/ping_status = 'closed', default_comment_status) is a
 * separate, optional step; this file works without it.
 *
 * Existing comments (incl. WooCommerce order notes) are not deleted or
 * modified.
 */

defined( 'ABSPATH' ) || exit;

/*
 * Self-guard: this file doubles as the "empty comments template" (see the
 * comments_template filter below). When WP requires it a second time from
 * comments_template(), stop here and print nothing.
 */
if ( defined( 'CCN_DISABLE_COMMENTS_LOADED' ) ) {
	return;
}
define( 'CCN_DISABLE_COMMENTS_LOADED', true );

/*
 * 1. Comments and pings closed for every post type, regardless of the
 * per-post DB flag.
 */
add_filter( 'comments_open', '__return_false', 20 );
add_filter( 'pings_open', '__return_false', 20 );

/*
 * 2. No comment list / form anywhere on the front end. The theme's
 * templates never call comments_template() and the theme ships no comments
 * template (T-60). For anything else that calls it (a plugin), the template
 * path points back to this file, which prints nothing (self-guard above),
 * and comment lists and counts stay empty. WooCommerce drops the reviews
 * tab by itself once comments_open() is false.
 */
add_filter( 'comments_template', 'ccn_disable_comments_template', 20 );
function ccn_disable_comments_template() {
	return __FILE__;
}

add_filter( 'comments_array', 'ccn_disable_comments_array', 20 );
function ccn_disable_comments_array( $comments ) {
	return is_admin() ? $comments : array();
}

add_filter( 'get_comments_number', 'ccn_disable_comments_number', 20 );
function ccn_disable_comments_number( $count ) {
	return is_admin() ? $count : 0;
}

/*
 * 3. Comment feeds. Remove the global "Kommentar-Feed" <link> and the
 * per-post one, then redirect any request to a comment feed (301):
 * per-post feed -> the post itself, global /comments/feed/ -> the main posts
 * feed. Redirect instead of 404 because search engines already know these
 * URLs from the <link rel="alternate"> tags. The main feed (/feed/) stays.
 */
add_filter( 'feed_links_show_comments_feed', '__return_false' );
add_filter( 'feed_links_extra_show_post_comments_feed', '__return_false' );

add_action( 'template_redirect', 'ccn_disable_comments_feed_redirect', 1 );
function ccn_disable_comments_feed_redirect() {
	if ( ! is_comment_feed() ) {
		return;
	}
	$target = is_singular() ? get_permalink( get_queried_object_id() ) : get_feed_link();
	wp_safe_redirect( $target ? $target : home_url( '/' ), 301, 'ccn comments off' );
	exit;
}

/*
 * 4. REST /wp/v2/comments: hidden for everyone who cannot moderate comments
 * (same pattern as the users route in inc/security.php). Anonymous requests
 * get a 404 (rest_no_route); admins keep it for the block editor.
 */
add_filter( 'rest_endpoints', 'ccn_disable_comments_rest' );
function ccn_disable_comments_rest( $endpoints ) {
	if ( current_user_can( 'moderate_comments' ) ) {
		return $endpoints;
	}
	foreach ( array_keys( $endpoints ) as $route ) {
		if ( 0 === strpos( $route, '/wp/v2/comments' ) ) {
			unset( $endpoints[ $route ] );
		}
	}
	return $endpoints;
}

/*
 * 5. wp-admin: hide "Kommentare" from the menu and the admin bar. Hiding
 * only; comments remain reachable by URL for admins.
 */
add_action( 'admin_menu', 'ccn_disable_comments_admin_menu', 99 );
function ccn_disable_comments_admin_menu() {
	remove_menu_page( 'edit-comments.php' );
}

add_action( 'admin_bar_menu', 'ccn_disable_comments_admin_bar', 99 );
function ccn_disable_comments_admin_bar( $bar ) {
	$bar->remove_node( 'comments' );
}
