<?php
/**
 * Block: CTA banner. Full-width photo with a dark overlay, the site logo,
 * a big white heading and a yellow uppercase button — mirrors the
 * "Hamburgs Partner für Containerlösungen" banner of the original.
 * Background is a lazy <img>: below the fold, never part of the LCP.
 */

$ccn_heading = get_field( 'heading' );
$ccn_text    = get_field( 'text' );
$ccn_btn_t   = get_field( 'button_text' );
$ccn_btn_u   = get_field( 'button_url' );
$ccn_img     = (int) get_field( 'image' );
$ccn_logo    = get_field( 'show_logo' );

if ( ! empty( $is_preview ) && ! $ccn_heading ) {
	echo '<p><em>' . esc_html__( 'CTA banner: add a heading in the block sidebar.', 'coin-container' ) . '</em></p>';
	return;
}
?>
<section class="ccn-cta">
	<?php
	if ( $ccn_img ) {
		echo wp_get_attachment_image( $ccn_img, 'ccn-hero', false, array( 'class' => 'ccn-cta-bg', 'loading' => 'lazy', 'sizes' => '100vw' ) );
	}
	?>
	<div class="ccn-cta-inner">
		<?php if ( $ccn_logo ) : ?>
			<img class="ccn-cta-logo" src="<?php echo esc_url( get_template_directory_uri() . '/assets/img/logo.webp' ); ?>" width="106" height="80" alt="" loading="lazy">
		<?php endif; ?>
		<?php if ( $ccn_heading ) : ?>
			<h2 class="ccn-cta-heading"><?php echo esc_html( $ccn_heading ); ?></h2>
		<?php endif; ?>
		<?php if ( $ccn_text ) : ?>
			<p class="ccn-cta-text"><?php echo esc_html( $ccn_text ); ?></p>
		<?php endif; ?>
		<?php if ( $ccn_btn_t && $ccn_btn_u ) : ?>
			<a class="btn btn-primary ccn-cta-btn" href="<?php echo esc_url( $ccn_btn_u ); ?>"><?php echo esc_html( $ccn_btn_t ); ?></a>
		<?php endif; ?>
	</div>
</section>
