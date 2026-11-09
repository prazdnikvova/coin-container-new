<?php
/**
 * English SEO layer for TranslatePress free (T-55), ported from the K62 pilot
 * of production (transmax-child/inc/trp-seo-en.php, cards K62/P2, K62/P3-2e;
 * decision Volodymyr 28.10.2026: stay on free, no SEO Pack).
 *
 * TranslatePress free translates the visible page, but Rank Math's <title>,
 * meta description, og:* and twitter:* stay German on /en/, and the Rank Math
 * sitemap lists no /en/ address. This file fills both gaps. German pages
 * never change: every filter returns early on the default language
 * (ccn_trp_is_default_language(), inc/trp-compat.php).
 *
 * 1. Meta texts from the meta of the queried object (pages, posts, products,
 *    the shop page, product categories), the keys of the pilot, migrated
 *    from production by T-53c: _coin_en_title, _coin_en_description. The
 *    title also feeds og:title and twitter:title, the description
 *    og:description and twitter:description. Without English meta the German
 *    value stays (never an empty tag).
 * 2. og:locale en_GB: the texts are British English (decision Volodymyr
 *    07.11.2026), TranslatePress runs the language as en_US. <html lang> and
 *    hreflang carry no region through two TranslatePress advanced settings
 *    (html_lang_remove_locale, hreflang_remove_locale).
 * 3. Canonical: the address in the language of the page.
 * 4. /sitemap-en.xml: the /en/ address of every URL of Rank Math's sitemap
 *    index (the same providers, so the same post types, taxonomies and
 *    exclusions) with hreflang alternates, listed in sitemap_index.xml. The
 *    rewrite rule is stored by WordPress: flush the rules once after adding
 *    this file (wp rewrite flush, or Settings > Permalinks > Save), and once
 *    after changing the TranslatePress languages.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * The object whose meta describes the current page: [ 'post'|'term', id ],
 * or null. The shop archive maps to its page (the queried object there is the
 * post type, not the page).
 *
 * @return array|null
 */
function ccn_en_seo_object() {
	if ( function_exists( 'is_shop' ) && is_shop() ) {
		$id = (int) wc_get_page_id( 'shop' );
		return $id > 0 ? array( 'post', $id ) : null;
	}
	$object = get_queried_object();
	if ( $object instanceof WP_Post ) {
		return array( 'post', (int) $object->ID );
	}
	if ( $object instanceof WP_Term ) {
		return array( 'term', (int) $object->term_id );
	}
	return null;
}

/**
 * English meta of the current page ('title' or 'description'); '' on the
 * default language or when there is none.
 *
 * @param string $field Field name.
 * @return string
 */
function ccn_en_seo_meta( $field ) {
	static $cache = array();
	if ( ccn_trp_is_default_language() ) {
		return '';
	}
	$target = ccn_en_seo_object();
	if ( ! $target ) {
		return '';
	}
	$key = $target[0] . $target[1] . $field;
	if ( ! isset( $cache[ $key ] ) ) {
		$meta_key      = '_coin_en_' . $field;
		$cache[ $key ] = 'term' === $target[0]
			? (string) get_term_meta( $target[1], $meta_key, true )
			: (string) get_post_meta( $target[1], $meta_key, true );
	}
	return $cache[ $key ];
}

/**
 * English title with the page number of a paginated archive (pilot K62/R1,
 * B10): Rank Math's German template adds "Seite N von M", the stored English
 * title would give every page the title of page 1. The number goes before
 * the brand ("… – Page 2 of 4 | Coin Container"), else at the end.
 *
 * @param string $title English title.
 * @return string
 */
function ccn_en_seo_paged_title( $title ) {
	global $wp_query;
	if ( ! is_paged() ) {
		return $title;
	}
	$page   = max( 1, (int) get_query_var( 'paged' ) );
	$pages  = isset( $wp_query->max_num_pages ) ? (int) $wp_query->max_num_pages : 0;
	$suffix = $pages >= $page ? sprintf( ' – Page %d of %d', $page, $pages ) : sprintf( ' – Page %d', $page );
	if ( preg_match( '/^(.+?)( (?:\||-|–) Coin Container)$/u', $title, $m ) ) {
		return $m[1] . $suffix . $m[2];
	}
	return $title . $suffix;
}

