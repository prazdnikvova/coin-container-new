<?php
/**
 * Section: hero. LCP image — eager, high priority, no lazy.
 */
$ccn_img_id = get_sub_field( 'image' );
$ccn_bg     = $ccn_img_id ? wp_get_attachment_image_url( $ccn_img_id, 'full' ) : '';
?>
<section class="section section-hero"<?php echo $ccn_bg ? ' style="background-image:url(' . esc_url( $ccn_bg ) . ')"' : ''; ?>>
	<div class="section-inner hero-inner">
		<?php if ( $ccn_title = get_sub_field( 'title' ) ) : ?>
			<h1 class="hero-title"><?php echo esc_html( $ccn_title ); ?></h1>
		<?php endif; ?>
		<?php if ( $ccn_sub = get_sub_field( 'subtitle' ) ) : ?>
			<p class="hero-subtitle"><?php echo esc_html( $ccn_sub ); ?></p>
		<?php endif; ?>
		<?php
		$ccn_btn_text = get_sub_field( 'button_text' );
		$ccn_btn_url  = get_sub_field( 'button_url' );
		if ( $ccn_btn_text && $ccn_btn_url ) :
			?>
			<a class="btn btn-primary hero-btn" href="<?php echo esc_url( $ccn_btn_url ); ?>"><?php echo esc_html( $ccn_btn_text ); ?></a>
		<?php endif; ?>
	</div>
</section>
