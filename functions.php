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
	// 'style' left out: deprecated and read by nothing since WP 7.0. 'script' is
	// ignored by core since 7.0 too, but WooCommerce's wc_no_js() still reads it
	// (without it the inline no-js script gets type='text/javascript').
	add_theme_support( 'html5', array( 'search-form', 'comment-list', 'comment-form', 'gallery', 'caption', 'script', 'navigation-widgets' ) );
	add_theme_support( 'responsive-embeds' );
	add_theme_support( 'align-wide' );
	add_theme_support( 'woocommerce' );
	// Block editor (always an iframe on WP 7.1): theme.css styles the canvas, so
	// ACF block previews use the same tokens and rules as the front end. In the
	// iframe the editor style is not prefixed, only its url()s are rebased, so
	// the element-level reset stays below the editor's own class rules.
	// editor.css holds the few editor-only rules (canvas width for ACF blocks).
	add_theme_support( 'editor-styles' );
	add_editor_style( array( 'assets/css/theme.css', 'assets/css/editor.css' ) );
	// No custom hero size on purpose. A hard crop (1920x1080, true) empties
	// srcset: wp_calculate_image_srcset() only keeps sizes with a matching
	// aspect ratio, and every stock WP size is a square box. Heroes use the
	// soft '1536x1536' instead and are cropped by object-fit: cover in CSS.
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

/**
 * Bottom action bar below 48rem (DESIGN.md "Action bar"): "Anrufen" (tel:)
 * and "Anfrage" (Site Settings anfrage_url). Off on cart, checkout and
 * account pages and on the request page itself. The body class reserves its
 * height, so the footer never ends under the bar.
 *
 * @return array Links ('tel', 'url'); empty when the bar is off.
 */
function ccn_action_bar() {
	static $bar = null;
	if ( null !== $bar ) {
		return $bar;
	}
	$bar = array();
	if ( function_exists( 'is_cart' ) && ( is_cart() || is_checkout() || is_account_page() ) ) {
		return $bar;
	}
	$tel  = ccn_phone_href();
	$url  = (string) ccn_setting( 'anfrage_url' );
	$here = is_singular() ? (string) wp_parse_url( (string) get_permalink( get_queried_object_id() ), PHP_URL_PATH ) : '';
	if ( $url && $here && untrailingslashit( (string) wp_parse_url( $url, PHP_URL_PATH ) ) === untrailingslashit( $here ) ) {
		return $bar;
	}
	if ( $tel || $url ) {
		$bar = array(
			'tel' => $tel,
			'url' => $url,
		);
	}
	return $bar;
}

/**
 * True when the current page opens with the request form (its first block is
 * acf/form-card): the form is the call to action, so the hero band leaves its
 * CTA button out (template-parts/page-hero.php). Decided by the content, not
 * by a slug: a landing with the form further down keeps its CTA.
 *
 * @return bool
 */
function ccn_page_leads_with_form() {
	$post = get_post();
	if ( ! $post || ! has_block( 'acf/form-card', $post ) ) {
		return false;
	}
	foreach ( parse_blocks( $post->post_content ) as $ccn_block ) {
		if ( ! empty( $ccn_block['blockName'] ) ) {
			return 'acf/form-card' === $ccn_block['blockName'];
		}
	}
	return false;
}

