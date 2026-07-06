<?php
/**
 * Security hardening: user enumeration, headers, version leak.
 *
 * Note: if the site serves cached HTML past PHP (e.g. Apache + a page cache
 * rewriting via .htaccess), these headers will not cover cached hits —
 * duplicate them at the server level too.
 */

/**
 * 1. REST: /wp-json/wp/v2/users* for logged-in users only.
 * Anonymous requests get a 404 (rest_no_route), as if the route didn't exist.
 */
add_filter( 'rest_endpoints', 'ccn_close_rest_users' );
function ccn_close_rest_users( $endpoints ) {
	if ( is_user_logged_in() ) {
		return $endpoints;
	}
	foreach ( array_keys( $endpoints ) as $route ) {
		if ( 0 === strpos( $route, '/wp/v2/users' ) ) {
			unset( $endpoints[ $route ] );
		}
	}
	return $endpoints;
}

/**
 * 2. Author enumeration: ?author=N and /author/<login>/ return 404.
 * Remove this block if your project actually uses author archives.
 */
add_action( 'template_redirect', 'ccn_block_author_pages', 0 );
function ccn_block_author_pages() {
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- only detecting an enumeration attempt, not processing a form
	if ( is_author() || ( ! is_admin() && isset( $_GET['author'] ) ) ) {
		global $wp_query;
		$wp_query->set_404();
		status_header( 404 );
		nocache_headers();
	}
}

// Keep the canonical redirect from turning ?author=N into /author/<login>/.
add_filter( 'redirect_canonical', 'ccn_no_author_canonical' );
function ccn_no_author_canonical( $redirect_url ) {
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- only detecting an enumeration attempt, not processing a form
	if ( isset( $_GET['author'] ) || false !== strpos( (string) $redirect_url, '/author/' ) ) {
		return false;
	}
	return $redirect_url;
}

// Drop user logins from the core sitemap as well.
add_filter( 'wp_sitemaps_add_provider', 'ccn_drop_users_sitemap', 10, 2 );
function ccn_drop_users_sitemap( $provider, $name ) {
	return 'users' === $name ? false : $provider;
}

/**
 * 3. Security headers.
 * CSP is deliberately absent — roll it out via Report-Only with monitoring.
 * HSTS: one year, no includeSubDomains (inventory your subdomains first).
 */
add_action( 'send_headers', 'ccn_security_headers' );
function ccn_security_headers() {
	header( 'X-Frame-Options: SAMEORIGIN' );
	header( 'X-Content-Type-Options: nosniff' );
	header( 'Referrer-Policy: strict-origin-when-cross-origin' );
	header( 'Permissions-Policy: geolocation=(), microphone=(), camera=()' );
	if ( is_ssl() ) {
		header( 'Strict-Transport-Security: max-age=31536000' );
	}
}

/**
 * 4. WP version leak: remove generator from head/RSS.
 * (readme.html is a server-side concern: delete/block it in production.)
 */
remove_action( 'wp_head', 'wp_generator' );
add_filter( 'the_generator', '__return_empty_string' );
