<?php
/**
 * Front-end performance that is not an asset (T-59): what the browser asks
 * for on its own.
 *
 * - /favicon.ico is answered with the icon itself, not with a redirect.
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