add_filter( 'body_class', 'ccn_action_bar_body_class' );
function ccn_action_bar_body_class( $classes ) {
	if ( ccn_action_bar() ) {
		$classes[] = 'ccn-has-action-bar';
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
	if ( ! is_front_page() ) {
		return;
	}
	$post = get_post();
	if ( $post && has_block( 'acf/home-hero', $post ) ) {
		foreach ( parse_blocks( $post->post_content ) as $parsed ) {
			if ( 'acf/home-hero' === $parsed['blockName'] ) {
				$data = $parsed['attrs']['data'] ?? array();
				$img  = (int) ( $data['image'] ?? $data['field_ccn_hh_image'] ?? 0 );
				if ( $img ) {
					$srcset = wp_get_attachment_image_srcset( $img, '1536x1536' );
					$src    = wp_get_attachment_image_url( $img, '1536x1536' );
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
	}
}

/**
 * Phone icon of the header icon set (stroke, currentColor), decorative.
 *
 * @param int $size Width and height in px.
 * @return string Static SVG markup.
 */
function ccn_phone_icon( $size ) {
	return sprintf(
		'<svg class="ccn-icon" width="%1$d" height="%1$d" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 16.5v2.6a1.9 1.9 0 0 1-2.1 1.9 19 19 0 0 1-8.3-3 18.7 18.7 0 0 1-5.7-5.7 19 19 0 0 1-3-8.3A1.9 1.9 0 0 1 3.8 2h2.6a1.9 1.9 0 0 1 1.9 1.6c.12.92.34 1.83.65 2.7a1.9 1.9 0 0 1-.43 2L7.4 9.4a15.2 15.2 0 0 0 5.7 5.7l1.1-1.12a1.9 1.9 0 0 1 2-.43c.87.31 1.78.53 2.7.65a1.9 1.9 0 0 1 1.6 1.9Z"/></svg>',
		(int) $size
	);
}

/**
 * Outline icon set of the theme (24px grid, stroke 1.8, round caps and joins,
 * currentColor, like the header icons): services and footer social links.
 * Decorative: the text or screen-reader text next to it names the link.
 * Paths adapted from Tabler Icons (MIT, https://tabler.io/icons); the eBay
 * and Kleinanzeigen monograms are drawn for this theme.
 *
 * @param string $name Icon key.
 * @param int    $size Width and height in px.
 * @return string Static SVG markup; empty for an unknown key.
 */
function ccn_icon( $name, $size = 24 ) {
	$paths = array(
		'container'     => 'M12 3l8 4.5v9L12 21l-8-4.5v-9zM12 12l8-4.5M12 12v9M12 12L4 7.5',
		'buy'           => 'M4 19a2 2 0 1 0 4 0a2 2 0 1 0-4 0M15 19a2 2 0 1 0 4 0a2 2 0 1 0-4 0M17 17H6V3H4M6 5l14 1-1 7H6',
		'rent'          => 'M16.555 3.843l3.602 3.602a2.877 2.877 0 0 1 0 4.069l-2.643 2.643a2.877 2.877 0 0 1-4.069 0l-.301-.301-6.558 6.558a2 2 0 0 1-1.239.578l-.175.008h-1.172a1 1 0 0 1-.993-.883l-.007-.117v-1.172a2 2 0 0 1 .467-1.284l.119-.13.414-.414h2v-2h2v-2l2.144-2.144-.301-.301a2.877 2.877 0 0 1 0-4.069l2.643-2.643a2.877 2.877 0 0 1 4.069 0zM15 9h.01',
		'transport'     => 'M5 17a2 2 0 1 0 4 0a2 2 0 1 0-4 0M15 17a2 2 0 1 0 4 0a2 2 0 1 0-4 0M5 17H3V6a1 1 0 0 1 1-1h9v12m-4 0h6m4 0h2v-6h-8m0-5h5l3 5',
		'modify'        => 'M7 10h3V7L6.5 3.5a6 6 0 0 1 8 8l6 6a2 2 0 0 1-3 3l-6-6a6 6 0 0 1-8-8L7 10',
		'facebook'      => 'M7 10v4h3v7h4v-7h3l1-4h-4V8a1 1 0 0 1 1-1h3V3h-3a5 5 0 0 0-5 5v2H7',
		'instagram'     => 'M4 8a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4zM9 12a3 3 0 1 0 6 0a3 3 0 1 0-6 0M16.5 7.5v.01',
		'linkedin'      => 'M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM8 11v5M8 8v.01M12 16v-5M16 16v-3a2 2 0 0 0-4 0',
		'pinterest'     => 'M8 20l4-9M10.7 14c.437 1.263 1.43 2 2.55 2 2.071 0 3.75-1.554 3.75-4a5 5 0 1 0-9.7 1.7M3 12a9 9 0 1 0 18 0a9 9 0 1 0-18 0',
		'xing'          => 'M16 21l-4-7 6.5-11M7 7l2 3.5L6 15',
		'ebay'          => 'M7.5 12h9a4.5 4.5 0 1 0-1.32 3.18',
		'kleinanzeigen' => 'M8.5 6v12M16 6l-7.5 6.5M11 10.5l5 7.5',
	);
	if ( ! isset( $paths[ $name ] ) ) {
		return '';
	}
	return sprintf(
		'<svg class="ccn-icon" width="%1$d" height="%1$d" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="%2$s"/></svg>',
		(int) $size,
		esc_attr( $paths[ $name ] )
	);
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
require_once get_template_directory() . '/inc/disable-comments.php';
require_once get_template_directory() . '/inc/assets-cleanup.php';
require_once get_template_directory() . '/inc/site-settings.php';
require_once get_template_directory() . '/inc/schema.php';
require_once get_template_directory() . '/inc/seo.php';
require_once get_template_directory() . '/inc/trust.php';
require_once get_template_directory() . '/inc/llms-txt.php';
require_once get_template_directory() . '/inc/freshness.php';
require_once get_template_directory() . '/inc/shortcodes.php';
require_once get_template_directory() . '/inc/price-table.php';
require_once get_template_directory() . '/inc/related.php';
if ( class_exists( 'WooCommerce' ) ) {
	require_once get_template_directory() . '/inc/woocommerce.php';
	require_once get_template_directory() . '/inc/internal-links.php';
}
