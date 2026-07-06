<?php
/**
 * Section: call to action banner.
 */
$ccn_btn_text = get_sub_field( 'button_text' );
$ccn_btn_url  = get_sub_field( 'button_url' );
?>
<section class="section section-cta">
	<div class="section-inner cta-inner">
		<?php if ( $ccn_h = get_sub_field( 'heading' ) ) : ?>
			<h2 class="cta-heading"><?php echo esc_html( $ccn_h ); ?></h2>
		<?php endif; ?>
		<?php if ( $ccn_text = get_sub_field( 'text' ) ) : ?>
			<p class="cta-text"><?php echo esc_html( $ccn_text ); ?></p>
		<?php endif; ?>
		<?php if ( $ccn_btn_text && $ccn_btn_url ) : ?>
			<a class="btn btn-primary" href="<?php echo esc_url( $ccn_btn_url ); ?>"><?php echo esc_html( $ccn_btn_text ); ?></a>
		<?php endif; ?>
	</div>
</section>
