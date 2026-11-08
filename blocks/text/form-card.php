<?php
/**
 * Block: Form card (T-51, DESIGN.md "Forms"): optional heading and intro, then the
 * chosen Contact Form 7 form on a light card; optionally e-mail, phone and address
 * from Site Settings beside it (from 64rem, below it on phones) with a link to the
 * address on Google Maps instead of an embedded map. Replaces the hand-built
 * "ccn-form-card" groups of the landings. The form keeps CF7's own markup, events
 * (wpcf7mailsent) and IDs, which analytics reads; CF7 assets and the focus script
 * (assets/js/forms.js) load only on pages with this block (inc/assets-cleanup.php).
 */

$ccn_form     = (int) get_field( 'form' );
$ccn_heading  = get_field( 'heading' );
$ccn_intro    = get_field( 'intro' );
$ccn_contacts = (bool) get_field( 'show_contacts' );

if ( ! $ccn_form || 'wpcf7_contact_form' !== get_post_type( $ccn_form ) || 'publish' !== get_post_status( $ccn_form ) ) {
	if ( ! empty( $is_preview ) ) {
		echo '<p><em>' . esc_html__( 'Form card: choose a Contact Form 7 form in the block sidebar.', 'coin-container' ) . '</em></p>';
	}
	return;
}

$ccn_email   = $ccn_contacts ? ccn_setting( 'email' ) : '';
$ccn_tel     = $ccn_contacts ? ccn_phone_href() : '';
$ccn_address = $ccn_contacts ? ccn_setting( 'address' ) : '';
$ccn_contacts = $ccn_email || $ccn_tel || $ccn_address;
// Google Maps search URL (documented "api=1" format) from Site Settings: no
// embedded map, no third-party request before the visitor clicks.
$ccn_maps = $ccn_address ? 'https://www.google.com/maps/search/?api=1&query=' . rawurlencode( trim( ccn_setting( 'company_name' ) . ' ' . $ccn_address ) ) : '';
?>
<section class="ccn-form-card <?php echo esc_attr( ccn_section_classes() ); ?>" data-motion="reveal"<?php echo ! empty( $block['anchor'] ) ? ' id="' . esc_attr( $block['anchor'] ) . '"' : ''; ?>>
	<div class="ccn-form-card-inner ccn-container<?php echo $ccn_contacts ? ' has-contacts' : ''; ?>">
		<div class="ccn-form-card-box">
			<?php if ( $ccn_heading ) : ?>
				<h2 class="ccn-form-card-heading"><?php echo esc_html( $ccn_heading ); ?></h2>
			<?php endif; ?>
			<?php if ( $ccn_intro ) : ?>
				<p class="ccn-form-card-intro"><?php echo esc_html( $ccn_intro ); ?></p>
			<?php endif; ?>
			<?php echo do_shortcode( '[contact-form-7 id="' . $ccn_form . '"]' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Contact Form 7 renders and escapes its own form. ?>
		</div>
		<?php if ( $ccn_contacts ) : ?>
			<ul class="ccn-form-card-contacts">
				<?php if ( $ccn_email ) : ?>
					<li><strong><?php esc_html_e( 'E-Mail', 'coin-container' ); ?></strong><a href="<?php echo esc_url( 'mailto:' . $ccn_email ); ?>"><?php echo esc_html( $ccn_email ); ?></a></li>
				<?php endif; ?>
				<?php if ( $ccn_tel ) : ?>
					<li><strong><?php esc_html_e( 'Telefon', 'coin-container' ); ?></strong><a href="<?php echo esc_url( $ccn_tel ); ?>"><?php echo esc_html( ccn_setting( 'phone' ) ); ?></a></li>
				<?php endif; ?>
				<?php if ( $ccn_address ) : ?>
					<li><strong><?php esc_html_e( 'Adresse', 'coin-container' ); ?></strong><span><?php echo esc_html( $ccn_address ); ?></span><a href="<?php echo esc_url( $ccn_maps ); ?>" target="_blank" rel="noopener"><?php esc_html_e( 'Adresse auf Google Maps öffnen', 'coin-container' ); ?><span class="screen-reader-text"> <?php esc_html_e( '(öffnet in neuem Tab)', 'coin-container' ); ?></span></a></li>
				<?php endif; ?>
			</ul>
		<?php endif; ?>
	</div>
</section>
