<?php
/**
 * Section: plain text block (heading + rich text).
 */
?>
<section class="section section-text">
	<div class="section-inner section-inner-narrow">
		<?php if ( $ccn_h = get_sub_field( 'heading' ) ) : ?>
			<h2 class="section-heading"><?php echo esc_html( $ccn_h ); ?></h2>
		<?php endif; ?>
		<?php if ( $ccn_text = get_sub_field( 'text' ) ) : ?>
			<div class="rich-text"><?php echo wp_kses_post( $ccn_text ); ?></div>
		<?php endif; ?>
	</div>
</section>
