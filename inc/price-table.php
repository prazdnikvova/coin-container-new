<?php
/**
 * Price ranges: one source for every price table (T-56). Production keeps the
 * ranges in a PHP file of the theme (transmax-child/inc/preise.php, edited and
 * deployed by hand); here they live in Site Settings → Preise, read through
 * ccn_setting(): rows per container size (used / One Way / new, each a range
 * or empty), «Stand» and the note under the table. The block acf/price-table
 * prints them (blocks/lists/price-table.php, DESIGN.md "Price table").
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Rows of Site Settings → Preise that have a size, in their stored order.
 *
 * @return array<int, array<string, mixed>>
 */
function ccn_price_rows() {
	$rows = array();
	foreach ( (array) ccn_setting( 'price_rows', array() ) as $row ) {
		if ( is_array( $row ) && '' !== trim( (string) ( $row['size'] ?? '' ) ) ) {
			$rows[] = $row;
		}
	}
	return $rows;
}

/**
 * One cell in the production format: «ca. 850–1.200 €» when both bounds are
 * set (whole euros, German grouping), else «auf Anfrage».
 *
 * @param mixed $min Lower bound.
 * @param mixed $max Upper bound.
 * @return string Plain text (escape on output).
 */
function ccn_price_range( $min, $max ) {
	if ( ! is_numeric( $min ) || ! is_numeric( $max ) ) {
		return __( 'auf Anfrage', 'coin-container' );
	}
	return sprintf(
		/* translators: price range of one container size, 1: lower bound, 2: upper bound (formatted numbers). */
		__( 'ca. %1$s–%2$s', 'coin-container' ),
		number_format_i18n( (float) $min ),
		number_format_i18n( (float) $max )
	) . "\u{00A0}€";
}

add_filter( 'acf/load_field/key=field_ccn_pt_sizes', 'ccn_price_sizes_choices' );
/**
 * The «Sizes» checkbox of the price table block lists the sizes of Site
 * Settings → Preise. Not on the field group editor, so the dynamic list is
 * never saved into the group.
 *
 * @param array $field ACF field.
 * @return array
 */
function ccn_price_sizes_choices( $field ) {
	$screen = function_exists( 'get_current_screen' ) ? get_current_screen() : null;
	if ( $screen && 'acf-field-group' === $screen->post_type ) {
		return $field;
	}
	$field['choices'] = array();
	foreach ( ccn_price_rows() as $row ) {
		$size                      = (string) $row['size'];
		$field['choices'][ $size ] = $size;
	}
	return $field;
}
