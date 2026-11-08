<?php
/**
 * Trust row of the home hero (T-47, DESIGN.md "Hero"), from Site Settings →
 * Vertrauen and worded as on production (transmax-child/inc/hero-trust.php):
 * Trustpilot score band, stars and review count, the Google review count (with
 * the rating only when one is filled in) and the badge as text. Every item
 * prints only from filled values. Nothing here loads a file: stars and brand
 * marks are inline SVG and keep their own brand colours, the badge image is
 * left to the logos block (T-50); its alt text names the badge link.
 *
 * One renderer for the chips site-wide (T-50): the hero, the product page and
 * the trust bar block print it as is; the footer passes array( 'compact' => true )
 * for the two links of the production footer («Trustpilot 4,5», «Google-Bewertungen»).
 */

$ccn_compact   = ! empty( $args['compact'] );
$ccn_tp_rating = (float) ccn_setting( 'trustpilot_rating' );
$ccn_tp_count  = (int) ccn_setting( 'trustpilot_count' );
$ccn_tp_url    = ccn_setting( 'trustpilot_url' );
$ccn_g_rating  = (float) ccn_setting( 'google_rating' );
$ccn_g_count   = (int) ccn_setting( 'google_count' );
$ccn_g_url     = ccn_setting( 'google_url' );
$ccn_pq_text   = ccn_setting( 'badge_text' );
$ccn_pq_url    = ccn_setting( 'badge_url' );
$ccn_pq_alt    = (string) get_post_meta( (int) ccn_setting( 'badge_image' ), '_wp_attachment_image_alt', true );
$ccn_tp        = $ccn_tp_rating > 0 && $ccn_tp_count > 0 && $ccn_tp_url;
$ccn_g         = $ccn_g_count > 0 && $ccn_g_url;
$ccn_pq        = ! $ccn_compact && $ccn_pq_text && $ccn_pq_url;

if ( ! $ccn_tp && ! $ccn_g && ! $ccn_pq ) {
	return;
}
$ccn_tp_star = '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path fill="#00b67a" d="M8 0l2.4 5.4 5.6.6-4.2 3.8 1.2 5.7L8 12.6 3 15.5l1.2-5.7L0 6l5.6-.6z"/></svg>';
$ccn_g_mark  = '<svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#4285f4" d="M45.1 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h11.8c-.5 2.7-2.1 5-4.4 6.6v5.5h7.1c4.2-3.8 6.6-9.5 6.6-16.1z"/><path fill="#34a853" d="M24 46c5.9 0 10.9-2 14.5-5.3l-7.1-5.5c-2 1.3-4.5 2.1-7.4 2.1-5.7 0-10.5-3.8-12.2-9H4.5v5.7C8.1 41.1 15.5 46 24 46z"/><path fill="#fbbc05" d="M11.8 28.3c-.4-1.3-.7-2.7-.7-4.3s.3-2.9.7-4.3v-5.7H4.5C3 17 2 20.4 2 24s1 7 2.5 10l7.3-5.7z"/><path fill="#ea4335" d="M24 10.7c3.2 0 6.1 1.1 8.4 3.3l6.3-6.3C34.9 4.1 29.9 2 24 2 15.5 2 8.1 6.9 4.5 14l7.3 5.7c1.7-5.2 6.5-9 12.2-9z"/></svg>';
if ( $ccn_compact ) :
	?>
<div class="ccn-trust ccn-trust--compact">
	<?php if ( $ccn_tp ) : ?>
		<a href="<?php echo esc_url( $ccn_tp_url ); ?>" target="_blank" rel="noopener"><?php echo $ccn_tp_star; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static SVG. ?><span><?php echo esc_html( 'Trustpilot ' . number_format_i18n( $ccn_tp_rating, 1 ) ); ?></span><span class="screen-reader-text"><?php echo esc_html( sprintf( /* translators: %d: number of reviews */ _n( ' von 5 Sternen, %d Bewertung', ' von 5 Sternen, %d Bewertungen', $ccn_tp_count, 'coin-container' ), $ccn_tp_count ) ); ?> <?php esc_html_e( '(öffnet in neuem Tab)', 'coin-container' ); ?></span></a>
	<?php endif; ?>
	<?php if ( $ccn_g ) : ?>
		<a href="<?php echo esc_url( $ccn_g_url ); ?>" target="_blank" rel="noopener"><?php echo $ccn_g_mark; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static SVG. ?><span><?php esc_html_e( 'Google-Bewertungen', 'coin-container' ); ?></span><span class="screen-reader-text"> <?php esc_html_e( '(öffnet in neuem Tab)', 'coin-container' ); ?></span></a>
	<?php endif; ?>
