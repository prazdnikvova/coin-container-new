<?php
/**
 * LocalBusiness JSON-LD — Yoast (free) outputs Organization but not a postal
 * address / geo. This adds a LocalBusiness node on the front page for local
 * SEO (the strongest competitor ranks partly on this). Data comes from Site
 * Settings so it stays admin-editable.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action( 'wp_head', 'ccn_local_business_schema', 20 );
function ccn_local_business_schema() {
	if ( ! is_front_page() || ! function_exists( 'ccn_setting' ) ) {
		return;
	}

	$address = ccn_setting( 'address' ); // "Weidestraße 122B, 22083 Hamburg"
	$street  = $address;
	$zip     = '';
	$city    = '';
	if ( preg_match( '/^(.*?),\s*(\d{5})\s+(.+)$/u', $address, $m ) ) {
		$street = trim( $m[1] );
		$zip    = $m[2];
		$city   = trim( $m[3] );
	}

	$schema = array(
		'@context'  => 'https://schema.org',
		'@type'     => 'LocalBusiness',
		'@id'       => home_url( '/#localbusiness' ),
		'name'      => ccn_setting( 'company_name', get_bloginfo( 'name' ) ),
		'url'       => home_url( '/' ),
		'image'     => get_template_directory_uri() . '/assets/img/logo.webp',
		'telephone' => ccn_setting( 'phone' ),
		'email'     => ccn_setting( 'email' ),
		'address'   => array(
			'@type'           => 'PostalAddress',
			'streetAddress'   => $street,
			'postalCode'      => $zip,
			'addressLocality' => $city,
			'addressCountry'  => 'DE',
		),
		'geo'       => array(
			'@type'     => 'GeoCoordinates',
			'latitude'  => '53.5753',
			'longitude' => '10.0409',
		),
		'areaServed' => 'Europe',
	);

	$sameas = array_filter(
		array(
			ccn_setting( 'social_facebook' ),
			ccn_setting( 'social_instagram' ),
			ccn_setting( 'social_linkedin' ),
			ccn_setting( 'social_ebay' ),
			ccn_setting( 'social_pinterest' ),
			ccn_setting( 'social_xing' ),
		)
	);
	if ( $sameas ) {
		$schema['sameAs'] = array_values( $sameas );
	}

	echo '<script type="application/ld+json">' . wp_json_encode( $schema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ) . "</script>\n";
}
