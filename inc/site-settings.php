<?php
/**
 * "Site Settings" — the single ACF options page for admin-editable globals
 * (contacts, footer texts, social links), organized in tabs.
 *
 * Performance contract (project decision 2026-07-06): templates never call
 * get_field(..., 'option') directly — always ccn_setting(), which loads all
 * options once per request. Editable content must never add render-blocking
 * or external resources.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action( 'acf/init', 'ccn_register_site_settings_page' );
function ccn_register_site_settings_page() {
	if ( ! function_exists( 'acf_add_options_page' ) ) {
		return;
	}
	acf_add_options_page(
		array(
			'page_title'      => 'Site Settings',
			'menu_title'      => 'Site Settings',
			'menu_slug'       => 'ccn-site-settings',
			'capability'      => 'manage_options',
			'position'        => 61,
			'icon_url'        => 'dashicons-admin-generic',
			'update_button'   => 'Save settings',
			'updated_message' => 'Settings saved.',
		)
	);
}

/**
 * Read one Site Settings field. All options load once per request.
 *
 * @param string $name    Field name as defined in the Site Settings group.
 * @param mixed  $default Returned when the field is empty/missing.
 * @return mixed
 */
function ccn_setting( $name, $default = '' ) {
	static $settings = null;
	if ( null === $settings ) {
		$settings = function_exists( 'get_fields' ) ? (array) get_fields( 'option' ) : array();
	}
	return ( isset( $settings[ $name ] ) && '' !== $settings[ $name ] && null !== $settings[ $name ] )
		? $settings[ $name ]
		: $default;
}
