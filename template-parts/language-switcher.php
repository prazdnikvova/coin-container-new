<?php
/**
 * Language switcher (T-55, DESIGN.md "Language switcher"): «DE | EN», each
 * language linking to the current page in that language. The languages come
 * from TranslatePress' trp_custom_language_switcher(); no TranslatePress
 * markup, stylesheet or script (its floater is off and inc/trp-compat.php
 * dequeues its switcher assets). header.php prints it twice, in the top bar
 * (from 64rem) and at the end of the mobile menu (below 64rem); theme.css
 * shows one of them. Nothing without TranslatePress or with one language.
 *
 * - The links are the hreflang alternates of the page: the current address
 *   without query arguments that do not identify the page (pagination stays,
 *   TranslatePress' get_hreflang_source_url()), so switching never repeats
 *   an action such as ?add-to-cart=; a search keeps its query.
 * - The current language is a <span aria-current="true">, every other one a
 *   link with hreflang and lang.
 * - data-no-translation keeps TranslatePress from rewriting the German link
 *   of an English page into the English address
 *   (class-translation-render.php, handle_custom_links_and_forms()).
 *
 * @package coin-container
 */

if ( ! function_exists( 'trp_custom_language_switcher' ) ) {
	return;
}
$ccn_languages = trp_custom_language_switcher();
if ( ! is_array( $ccn_languages ) || count( $ccn_languages ) < 2 ) {
	return;
}
$ccn_converter = TRP_Translate_Press::get_trp_instance()->get_component( 'url_converter' );
$ccn_source    = $ccn_converter->get_hreflang_source_url( $ccn_converter->cur_page_url( false ) );
if ( is_search() ) {
	$ccn_source = add_query_arg( 's', rawurlencode( get_search_query( false ) ), $ccn_source );
}
$ccn_current = ccn_trp_current_language();
$ccn_items   = array();
foreach ( $ccn_languages as $ccn_code => $ccn_language ) {
	$ccn_tag   = strtolower( (string) strtok( (string) $ccn_code, '_' ) );
	$ccn_label = strtoupper( (string) $ccn_language['short_language_name'] );
	if ( $ccn_code === $ccn_current ) {
		$ccn_items[] = sprintf( '<span lang="%s" aria-current="true">%s</span>', esc_attr( $ccn_tag ), esc_html( $ccn_label ) );
	} else {
		// Third argument '': no #TRPLINKPROCESSED marker in the returned address.
		$ccn_url     = $ccn_converter->get_url_for_language( $ccn_code, $ccn_source, '' );
		$ccn_items[] = sprintf( '<a href="%s" hreflang="%s" lang="%s">%s</a>', esc_url( $ccn_url ), esc_attr( $ccn_tag ), esc_attr( $ccn_tag ), esc_html( $ccn_label ) );
	}
}
?>
<p class="ccn-lang" data-no-translation><?php echo implode( '<span aria-hidden="true"> | </span>', $ccn_items ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- every part escaped above. ?></p>
