<?php
/**
 * Read access to the TranslatePress dictionary over REST (T-55), the GET half
 * of the K62 pilot's endpoint (transmax-child/inc/trp-dictionary-rest.php,
 * card K62/P3-2b). TranslatePress free has no import or export; the pilot's
 * translation pipeline reads untranslated strings through this route:
 *
 *   GET /wp-json/coin/v1/trp-strings?lang=en_US&type=dict|gettext&status=0&after_id=0&limit=500
 *
 * Same namespace and parameters as on staging and production, so the same
 * scripts work here. Writing (POST trp-strings, POST en-meta) is not ported:
 * English texts come through the editorial process.
 *
 * Rules:
 * - the route exists only while TranslatePress is active (otherwise
 *   rest_no_route);
 * - capability of the TranslatePress translation editor
 *   (trp_translating_capability, default manage_options); authentication by
 *   Application Password, also as X-WP-Authorization
 *   (inc/rest-auth-header-fallback.php);
 * - at most 500 rows per request, paged by after_id.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const CCN_TRP_REST_MAX_ROWS = 500;

/**
 * True when the current user may read the dictionary.
 *
 * @return bool
 */
function ccn_trp_rest_permission() {
	return current_user_can( apply_filters( 'trp_translating_capability', 'manage_options' ) );
}

/**
 * Dictionary table of a translation language and type, or WP_Error.
 *
 * @param string $lang Locale of a translation language.
 * @param string $type 'dict' or 'gettext'.
 * @return string|WP_Error
 */
function ccn_trp_rest_table( $lang, $type ) {
	if ( ! class_exists( 'TRP_Translate_Press' ) ) {
		return new WP_Error( 'ccn_trp_inactive', 'TranslatePress is not active.', array( 'status' => 409 ) );
	}
	$trp       = TRP_Translate_Press::get_trp_instance();
	$settings  = $trp->get_component( 'settings' )->get_settings();
	$languages = array_values( array_diff( (array) ( $settings['translation-languages'] ?? array() ), array( $settings['default-language'] ?? '' ) ) );
	if ( ! in_array( $lang, $languages, true ) ) {
		return new WP_Error(
			'ccn_trp_lang',
			'Unknown translation language.',
			array(
				'status'    => 400,
				'languages' => $languages,
			)
		);
	}
	$query = $trp->get_component( 'query' );
	return 'gettext' === $type ? $query->get_gettext_table_name( $lang ) : $query->get_table_name( $lang );
}

/**
 * GET coin/v1/trp-strings: rows of one dictionary table.
 *
 * @param WP_REST_Request $req Request.
 * @return array|WP_Error
 */
function ccn_trp_rest_get_strings( WP_REST_Request $req ) {
	global $wpdb;
	$table = ccn_trp_rest_table( $req['lang'], $req['type'] );
	if ( is_wp_error( $table ) ) {
		return $table;
	}
	$where = $wpdb->prepare( 'id > %d', $req['after_id'] );
	if ( $req['status'] >= 0 ) {
		$where .= $wpdb->prepare( ' AND status = %d', $req['status'] );
	}
	// $table comes from TranslatePress (prefix and language codes it validated), not from the request.
	$rows = $wpdb->get_results( "SELECT id, original, translated, status FROM `{$table}` WHERE {$where} ORDER BY id LIMIT " . (int) $req['limit'], ARRAY_A ); // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.DirectDatabaseQuery
	$rows = is_array( $rows ) ? $rows : array();
	$out  = array();
	foreach ( $rows as $row ) {
		$out[] = array(
			'id'         => (int) $row['id'],
			'original'   => $row['original'],
			'translated' => $row['translated'],
			'status'     => (int) $row['status'],
		);
	}
	$last = $out ? end( $out )['id'] : null;
	return array(
		'lang'          => $req['lang'],
		'type'          => $req['type'],
		'rows'          => $out,
		'next_after_id' => count( $out ) === (int) $req['limit'] ? $last : null,
	);
}

add_action( 'rest_api_init', 'ccn_trp_rest_routes' );
function ccn_trp_rest_routes() {
	if ( ! class_exists( 'TRP_Translate_Press' ) ) {
		return;
	}
	register_rest_route(
		'coin/v1',
		'/trp-strings',
		array(
			'methods'             => WP_REST_Server::READABLE,
			'callback'            => 'ccn_trp_rest_get_strings',
			'permission_callback' => 'ccn_trp_rest_permission',
			'args'                => array(
				'lang'     => array(
					'type'     => 'string',
					'required' => true,
					'pattern'  => '^[a-z]{2,3}(_[A-Za-z0-9]{2,8})*$',
				),
				'type'     => array(
					'type'    => 'string',
					'enum'    => array( 'dict', 'gettext' ),
					'default' => 'dict',
				),
				// -1 = any status.
				'status'   => array(
					'type'    => 'integer',
					'default' => 0,
					'minimum' => -1,
					'maximum' => 4,
				),
				'after_id' => array(
					'type'    => 'integer',
					'default' => 0,
					'minimum' => 0,
				),
				'limit'    => array(
					'type'    => 'integer',
					'default' => CCN_TRP_REST_MAX_ROWS,
					'minimum' => 1,
					'maximum' => CCN_TRP_REST_MAX_ROWS,
				),
			),
		)
	);
}