add_filter( 'rank_math/frontend/title', 'ccn_en_seo_title', 20 );
add_filter( 'rank_math/opengraph/facebook/og_title', 'ccn_en_seo_title', 20 );
add_filter( 'rank_math/opengraph/twitter/twitter_title', 'ccn_en_seo_title', 20 );
function ccn_en_seo_title( $title ) {
	$en = ccn_en_seo_meta( 'title' );
	return '' === $en ? $title : ccn_en_seo_paged_title( $en );
}

add_filter( 'rank_math/frontend/description', 'ccn_en_seo_description', 20 );
add_filter( 'rank_math/opengraph/facebook/og_description', 'ccn_en_seo_description', 20 );
add_filter( 'rank_math/opengraph/twitter/twitter_description', 'ccn_en_seo_description', 20 );
function ccn_en_seo_description( $description ) {
	$en = ccn_en_seo_meta( 'description' );
	return '' === $en ? $description : $en;
}

add_filter( 'rank_math/opengraph/facebook/og_locale', 'ccn_en_seo_og_locale', 20 );
function ccn_en_seo_og_locale( $locale ) {
	return ( ! ccn_trp_is_default_language() && 'en_US' === $locale ) ? 'en_GB' : $locale;
}

add_filter( 'rank_math/frontend/canonical', 'ccn_en_seo_canonical', 20 );
function ccn_en_seo_canonical( $canonical ) {
	if ( ccn_trp_is_default_language() || ! is_string( $canonical ) || '' === $canonical ) {
		return $canonical;
	}
	// Third argument '': no #TRPLINKPROCESSED marker in the returned address.
	return TRP_Translate_Press::get_trp_instance()->get_component( 'url_converter' )->get_url_for_language( ccn_trp_current_language(), $canonical, '' );
}

/* ---------------------------------------------------------------- /sitemap-en.xml */

add_action( 'init', 'ccn_sitemap_en_rewrite' );
function ccn_sitemap_en_rewrite() {
	add_rewrite_rule( '^sitemap-en\.xml$', 'index.php?ccn_sitemap_en=1', 'top' );
}

add_filter( 'query_vars', 'ccn_sitemap_en_query_var' );
function ccn_sitemap_en_query_var( $vars ) {
	$vars[] = 'ccn_sitemap_en';
	return $vars;
}

/**
 * True when TranslatePress and the Rank Math sitemap providers are there.
 *
 * @return bool
 */
function ccn_sitemap_en_available() {
	return class_exists( 'TRP_Translate_Press' )
		&& class_exists( '\RankMath\Sitemap\Providers\Post_Type' )
		&& class_exists( '\RankMath\Sitemap\Providers\Taxonomy' )
		&& class_exists( '\RankMath\Helper' );
}

/**
 * The URLs of Rank Math's sitemap index as [ loc, mod ], read through the
 * providers Rank Math itself uses, so post types, taxonomies, noindex and
 * exclusions match sitemap_index.xml exactly. Every German URL gets its
 * English entry, also without English meta (TranslatePress translates the
 * page itself) and the legal pages (decision of T-55 until OPEN #74 is
 * answered).
 *
 * @return array
 */
function ccn_sitemap_en_links() {
	$per_page  = (int) \RankMath\Helper::get_settings( 'sitemap.items_per_page', 200 );
	$per_page  = $per_page > 0 ? $per_page : 200;
	$providers = array( new \RankMath\Sitemap\Providers\Post_Type(), new \RankMath\Sitemap\Providers\Taxonomy() );
	$links     = array();
	foreach ( $providers as $provider ) {
		foreach ( $provider->get_index_links( $per_page ) as $index_link ) {
			// loc looks like https://host/page-sitemap.xml or .../product-sitemap2.xml.
			if ( ! preg_match( '~/([^/]+?)-sitemap([0-9]*)\.xml$~', $index_link['loc'], $m ) ) {
				continue;
			}
			$page = '' === $m[2] ? 1 : (int) $m[2];
			foreach ( $provider->get_sitemap_links( $m[1], $per_page, $page ) as $link ) {
				if ( ! empty( $link['loc'] ) ) {
					$links[ $link['loc'] ] = array( $link['loc'], isset( $link['mod'] ) ? $link['mod'] : '' );
				}
			}
		}
	}
	return array_values( $links );
}

