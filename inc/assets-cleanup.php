<?php
/**
 * Front-end asset cleanup — the theme's own code is vanilla JS.
 *
 * Policy: jQuery stays on the WooCommerce pages only — shop, product
 * categories, products, cart, checkout and account — for WooCommerce's own
 * scripts (stock product gallery, sort order, checkout; decision of
 * 08.11.2026, as on clinexTheme). Every other page ships no jQuery (decision
 * 2026-07-06). Theme code never depends on jQuery.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * True on the WooCommerce pages that keep jQuery and WooCommerce's scripts.
 */
function ccn_keeps_jquery() {
	if ( ! class_exists( 'WooCommerce' ) ) {
		return false;
	}
	return is_woocommerce() || is_cart() || is_checkout() || is_account_page();
}

/**
 * Strip the emoji detector (inline script + styles) — dead weight on every page.
 */
remove_action( 'wp_head', 'print_emoji_detection_script', 7 );
remove_action( 'wp_print_styles', 'print_emoji_styles' );
add_filter( 'emoji_svg_url', '__return_false' );

/**
 * theme.json feeds the block editor only. On the front end theme.css is the
 * single source of truth (tokens plus the preset classes the editor can add),
 * so the global-styles inline CSS is not printed: with theme.json it grows to
 * ~14 KB per page because core keeps its default presets for old content.
 * The editor reads global styles from its own settings, not from these hooks.
 */
remove_action( 'wp_enqueue_scripts', 'wp_enqueue_global_styles' );
remove_action( 'wp_footer', 'wp_enqueue_global_styles', 1 );

/**
 * Drop jquery-migrate from the jQuery bundle (nothing on the front end uses
 * the deprecated APIs it shims).
 */
add_action( 'wp_default_scripts', 'ccn_drop_jquery_migrate' );
function ccn_drop_jquery_migrate( $scripts ) {
	if ( is_admin() || empty( $scripts->registered['jquery'] ) ) {
		return;
	}
	$jquery = $scripts->registered['jquery'];
	$jquery->deps = array_diff( $jquery->deps, array( 'jquery-migrate' ) );
}

/**
 * Contact Form 7 assets load only on pages that actually contain a form, so the
 * ~40KB of CF7 CSS/JS never touches the other 30+ pages. A form lives in the
 * form card block (acf/form-card, the form is a block field, no shortcode in the
 * content) or, in older content, in a [contact-form-7] shortcode.
 */
function ccn_page_has_form() {
	if ( ! is_singular() ) {
		return false;
	}
	$post = get_post();
	return $post && ( has_block( 'acf/form-card', $post ) || has_shortcode( $post->post_content, 'contact-form-7' ) );
}
add_filter( 'wpcf7_load_js', 'ccn_maybe_load_cf7' );
add_filter( 'wpcf7_load_css', 'ccn_maybe_load_cf7' );
function ccn_maybe_load_cf7( $load ) {
	return ccn_page_has_form();
}

/**
 * Focus after a submission (assets/js/forms.js, DESIGN.md "Forms"): a separate
 * deferred file next to CF7's own assets, on the same pages only — main.js stays
 * as it is on every page.
 */
add_action( 'wp_enqueue_scripts', 'ccn_enqueue_form_script' );
function ccn_enqueue_form_script() {
	if ( ! ccn_page_has_form() ) {
		return;
	}
	wp_enqueue_script(
		'ccn-forms',
		get_template_directory_uri() . '/assets/js/forms.js',
		array(),
		ccn_asset_version( '/assets/js/forms.js' ),
		array(
			'in_footer' => true,
			'strategy'  => 'defer',
		)
	);
}

/**
 * Price table and link cards (assets/css/content-cards.css, T-56 review): their
 * rules live in a file of their own, so theme.css, which blocks the first paint
 * of every page, stays inside the first TCP window (sent gzip at most 14 600
 * bytes; DESIGN.md "Do / don't"). The file loads after theme.css, in <head>,
 * only on pages whose content holds the price-table or related-links block and
 * on posts that show «Ähnliche Beiträge». Both blocks also list the handle
 * under 'assets' (blocks/acf-blocks.php) for anywhere else they render; the
 * block editor gets the file as an editor style (functions.php).
 */
add_action( 'init', 'ccn_register_content_cards_style' );
function ccn_register_content_cards_style() {
	wp_register_style(
		'ccn-content-cards',
		get_template_directory_uri() . '/assets/css/content-cards.css',
		array( 'coin-container' ),
		ccn_asset_version( '/assets/css/content-cards.css' )
	);
}

add_action( 'wp_enqueue_scripts', 'ccn_enqueue_content_cards' );
function ccn_enqueue_content_cards() {
	if ( ! is_singular() ) {
		return;
	}
	$post = get_post();
	if ( ! $post ) {
		return;
	}
	if ( has_block( 'acf/price-table', $post ) || has_block( 'acf/related-links', $post )
		|| ( 'post' === $post->post_type && ccn_related_post_ids( $post->ID ) ) ) {
		wp_enqueue_style( 'ccn-content-cards' );
	}
}

