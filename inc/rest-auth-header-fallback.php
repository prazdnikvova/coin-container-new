<?php
/**
 * REST API: take the Basic credentials of an Application Password from the
 * X-WP-Authorization header when the host drops the Authorization header,
 * ported 1:1 from production (transmax-child/inc/rest-auth-header-fallback.php,
 * card K67b, shipped with K69, 26.10.2026).
 *
 * On the KAS (all-inkl) hosting the Authorization header never reaches PHP:
 * curl -u wrong:wrong against /wp-json/wp/v2/users/me answers
 * rest_not_logged_in on coin-container.de, while a local site answers
 * invalid_username. The WordPress rewrite rule
 * [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}] is in .htaccess; SetEnvIf
 * Authorization and CGIPassAuth On were tried on staging without effect.
 * Other request headers do reach PHP, so REST clients (the news drafts script,
 * the WooCommerce connector of Olga's agents) send the same "Basic <base64>"
 * value twice, as Authorization and as X-WP-Authorization.
 *
 * Runs once when this file is included (first in functions.php, before
 * WordPress determines the current user), no hooks:
 * - only for REST requests (/wp-json/... or ?rest_route=);
 * - only when PHP got no credentials (PHP_AUTH_USER and HTTP_AUTHORIZATION
 *   empty) and X-WP-Authorization holds a well-formed Basic value;
 * - then the value becomes HTTP_AUTHORIZATION and core's
 *   wp_populate_basic_auth_from_authorization_header() fills PHP_AUTH_USER /
 *   PHP_AUTH_PW, which wp_validate_application_password() checks on
 *   determine_current_user. From there on it is the normal core path:
 *   Application Passwords only, API requests only, wrong values are rejected
 *   by core.
 * The extra header is removed from $_SERVER once it has been used. Nothing is
 * logged. Where the Authorization header does reach PHP (local nginx) this
 * file does nothing.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

( function () {
	$uri     = isset( $_SERVER['REQUEST_URI'] ) ? esc_url_raw( wp_unslash( $_SERVER['REQUEST_URI'] ) ) : '';
	$is_rest = 0 === strpos( $uri, '/wp-json/' ) || isset( $_GET['rest_route'] ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- only detects a REST request.
	$header  = isset( $_SERVER['HTTP_X_WP_AUTHORIZATION'] ) ? sanitize_text_field( wp_unslash( $_SERVER['HTTP_X_WP_AUTHORIZATION'] ) ) : '';

	if ( ! $is_rest || '' === $header || ! empty( $_SERVER['PHP_AUTH_USER'] ) || ! empty( $_SERVER['HTTP_AUTHORIZATION'] ) ) {
		return;
	}
	if ( ! preg_match( '%^Basic [A-Za-z0-9/+]*={0,2}$%', $header ) || ! function_exists( 'wp_populate_basic_auth_from_authorization_header' ) ) {
		return;
	}

	// Core's helper does nothing if either PHP_AUTH key is set at all, even to an empty string.
	unset( $_SERVER['PHP_AUTH_USER'], $_SERVER['PHP_AUTH_PW'] );
	$_SERVER['HTTP_AUTHORIZATION'] = $header;
	wp_populate_basic_auth_from_authorization_header();
	unset( $_SERVER['HTTP_X_WP_AUTHORIZATION'] );
} )();