</div>
	<?php
	return;
endif;
?>
<div class="ccn-trust">
	<?php
	if ( $ccn_tp ) :
		// Trustpilot's own score bands, as on production.
		$ccn_tp_label = $ccn_tp_rating >= 4.5 ? __( 'Hervorragend', 'coin-container' ) : ( $ccn_tp_rating >= 4 ? __( 'Sehr gut', 'coin-container' ) : '' );
		// Five 16px boxes, the last one partly filled (4.5 = four full boxes and a half).
		$ccn_tp_boxes = '';
		for ( $ccn_i = 0; $ccn_i < 5; $ccn_i++ ) {
			$ccn_fill = max( 0, min( 1, $ccn_tp_rating - $ccn_i ) );
			if ( $ccn_fill < 1 ) {
				$ccn_tp_boxes .= sprintf( '<rect x="%d" width="16" height="16" fill="#dcdce6"/>', $ccn_i * 19 );
			}
			if ( $ccn_fill > 0 ) {
				$ccn_tp_boxes .= sprintf( '<rect x="%d" width="%s" height="16" fill="#00b67a"/>', $ccn_i * 19, esc_attr( (string) round( 16 * $ccn_fill, 1 ) ) );
			}
		}
		$ccn_star = 'l1.9 4.6 5 .4-3.8 3.3 1.2 4.8-4.3-2.7-4.3 2.7 1.2-4.8-3.8-3.3 5-.4z';
		?>
		<a href="<?php echo esc_url( $ccn_tp_url ); ?>" target="_blank" rel="noopener">
			<?php if ( $ccn_tp_label ) : ?>
				<span class="ccn-trust-label"><?php echo esc_html( $ccn_tp_label ); ?></span>
			<?php endif; ?>
			<svg width="92" height="16" viewBox="0 0 92 16" aria-hidden="true"><?php echo $ccn_tp_boxes; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- numeric attributes only. ?><path fill="#fff" d="<?php echo esc_attr( 'M8 1.2' . $ccn_star . str_repeat( 'm19 0' . $ccn_star, 4 ) ); ?>"/></svg>
			<span><?php echo esc_html( sprintf( /* translators: %d: number of reviews */ _n( '%d Bewertung auf', '%d Bewertungen auf', $ccn_tp_count, 'coin-container' ), $ccn_tp_count ) ); ?></span>
			<span class="ccn-trust-mark"><?php echo $ccn_tp_star; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static SVG. ?>Trustpilot</span><span class="screen-reader-text"><?php echo esc_html( sprintf( /* translators: %s: rating with one decimal, e.g. 4,5 */ __( ', %s von 5 Sternen', 'coin-container' ), number_format_i18n( $ccn_tp_rating, 1 ) ) ); ?> <?php esc_html_e( '(öffnet in neuem Tab)', 'coin-container' ); ?></span>
		</a>
	<?php endif; ?>
	<?php if ( $ccn_g ) : ?>
		<a href="<?php echo esc_url( $ccn_g_url ); ?>" target="_blank" rel="noopener">
			<?php echo $ccn_g_mark; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static SVG. ?>
			<?php // The rating only when it is filled in (production shows the count alone). ?>
			<span><?php echo esc_html( ( $ccn_g_rating > 0 ? number_format_i18n( $ccn_g_rating, 1 ) . ' ★ · ' : '' ) . sprintf( /* translators: %d: number of Google reviews */ _n( '%d Google-Bewertung', '%d Google-Bewertungen', $ccn_g_count, 'coin-container' ), $ccn_g_count ) ); ?></span><span class="screen-reader-text"> <?php esc_html_e( '(öffnet in neuem Tab)', 'coin-container' ); ?></span>
		</a>
	<?php endif; ?>
	<?php if ( $ccn_pq ) : ?>
		<a href="<?php echo esc_url( $ccn_pq_url ); ?>">
			<svg class="ccn-trust-pq" width="16" height="18" viewBox="0 0 64 72" aria-hidden="true"><path d="M32 4l24 8.5V33c0 15.5-10 26.5-24 34C18 59.5 8 48.5 8 33V12.5z" fill="none" stroke="currentColor" stroke-width="5"/><path d="M21 35l8 8 15-17" fill="none" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>
			<?php if ( $ccn_pq_alt ) : ?>
				<span class="screen-reader-text"><?php echo esc_html( $ccn_pq_alt ); ?></span>
			<?php endif; ?>
			<span><?php echo esc_html( $ccn_pq_text ); ?></span>
		</a>
	<?php endif; ?>
</div>
