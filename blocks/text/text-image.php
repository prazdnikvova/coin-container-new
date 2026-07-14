<?php
/**
 * Block: Text + image. Heading, body text, bold highlight line and a light
 * CTA button on the left; a two-photo collage on the right — mirrors the
 * "Schiffscontainer kaufen" section of the original.
 */

$ccn_heading = get_field( 'heading' );
$ccn_text    = get_field( 'text' );
$ccn_high    = get_field( 'highlight' );
$ccn_btn_t   = get_field( 'button_text' );
$ccn_btn_u   = get_field( 'button_url' );
$ccn_img1    = (int) get_field( 'image_1' );
$ccn_img2    = (int) get_field( 'image_2' );

if ( ! empty( $is_preview ) && ! $ccn_heading ) {
	echo '<p><em>' . esc_html__( 'Text + image: add a heading in the block sidebar.', 'coin-container' ) . '</em></p>';
	return;
}
?>
<section class="ccn-text-image">
	<div class="ccn-text-image-inner">
		<div class="ccn-text-image-body">
			<?php if ( $ccn_heading ) : ?>
				<h2 class="ccn-text-image-heading"><?php echo esc_html( $ccn_heading ); ?></h2>
			<?php endif; ?>
			<?php if ( $ccn_text ) : ?>
				<div class="rich-text ccn-text-image-text"><?php echo wp_kses_post( $ccn_text ); ?></div>
			<?php endif; ?>
			<?php if ( $ccn_high ) : ?>
				<p class="ccn-text-image-highlight"><?php echo esc_html( $ccn_high ); ?></p>
			<?php endif; ?>
			<?php if ( $ccn_btn_t && $ccn_btn_u ) : ?>
				<a class="btn btn-light" href="<?php echo esc_url( $ccn_btn_u ); ?>"><?php echo esc_html( $ccn_btn_t ); ?></a>
			<?php endif; ?>
		</div>
		<?php if ( $ccn_img1 || $ccn_img2 ) : ?>
			<div class="ccn-text-image-media">
				<?php
				if ( $ccn_img1 ) {
					echo wp_get_attachment_image( $ccn_img1, 'large', false, array( 'class' => 'ccn-text-image-photo is-first', 'loading' => 'lazy' ) );
				}
				if ( $ccn_img2 ) {
					echo wp_get_attachment_image( $ccn_img2, 'medium_large', false, array( 'class' => 'ccn-text-image-photo is-second', 'loading' => 'lazy' ) );
				}
				?>
			</div>
		<?php endif; ?>
	</div>
</section>
