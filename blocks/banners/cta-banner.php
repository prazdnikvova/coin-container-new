<?php
/**
 * Block: CTA banner (T-48, DESIGN.md "Components" C9). Without a photo: a
 * solid yellow band with #202020 text, the heading, the optional text line and
 * two buttons — the block's own button (dark; falls back to Site Settings
 * hero_cta_text / anfrage_url) and the phone from Site Settings (secondary).
 * With a photo: the photo under a dark overlay (>= .6, white text >= 4.5:1 on
 * any photo), the optional logo, a yellow button and a white outlined phone
 * button. One CTA banner per page. The photo is a lazy <img>: below the fold,
 * never part of the LCP.
 */

$ccn_heading = get_field( 'heading' );
$ccn_text    = get_field( 'text' );
$ccn_btn_t   = (string) get_field( 'button_text' );
$ccn_btn_u   = (string) get_field( 'button_url' );
$ccn_img     = (int) get_field( 'image' );
$ccn_logo    = get_field( 'show_logo' );
$ccn_tel     = ccn_phone_href();

if ( ! empty( $is_preview ) && ! $ccn_heading ) {
	echo '<p><em>' . esc_html__( 'CTA banner: add a heading in the block sidebar.', 'coin-container' ) . '</em></p>';
	return;
}
if ( ! $ccn_btn_t || ! $ccn_btn_u ) {
	$ccn_btn_t = (string) ccn_setting( 'hero_cta_text' );
	$ccn_btn_u = (string) ccn_setting( 'anfrage_url' );
}
?>
<section class="ccn-cta ccn-section <?php echo $ccn_img ? 'ccn-cta--photo' : 'ccn-cta--band'; ?>" data-motion="reveal"<?php echo ! empty( $block['anchor'] ) ? ' id="' . esc_attr( $block['anchor'] ) . '"' : ''; ?>>
	<?php
	if ( $ccn_img ) {
		// Soft size, not a hard crop: keeps srcset populated so phones pull a
		// small variant. Cropping is done by object-fit: cover on .ccn-cta-bg.
		echo wp_get_attachment_image( $ccn_img, '1536x1536', false, array( 'class' => 'ccn-cta-bg', 'loading' => 'lazy', 'sizes' => '100vw' ) );
	}
	?>
	<div class="ccn-cta-inner ccn-container">
		<?php if ( $ccn_logo && $ccn_img ) : ?>
			<img class="ccn-cta-logo" src="<?php echo esc_url( get_template_directory_uri() . '/assets/img/logo.webp' ); ?>" width="106" height="80" alt="" loading="lazy">
		<?php endif; ?>
		<?php if ( $ccn_heading ) : ?>
			<h2 class="ccn-cta-heading"><?php echo esc_html( $ccn_heading ); ?></h2>
		<?php endif; ?>
		<?php if ( $ccn_text ) : ?>
			<p class="ccn-cta-text"><?php echo esc_html( $ccn_text ); ?></p>
		<?php endif; ?>
		<?php if ( ( $ccn_btn_t && $ccn_btn_u ) || $ccn_tel ) : ?>
			<div class="ccn-cta-actions">
				<?php if ( $ccn_btn_t && $ccn_btn_u ) : ?>
					<a class="btn <?php echo $ccn_img ? 'btn-primary' : 'btn-dark'; ?>" href="<?php echo esc_url( $ccn_btn_u ); ?>"><?php echo esc_html( $ccn_btn_t ); ?></a>
				<?php endif; ?>
				<?php if ( $ccn_tel ) : ?>
					<a class="btn <?php echo $ccn_img ? 'btn-outline-light' : 'btn-secondary'; ?>" href="<?php echo esc_url( $ccn_tel ); ?>"><?php echo ccn_phone_icon( 18 ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static SVG. ?><?php echo esc_html( ccn_setting( 'phone' ) ); ?></a>
				<?php endif; ?>
			</div>
		<?php endif; ?>
	</div>
</section>