/**
 * W3C datetime of a Rank Math "mod" value ('' when unknown).
 *
 * @param string $mod Modification date.
 * @return string
 */
function ccn_sitemap_en_date( $mod ) {
	$time = empty( $mod ) ? false : strtotime( $mod );
	return $time ? gmdate( 'c', $time ) : '';
}

add_action( 'template_redirect', 'ccn_sitemap_en_render', 0 );
function ccn_sitemap_en_render() {
	if ( ! get_query_var( 'ccn_sitemap_en' ) ) {
		return;
	}
	if ( ! ccn_sitemap_en_available() ) {
		status_header( 404 );
		nocache_headers();
		exit;
	}
	$trp       = TRP_Translate_Press::get_trp_instance();
	$converter = $trp->get_component( 'url_converter' );
	$settings  = $trp->get_component( 'settings' )->get_settings();
	$default   = $settings['default-language'];
	$languages = array_values( array_diff( (array) $settings['publish-languages'], array( $default ) ) );

	$xml  = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
	$xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">' . "\n";
	foreach ( ccn_sitemap_en_links() as $link ) {
		list( $loc, $mod ) = $link;
		$alternates        = array( strtok( $default, '_' ) => $loc );
		$is_home           = in_array( (string) wp_parse_url( $loc, PHP_URL_PATH ), array( '', '/' ), true );
		foreach ( $languages as $language ) {
			$code = strtok( $language, '_' );
			if ( $is_home ) {
				// get_url_for_language() leaves the home URL alone here: for the path "/" its
				// is_sitemap_path() falls back to REQUEST_URI (/sitemap-en.xml). Built directly.
				$alternates[ $code ] = trailingslashit( $loc ) . trailingslashit( $converter->get_url_slug( $language ) );
				continue;
			}
			// Third argument '': no #TRPLINKPROCESSED marker in the returned address.
			$alternates[ $code ] = $converter->get_url_for_language( $language, $loc, '' );
		}
		$date = ccn_sitemap_en_date( $mod );
		foreach ( $languages as $language ) {
			$xml .= "\t<url>\n\t\t<loc>" . esc_url( $alternates[ strtok( $language, '_' ) ] ) . "</loc>\n";
			if ( '' !== $date ) {
				$xml .= "\t\t<lastmod>" . $date . "</lastmod>\n";
			}
			foreach ( $alternates as $code => $href ) {
				$xml .= "\t\t" . '<xhtml:link rel="alternate" hreflang="' . esc_attr( $code ) . '" href="' . esc_url( $href ) . '"/>' . "\n";
			}
			$xml .= "\t</url>\n";
		}
	}
	$xml .= '</urlset>' . "\n";

	status_header( 200 );
	header( 'Content-Type: application/xml; charset=UTF-8' );
	header( 'X-Robots-Tag: noindex, follow', true );
	echo $xml; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- built from escaped parts above.
	exit;
}

add_filter( 'rank_math/sitemap/index', 'ccn_sitemap_en_index_entry' );
function ccn_sitemap_en_index_entry( $xml ) {
	if ( ! ccn_sitemap_en_available() ) {
		return $xml;
	}
	$last = '';
	foreach ( ccn_sitemap_en_links() as $link ) {
		$date = ccn_sitemap_en_date( $link[1] );
		if ( $date > $last ) {
			$last = $date;
		}
	}
	$xml .= "\t<sitemap>\n\t\t<loc>" . esc_url( home_url( '/sitemap-en.xml' ) ) . "</loc>\n";
	if ( '' !== $last ) {
		$xml .= "\t\t<lastmod>" . $last . "</lastmod>\n";
	}
	return $xml . "\t</sitemap>\n";
}

/*
 * Turning TranslatePress on or off changes what sitemap_index.xml must list.
 * Rank Math caches the index: after a deactivation it kept listing
 * /sitemap-en.xml, which then answers 404 (pilot, 07.11.2026). Reset the
 * cache on both events.
 */
add_action( 'activated_plugin', 'ccn_sitemap_en_reset_cache' );
add_action( 'deactivated_plugin', 'ccn_sitemap_en_reset_cache' );
function ccn_sitemap_en_reset_cache( $plugin ) {
	if ( 'translatepress-multilingual/index.php' === $plugin && class_exists( '\RankMath\Sitemap\Cache' ) ) {
		\RankMath\Sitemap\Cache::invalidate_storage();
	}
}
