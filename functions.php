<?php
/**
 * Coin Container — setup, asset loading, includes.
 */

add_action( 'after_setup_theme', 'ccn_setup' );
function ccn_setup() {
	load_theme_textdomain( 'coin-container', get_template_directory() . '/languages' );
	add_theme_support( 'title-tag' );
	add_theme_support( 'automatic-feed-links' );
	add_theme_support( 'post-thumbnails' );
	add_theme_support( 'custom-logo' );
	add_theme_support( 'html5', array( 'search-form', 'comment-list', 'comment-form', 'gallery', 'caption', 'style', 'script', 'navigation-widgets' ) );
	add_theme_support( 'responsive-embeds' );
	add_theme_support( 'align-wide' );
	register_nav_menus(
		array(
			'primary' => esc_html__( 'Primary Menu', 'coin-container' ),
		)
	);
}

/**
 * Asset version from the file's mtime — editing a file busts the browser
 * cache automatically, nothing is ever bumped by hand.
 */
function ccn_asset_version( $relative_path ) {
	$file = get_template_directory() . $relative_path;
	return file_exists( $file ) ? (string) filemtime( $file ) : null;
}

/**
 * Global assets. style.css holds only the theme header; real styles live in
 * assets/css/theme.css. JS loads from the footer with defer — never
 * render-blocking. Register per-feature scripts/styles here and enqueue them
 * only where used (see README: scoped assets pattern).
 */
add_action( 'wp_enqueue_scripts', 'ccn_enqueue_assets' );
function ccn_enqueue_assets() {
	$dir = get_template_directory_uri();

	wp_enqueue_style( 'coin-container', $dir . '/assets/css/theme.css', array(), ccn_asset_version( '/assets/css/theme.css' ) );

	wp_enqueue_script(
		'ccn-main',
		$dir . '/assets/js/main.js',
		array(),
		ccn_asset_version( '/assets/js/main.js' ),
		array(
			'in_footer' => true,
			'strategy'  => 'defer',
		)
	);

	if ( is_singular() && comments_open() && get_option( 'thread_comments' ) ) {
		wp_enqueue_script( 'comment-reply' );
	}
}

/**
 * Accessibility: skip link straight after <body>.
 */
add_action( 'wp_body_open', 'ccn_skip_link', 5 );
function ccn_skip_link() {
	echo '<a href="#content" class="skip-link screen-reader-text">' . esc_html__( 'Skip to the content', 'coin-container' ) . '</a>';
}

/**
 * Keep "read more" links meaningful for screen readers.
 */
add_filter( 'the_content_more_link', 'ccn_read_more_link' );
function ccn_read_more_link() {
	if ( is_admin() ) {
		return '';
	}
	/* translators: %s: post title, visually hidden */
	return ' <a href="' . esc_url( get_permalink() ) . '" class="more-link">' . sprintf( __( '&hellip;%s', 'coin-container' ), '<span class="screen-reader-text"> ' . esc_html( get_the_title() ) . '</span>' ) . '</a>';
}

add_filter( 'excerpt_more', 'ccn_excerpt_read_more_link' );
function ccn_excerpt_read_more_link( $more ) {
	if ( is_admin() ) {
		return $more;
	}
	/* translators: %s: post title, visually hidden */
	return ' <a href="' . esc_url( get_permalink() ) . '" class="more-link">' . sprintf( __( '&hellip;%s', 'coin-container' ), '<span class="screen-reader-text"> ' . esc_html( get_the_title() ) . '</span>' ) . '</a>';
}

require_once get_template_directory() . '/inc/security.php';
