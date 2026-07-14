<?php
/**
 * Block: Intro. Two-line heading with a yellow accent line, bold subheading,
 * body text on the left and a dark CTA button on the right — mirrors the
 * "Container kaufen & mieten" section of the original.
 */

$ccn_heading = get_field( 'heading' );
$ccn_accent  = get_field( 'heading_accent' );
$ccn_sub     = get_field( 'subheading' );
$ccn_text    = get_field( 'text' );
$ccn_btn_t   = get_field( 'button_text' );
$ccn_btn_u   = get_field( 'button_url' );

if ( ! empty( $is_preview ) && ! $ccn_heading ) {
	echo '<p><em>' . esc_html__( 'Intro: add a heading in the block sidebar.', 'coin-container' ) . '</em></p>';
	return;
}
?>
<section class="ccn-intro">
	<div class="ccn-intro-inner">
		<div class="ccn-intro-body">
			<?php if ( $ccn_heading ) : ?>
				<h2 class="ccn-intro-heading">
					<?php echo esc_html( $ccn_heading ); ?>
					<?php if ( $ccn_accent ) : ?>
						<span class="ccn-accent"><?php echo esc_html( $ccn_accent ); ?></span>
					<?php endif; ?>
				</h2>
			<?php endif; ?>
			<?php if ( $ccn_sub ) : ?>
				<p class="ccn-intro-subheading"><?php echo esc_html( $ccn_sub ); ?></p>
			<?php endif; ?>
			<?php if ( $ccn_text ) : ?>
				<div class="ccn-intro-text rich-text"><?php echo wp_kses_post( $ccn_text ); ?></div>
			<?php endif; ?>
		</div>
		<?php if ( $ccn_btn_t && $ccn_btn_u ) : ?>
			<div class="ccn-intro-action">
				<a class="btn btn-dark" href="<?php echo esc_url( $ccn_btn_u ); ?>"><?php echo esc_html( $ccn_btn_t ); ?></a>
			</div>
		<?php endif; ?>
	</div>
</section>
