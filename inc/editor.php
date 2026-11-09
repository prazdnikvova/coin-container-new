<?php
/**
 * Block editor for the team (T-52, README "Patterns" and "Editor", DESIGN.md
 * "Editor"): the theme's own patterns only (patterns/, category «Coin
 * Container»; core's patterns and the wordpress.org pattern directory stay out
 * of the inserter) and the helpers the pattern files and the block examples
 * share. Nothing here prints on a public page.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Core's block patterns (query loops, navigation overlays) are a theme support
 * that classic themes get by default; wordpress.org's pattern directory loads
 * through the REST API of the editor. Both off: the Patterns tab lists the
 * theme's patterns only.
 */
add_action( 'after_setup_theme', 'ccn_editor_setup' );
function ccn_editor_setup() {
	remove_theme_support( 'core-block-patterns' );
}
add_filter( 'should_load_remote_block_patterns', '__return_false' );

/**
 * The one pattern category: every file in patterns/ names it under
 * "Categories". WordPress registers the files itself (theme patterns
 * directory); the list of files is cached for 30 minutes per theme version
 * (README "Patterns").
 */
add_action( 'init', 'ccn_register_pattern_category' );
function ccn_register_pattern_category() {
	register_block_pattern_category(
		'coin-container',
		array(
			'label'       => __( 'Coin Container', 'coin-container' ),
			'description' => __( 'Page layouts of the theme: replace every [placeholder], then pick the images and the form in the block sidebar.', 'coin-container' ),
		)
	);
}

/**
 * Placeholder texts of the patterns and the block examples: German like the
 * content they stand for, in square brackets, never a fact, figure, price,
 * product name or phone number (content rule: nothing invented). The smoke
 * test fails when one of them reaches a public page.
 *
 * @param string $key Placeholder key.
 * @return string Placeholder; empty for an unknown key.
 */
function ccn_placeholder( $key ) {
	$texts = array(
		'heading'    => __( '[Überschrift]', 'coin-container' ),
		'accent'     => __( '[Akzent]', 'coin-container' ),
		'intro'      => __( '[Kurzer Einleitungstext]', 'coin-container' ),
		'text'       => __( '[Text]', 'coin-container' ),
		'title'      => __( '[Titel]', 'coin-container' ),
		'teaser'     => __( '[Kurzer Text]', 'coin-container' ),
		'question'   => __( '[Frage]', 'coin-container' ),
		'answer'     => __( '[Antwort]', 'coin-container' ),
		'highlight'  => __( '[Hervorhebung]', 'coin-container' ),
		'subheading' => __( '[Zwischenüberschrift]', 'coin-container' ),
		'item'       => __( '[Listenpunkt]', 'coin-container' ),
		'label'      => __( '[Bezeichnung]', 'coin-container' ),
	);
	return isset( $texts[ $key ] ) ? $texts[ $key ] : '';
}

/**
 * Data of an ACF block as the editor stores it: every value under its field
 * name plus the "_name" => field key reference next to it (keys from
 * acf-json/group_ccn_block_*.json; without the references the fields show
 * empty in the block sidebar). A repeater is its row count, its rows are
 * "<name>_<row>_<sub field>" entries.
 *
 * @param array $fields Field name => array( field key, value ).
 * @return array Block data.
 */
function ccn_block_data( $fields ) {
	$data = array();
	foreach ( $fields as $name => $field ) {
		$data[ $name ]       = $field[1];
		$data[ '_' . $name ] = $field[0];
	}
	return $data;
}

/**
 * Repeater rows for ccn_block_data(): the row count under the repeater's name,
 * then every sub field of every row as "<name>_<row>_<sub field>".
 *
 * @param string $name Repeater field name.
 * @param string $key  Repeater field key.
 * @param array  $rows One array per row: sub field name => array( sub field key, value ).
 * @return array Field name => array( field key, value ).
 */
function ccn_block_rows( $name, $key, $rows ) {
	$fields = array( $name => array( $key, count( $rows ) ) );
	foreach ( array_values( $rows ) as $index => $row ) {
		foreach ( $row as $sub => $field ) {
			$fields[ "{$name}_{$index}_{$sub}" ] = $field;
		}
	}
	return $fields;
}

/**
 * One ACF block of a pattern file (patterns/*.php), serialized by core
 * (serialize_block() encodes the attributes the way the editor does).
 *
 * @param string $name   Block name, e.g. 'acf/intro'.
 * @param array  $fields Field name => array( field key, value ); see ccn_block_data().
 * @return string Block markup.
 */
function ccn_pattern_block( $name, $fields = array() ) {
	return serialize_block(
		array(
			'blockName'    => $name,
			'attrs'        => array(
				'name' => $name,
				'data' => ccn_block_data( $fields ),
				'mode' => 'preview',
			),
			'innerBlocks'  => array(),
			'innerHTML'    => '',
			'innerContent' => array(),
		)
	) . "\n\n";
}

/**
 * A paragraph of placeholder text for a rich-text (wysiwyg) field.
 *
 * @param string $key Placeholder key.
 * @return string HTML.
 */
function ccn_placeholder_html( $key ) {
	return '<p>' . esc_html( ccn_placeholder( $key ) ) . '</p>';
}
