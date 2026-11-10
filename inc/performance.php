<?php
/**
 * Front-end performance that is not an asset (T-59): what the browser asks
 * for on its own.
 *
 * - /favicon.ico is answered with the icon itself, not with a redirect.
 * - Speculative Loading of core stays safe for the shop: no prefetch of the
 *   cart, checkout and account pages, in any language.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * /favicon.ico. A browser asks for it when the page names no icon. Core
 * answers with a redirect to the site icon, or to the WordPress logo when
 * none is set: the front page made two requests for WordPress's logo. The
 * theme answers with the icon itself, 32×32: favicon.ico in the theme root
 * holds the pixels of production's site icon (the yellow 8 Fuß container,
 * cropped-8-fuss-512x512-1-32x32.png). One request, no redirect, and no
 * <link rel="icon"> in the document: the front page document stays inside
 * the first TCP window (DESIGN.md "Do / don't"). A favicon.ico in the web
 * root is served before WordPress starts and makes this a fallback.
 */
add_action( 'do_faviconico', 'ccn_serve_favicon' );
function ccn_serve_favicon() {
	$file = get_template_directory() . '/favicon.ico';
	if ( ! is_readable( $file ) ) {
		return; // Core redirects as before.
	}
	status_header( 200 );
	header( 'Content-Type: image/x-icon' );
	header( 'Content-Length: ' . filesize( $file ) );
	header( 'Cache-Control: public, max-age=604800' );
	readfile( $file ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_readfile -- a static file of the theme, sent as is.
	exit;
}

/*
 * Speculative Loading (core since 6.8). For visitors, core prints one
 * document rule at the end of every page: a same-site link is prefetched
 * when it is pressed (mode prefetch, eagerness conservative). The theme keeps
 * that default and never asks for prerender. Core itself leaves out
 * wp-admin, wp-login.php and the other wp-*.php files, uploads, plugin and
 * theme files, every link with a query string (WooCommerce's add-to-cart,
 * remove_item and wc-ajax links, nonces) and rel="nofollow" links.
 *
 * Added here: WooCommerce's cart, checkout and account pages and everything
 * under them, where WooCommerce keeps session state, in the default language
 * and in every TranslatePress language (/en/…): the language switcher of a
 * German page links to its English twin. The paths come from the pages'
 * permalinks, so a renamed page or another language needs no code change.
 * Core prefixes every path with the home path of the page it prints on (/en/
 * on English pages, where its rule covers only /en/ links anyway).
 */
add_filter( 'wp_speculation_rules_href_exclude_paths', 'ccn_speculation_exclude_shop_pages' );

/**
 * Exclude the cart, checkout and account pages from speculative loading.
 *
 * @param string[] $paths Path patterns to exclude.
 * @return string[]
 */
function ccn_speculation_exclude_shop_pages( $paths ) {
	foreach ( ccn_shop_session_paths() as $path ) {
		$paths[] = $path . '*';
	}
	return $paths;
}

/**
 * Paths of WooCommerce's cart, checkout and account pages in every language
 * of the site, e.g. /warenkorb/ and /en/warenkorb/.
 *
 * @return string[] Paths from the site root, each ending with a slash.
 */
function ccn_shop_session_paths() {
	if ( ! function_exists( 'wc_get_page_permalink' ) ) {
		return array();
	}
	$converter = null;
	$languages = array();
	if ( class_exists( 'TRP_Translate_Press' ) ) {
		$trp       = TRP_Translate_Press::get_trp_instance();
		$settings  = $trp->get_component( 'settings' )->get_settings();
		$converter = $trp->get_component( 'url_converter' );
		$languages = isset( $settings['publish-languages'] ) ? (array) $settings['publish-languages'] : array();
	}
	$paths = array();
	foreach ( array( 'cart', 'checkout', 'myaccount' ) as $page ) {
		if ( wc_get_page_id( $page ) <= 0 ) {
			continue;
		}
		$url  = wc_get_page_permalink( $page );
		$urls = array( $url );
		foreach ( $languages as $language ) {
			// Third argument '': no #TRPLINKPROCESSED marker in the returned address.
			$urls[] = $converter->get_url_for_language( $language, $url, '' );
		}
		foreach ( $urls as $language_url ) {
			$path = (string) wp_parse_url( (string) $language_url, PHP_URL_PATH );
			if ( '' !== $path && '/' !== $path ) {
				$paths[] = trailingslashit( $path );
			}
		}
	}
	return array_values( array_unique( $paths ) );
}
