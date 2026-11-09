<?php
/**
 * Shortcodes of the theme. Exactly one: content is built from blocks, and a
 * shortcode is only for a value inside running text.
 *
 * [ccn_dieselzuschlag] prints the diesel surcharge of Site Settings → Preise
 * inside the text of the transport cost post (production: [coin_dieselzuschlag],
 * transmax-child/inc/seo-migration-transport-brief.php, briefing 25.09.2026),
 * in production's format: one decimal, a trailing ",0" dropped, then " %"
 * ("20 %", "12,5 %"). An empty or non-numeric value prints nothing. The
 * content migration (T-53b) renames production's shortcode in the post.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_shortcode( 'ccn_dieselzuschlag', 'ccn_dieselzuschlag_shortcode' );

/**
 * @return string The surcharge in a span; '' without a value.
 */
function ccn_dieselzuschlag_shortcode() {
	$text = ccn_percent_text( ccn_setting( 'diesel_surcharge' ) );
	return '' === $text ? '' : '<span class="ccn-surcharge">' . esc_html( $text ) . '</span>';
}

/**
 * A percentage as production prints it: "20" -> "20 %", "12,5" -> "12,5 %".
 *
 * @param mixed $raw Value as typed (a "%" sign and a decimal comma are fine).
 * @return string Plain text; '' when the value is empty or not a number.
 */
function ccn_percent_text( $raw ) {
	$raw = str_replace( ',', '.', trim( str_replace( '%', '', (string) $raw ) ) );
	if ( '' === $raw || ! is_numeric( $raw ) ) {
		return '';
	}
	return rtrim( rtrim( number_format( (float) $raw, 1, ',', '' ), '0' ), ',' ) . ' %';
}
