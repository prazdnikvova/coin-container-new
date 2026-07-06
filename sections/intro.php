<?php
/**
 * Section: intro (heading + rich text + optional image + button).
 */
$ccn_img_id = get_sub_field( 'image' );
?>
<section class="section section-intro">
	<div class="section-inner intro-inner<?php echo $ccn_img_id ? ' has-image' : ''; ?>">
		<div class="intro-body">
			<?php if ( $ccn_h = get_sub_field( 'heading' ) ) : ?>
				<h2 class="section-heading"><?php echo esc_html( $ccn_h ); ?></h2>
			<?php endif; ?>
			<?php if ( $ccn_sub = get_sub_field( 'subheading' ) ) : ?>
				<p class="intro-subheading"><?php echo esc_html( $ccn_sub ); ?></p>
			<?php endif; ?>
			<?php if ( $ccn_text = get_sub_field( 'text' ) ) : ?>
				<div class="intro-text"><?php echo wp_kses_post( $ccn_text ); ?></div>
			<?php endif; ?>
			<?php
			$ccn_btn_text = get_sub_field( 'button_text' );
			$ccn_btn_url  = get_sub_field( 'button_url' );
			if ( $ccn_btn_text && $ccn_btn_url ) :
				?>
				<a class="btn btn-primary" href="<?php echo esc_url( $ccn_btn_url ); ?>"><?php echo esc_html( $ccn_btn_text ); ?></a>
			<?php endif; ?>
		</div>
		<?php if ( $ccn_img_id ) : ?>
			<div class="intro-media">
				<?php echo wp_get_attachment_image( $ccn_img_id, 'large', false, array( 'loading' => 'lazy' ) ); ?>
			</div>
		<?php endif; ?>
	</div>
</section>
