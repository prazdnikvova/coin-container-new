<?php
/**
 * Block: Reviews widget (T-50, DESIGN.md "Trust", A6 C8): the live Google reviews
 * of production (Trustindex free widget, layout 13) and the Trustpilot TrustBox
 * behind one facade, plus the two profile links of the production footer, which
 * also serve without JavaScript. The page carries only the facade: reserved
 * boxes (no layout shift), the TrustBox snippet in an inert <template> and the
 * REST URL of the Google widget HTML (inc/trust.php); main.js starts both
 * 1200px before the section scrolls into view. Production places the Google
 * widget at the bottom of the front page (between stats and the CTA banner)
 * and on /ueber-uns/bewertungen/; above the fold the trust row stays static.
 */

$ccn_heading = get_field( 'heading' );
$ccn_intro   = get_field( 'intro' );
$ccn_google  = shortcode_exists( 'trustindex' );
$ccn_tb      = ccn_trustbox_attributes();

if ( ! $ccn_google && ! $ccn_tb ) {
	if ( ! empty( $is_preview ) ) {
		echo '<p><em>' . esc_html__( 'Reviews widget: activate the Google reviews plugin or fill in the Trustpilot business unit ID (Site Settings → Vertrauen).', 'coin-container' ) . '</em></p>';
	}
	return;
}
?>
<section class="ccn-reviews ccn-section ccn-section--default" data-motion="reveal"<?php echo ! empty( $block['anchor'] ) ? ' id="' . esc_attr( $block['anchor'] ) . '"' : ''; ?>>
	<div class="ccn-reviews-inner ccn-container">
		<?php if ( $ccn_heading ) : ?>
			<h2 class="section-heading"><?php echo esc_html( $ccn_heading ); ?></h2>
		<?php endif; ?>
		<?php if ( $ccn_intro ) : ?>
			<p class="ccn-reviews-intro"><?php echo esc_html( $ccn_intro ); ?></p>
		<?php endif; ?>
		<div class="ccn-reviews-facade"<?php echo $ccn_google ? ' data-ccn-reviews="' . esc_url( rest_url( 'ccn/v1/reviews' ) ) . '"' : ''; ?><?php echo $ccn_tb ? ' data-ccn-scripts="https://widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js"' : ''; ?>>
			<?php if ( $ccn_google ) : ?>
				<div class="ccn-reviews-google"></div>
			<?php endif; ?>
			<?php if ( $ccn_tb ) : ?>
				<div class="ccn-reviews-trustpilot"><template><div class="trustpilot-widget"<?php foreach ( $ccn_tb as $ccn_attr => $ccn_val ) : ?> <?php echo esc_attr( $ccn_attr ); ?>="<?php echo esc_attr( $ccn_val ); ?>"<?php endforeach; ?>></div></template></div>
			<?php endif; ?>
			<?php get_template_part( 'template-parts/trust-row', null, array( 'compact' => true ) ); ?>
		</div>
	</div>
</section>
