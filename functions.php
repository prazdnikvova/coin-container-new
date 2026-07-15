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
	add_theme_support( 'woocommerce' );
	// Hero background: full-screen photo, capped so originals never ship raw.
	add_image_size( 'ccn-hero', 1920, 1080, true );
	register_nav_menus(
		array(
			'primary' => esc_html__( 'Primary Menu', 'coin-container' ),
			'footer'  => esc_html__( 'Footer Menu', 'coin-container' ),
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
 * Preload the two fonts used above the fold (body regular + heading bold).
 * Keep this list at 1-2 files: preloading more delays the LCP instead of
 * helping it. The other weights load on demand via @font-face.
 */
add_action( 'wp_head', 'ccn_preload_fonts', 2 );
function ccn_preload_fonts() {
	$dir   = get_template_directory_uri();
	$fonts = array(
		'/assets/fonts/nunito-sans-v19-latin-regular.woff2',
		'/assets/fonts/dm-sans-v17-latin-700.woff2',
	);
	foreach ( $fonts as $font ) {
		printf(
			'<link rel="preload" href="%s" as="font" type="font/woff2" crossorigin>' . "\n",
			esc_url( $dir . $font )
		);
	}
}

/**
 * Preload the front-page hero image. The acf/home-hero block renders a
 * responsive <img>, so the preload uses imagesrcset/imagesizes — the browser
 * picks the same candidate as the <img> and the requests dedupe. The legacy
 * flexible-content hero is a CSS background (discovered late), preloaded by
 * plain URL.
 */
/**
 * Pages that open with a full-width hero get a translucent glass header at
 * the top of the page (solid white once scrolled); everywhere else the
 * header stays solid so content never sits under glass.
 */
add_filter( 'body_class', 'ccn_transparent_header_class' );
function ccn_transparent_header_class( $classes ) {
	if ( is_front_page() || is_page_template( array( 'template-landing.php', 'template-landing-full.php' ) ) ) {
		$classes[] = 'ccn-transparent-header';
	}
	return $classes;
}

add_action( 'wp_head', 'ccn_preload_hero', 3 );
function ccn_preload_hero() {
	// Landing templates: the hero band is the featured image (LCP element).
	// Same soft size as template-parts/page-hero.php so the preload dedupes.
	if ( is_page_template( array( 'template-landing.php', 'template-landing-full.php' ) ) && has_post_thumbnail() ) {
		$img    = get_post_thumbnail_id();
		$srcset = wp_get_attachment_image_srcset( $img, '1536x1536' );
		$src    = wp_get_attachment_image_url( $img, '1536x1536' );
		if ( $srcset && $src ) {
			printf(
				'<link rel="preload" as="image" href="%s" imagesrcset="%s" imagesizes="100vw" fetchpriority="high">' . "\n",
				esc_url( $src ),
				esc_attr( $srcset )
			);
		}
		return;
	}
	if ( ! is_front_page() || ! function_exists( 'have_rows' ) ) {
		return;
	}
	$post = get_post();
	if ( $post && has_block( 'acf/home-hero', $post ) ) {
		foreach ( parse_blocks( $post->post_content ) as $parsed ) {
			if ( 'acf/home-hero' === $parsed['blockName'] ) {
				$data = $parsed['attrs']['data'] ?? array();
				$img  = (int) ( $data['image'] ?? $data['field_ccn_hh_image'] ?? 0 );
				if ( $img ) {
					$srcset = wp_get_attachment_image_srcset( $img, 'ccn-hero' );
					$src    = wp_get_attachment_image_url( $img, 'ccn-hero' );
					if ( $srcset && $src ) {
						printf(
							'<link rel="preload" as="image" href="%s" imagesrcset="%s" imagesizes="100vw" fetchpriority="high">' . "\n",
							esc_url( $src ),
							esc_attr( $srcset )
						);
					}
				}
				break;
			}
		}
		return;
	}
	if ( have_rows( 'page_sections' ) ) {
		while ( have_rows( 'page_sections' ) ) {
			the_row();
			if ( 'hero' === get_row_layout() ) {
				$img = get_sub_field( 'image' );
				$url = $img ? wp_get_attachment_image_url( $img, 'large' ) : '';
				if ( $url ) {
					printf(
						'<link rel="preload" href="%s" as="image" fetchpriority="high">' . "\n",
						esc_url( $url )
					);
				}
				break;
			}
		}
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

require_once get_template_directory() . '/blocks/acf-blocks.php';
require_once get_template_directory() . '/inc/security.php';
require_once get_template_directory() . '/inc/assets-cleanup.php';
require_once get_template_directory() . '/inc/site-settings.php';
require_once get_template_directory() . '/inc/schema.php';
require_once get_template_directory() . '/inc/editor.php';
if ( class_exists( 'WooCommerce' ) ) {
	require_once get_template_directory() . '/inc/woocommerce.php';
}