/**
 * Late dequeues. Cart fragments are disabled everywhere (the header cart count
 * renders server-side); outside the WooCommerce pages the whole jQuery/Woo
 * stack goes away.
 */
add_action( 'wp_enqueue_scripts', 'ccn_cleanup_assets', 99 );
function ccn_cleanup_assets() {
	// No jQuery-powered AJAX cart on any page.
	wp_dequeue_script( 'wc-cart-fragments' );

	if ( ccn_keeps_jquery() ) {
		if ( is_woocommerce() ) {
			// Add to cart stays a plain request (the product form posts, loop buttons are
			// ?add-to-cart= links): without cart fragments an AJAX add would leave the
			// server-rendered cart count in the header stale.
			wp_dequeue_script( 'wc-add-to-cart' );
			// WooCommerce prints its scripts in <head> with defer; jQuery defers with them
			// (WordPress keeps it blocking if any dependent is not deferred), so it never
			// blocks the first paint.
			wp_script_add_data( 'jquery-core', 'strategy', 'defer' );
			wp_script_add_data( 'jquery', 'strategy', 'defer' );
		}
		if ( is_product() ) {
			// The product page needs jQuery for the gallery (FlexSlider, PhotoSwipe, the
			// single-product script) only; woocommerce.js (sort order, store notice,
			// password toggles) has nothing to do there.
			wp_dequeue_script( 'woocommerce' );
		}
		return;
	}

	// WooCommerce front-end stack is only needed where the store UI lives.
	$scripts = array(
		'woocommerce',
		'wc-add-to-cart',
		'wc-single-product',
		'wc-order-attribution',
		'sourcebuster-js',
	);
	foreach ( $scripts as $handle ) {
		wp_dequeue_script( $handle );
	}

	// With the Woo scripts gone nothing on the page needs jQuery.
	wp_dequeue_script( 'jquery' );
	wp_deregister_script( 'jquery' );
}

/**
 * The theme uses ACF blocks styled by theme.css only. WooCommerce enqueues
 * its blocks stylesheet (wc-blocks.css) as soon as post content contains any
 * block — the theme ships no WC blocks, so it is dead weight. Late hook:
 * Woo enqueues it after the wp_enqueue_scripts cleanup pass.
 */
add_action( 'wp_enqueue_scripts', 'ccn_drop_wc_blocks_style', 9999 );
add_action( 'wp_print_styles', 'ccn_drop_wc_blocks_style', 99 );
function ccn_drop_wc_blocks_style() {
	wp_dequeue_style( 'wc-blocks-style' );
	wp_deregister_style( 'wc-blocks-style' );
}

/**
 * WooCommerce stylesheets (general/layout/smallscreen, 3 requests) load only
 * where theme.css does not style WooCommerce's markup itself yet: the shop
 * and product archives, cart, checkout and account. Product pages and the
 * product cards of the front page and landings (featured-products block) live
 * on theme.css alone: without the three files the cards compute the same
 * styles (T-49 probe) and the product page takes its rules from the theme.
 *
 * @param array $styles WooCommerce's stylesheets.
 * @return array
 */
add_filter( 'woocommerce_enqueue_styles', 'ccn_scope_wc_styles' );
function ccn_scope_wc_styles( $styles ) {
	if ( is_shop() || is_product_taxonomy() || is_cart() || is_checkout() || is_account_page() ) {
		return $styles;
	}
	return array();
}

/**
 * The lightbox's two stylesheets (PhotoSwipe) matter only once it opens: they
 * load as print styles and switch to all media once loaded, so they never
 * block the first paint of a product page (footer styles would not help:
 * WordPress 7 moves them back into <head>). theme.css keeps the closed
 * lightbox hidden meanwhile.
 *
 * @param string $tag    Stylesheet link tag.
 * @param string $handle Style handle.
 * @return string
 */
add_filter( 'style_loader_tag', 'ccn_lightbox_styles_async', 10, 2 );

/**
 * WooPayments' tracker (frontend-tracks with wp-dom-ready and wp-polyfill,
 * registered in wp_footer) printed three blocking scripts at the end of a
 * product page and held its LCP back by about 0.25s (T-49 A/B). They defer
 * there now (production delays them through WP Rocket); its data and config
 * still run inline before it. WordPress keeps a dependency blocking if a
 * non-deferred script needs it.
 */
add_action( 'wp_footer', 'ccn_defer_wcpay_tracker', 11 );
function ccn_defer_wcpay_tracker() {
	if ( ! function_exists( 'is_product' ) || ! is_product() ) {
		return;
	}
	foreach ( array( 'wcpay-frontend-tracks', 'wp-dom-ready', 'wp-polyfill' ) as $ccn_handle ) {
		if ( wp_script_is( $ccn_handle, 'registered' ) ) {
			wp_script_add_data( $ccn_handle, 'strategy', 'defer' );
		}
	}
}
function ccn_lightbox_styles_async( $tag, $handle ) {
	if ( 'photoswipe' !== $handle && 'photoswipe-default-skin' !== $handle ) {
		return $tag;
	}
	return str_replace( " media='all'", " media='print' onload=\"this.media='all'\"", $tag );
}
