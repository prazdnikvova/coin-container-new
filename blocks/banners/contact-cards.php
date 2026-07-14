<?php
/**
 * Block: Contact cards. Three cards right under the hero (email / phone /
 * address), pulled from Site Settings — the block has no fields of its own.
 * The middle (phone) card is dark, like the original.
 */

$ccn_email   = ccn_setting( 'email' );
$ccn_phone   = ccn_setting( 'phone' );
$ccn_address = ccn_setting( 'address' );

if ( ! $ccn_email && ! $ccn_phone && ! $ccn_address ) {
	if ( ! empty( $is_preview ) ) {
		echo '<p><em>' . esc_html__( 'Contact cards: fill email, phone and address in Site Settings.', 'coin-container' ) . '</em></p>';
	}
	return;
}
?>
<section class="ccn-contact-cards">
	<div class="ccn-contact-cards-inner">
		<?php if ( $ccn_email ) : ?>
			<div class="ccn-contact-card">
				<svg class="ccn-icon" width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 4-8 5-8-5V6l8 5 8-5v2Z"/></svg>
				<span class="ccn-contact-card-label"><?php esc_html_e( 'E-Mail', 'coin-container' ); ?></span>
				<a href="mailto:<?php echo esc_attr( $ccn_email ); ?>"><?php echo esc_html( $ccn_email ); ?></a>
			</div>
		<?php endif; ?>
		<?php if ( $ccn_phone ) : ?>
			<div class="ccn-contact-card is-dark">
				<svg class="ccn-icon" width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24 11.36 11.36 0 0 0 3.57.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1.02l-2.2 2.2Z"/></svg>
				<span class="ccn-contact-card-label"><?php esc_html_e( 'Telefon', 'coin-container' ); ?></span>
				<a href="tel:<?php echo esc_attr( preg_replace( '/[^0-9+]/', '', $ccn_phone ) ); ?>"><?php echo esc_html( $ccn_phone ); ?></a>
			</div>
		<?php endif; ?>
		<?php if ( $ccn_address ) : ?>
			<div class="ccn-contact-card">
				<svg class="ccn-icon" width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z"/></svg>
				<span class="ccn-contact-card-label"><?php esc_html_e( 'Adresse', 'coin-container' ); ?></span>
				<span><?php echo esc_html( $ccn_address ); ?></span>
			</div>
		<?php endif; ?>
	</div>
</section>
