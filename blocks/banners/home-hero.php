<?php
/**
 * Block: Home hero. Full-viewport background photo, dark gradient overlay,
 * big left-aligned heading — mirrors the original coin-container.de hero.
 * This is the LCP element: the background is preloaded in ccn_preload_hero(),
 * never lazy-load anything here.
 *
 * @var array $block      Block settings (anchor, etc.).
 * @var bool  $is_preview True when rendered inside the editor.
 */

$ccn_preview = ! empty( $is_preview );
$ccn_img_id  = (int) get_field( 'image' );
$ccn_title   = get_field( 'title' );
$ccn_sub     = get_field( 'subtitle' );
$ccn_btn_t   = get_field( 'button_text' );
$ccn_btn_u   = get_field( 'button_url' );
$ccn_tag     = ( ! $ccn_preview && is_front_page() ) ? 'h1' : 'h2';

if ( $ccn_preview && ! $ccn_title && ! $ccn_img_id ) : ?>
	<p><em><?php esc_html_e( 'Home hero: pick a background image and a title in the block sidebar.', 'coin-container' ); ?></em></p>
	<?php
	return;
endif;
?>
<section class="ccn-hero"<?php echo ! empty( $block['anchor'] ) ? ' id="' . esc_attr( $block['anchor'] ) . '"' : ''; ?>>
	<?php
	// Responsive <img> instead of a CSS background: srcset lets mobile pull a
	// small variant, fetchpriority=high makes it the LCP without a preload.
	if ( $ccn_img_id ) {
		echo wp_get_attachment_image(
			$ccn_img_id,
			'ccn-hero',
			false,
			array(
				'class'         => 'ccn-hero-img',
				'sizes'         => '100vw',
				'loading'       => 'eager',
				'fetchpriority' => 'high',
			)
		);
	}
	?>
	<div class="ccn-hero-inner">
		<?php if ( $ccn_title ) : ?>
			<<?php echo $ccn_tag; // phpcs:ignore WordPress.Security.EscapeOutput -- fixed h1/h2. ?> class="ccn-hero-title"><?php echo esc_html( $ccn_title ); ?></<?php echo $ccn_tag; // phpcs:ignore WordPress.Security.EscapeOutput ?>>
		<?php endif; ?>
		<?php if ( $ccn_sub ) : ?>
			<p class="ccn-hero-subtitle"><?php echo esc_html( $ccn_sub ); ?></p>
		<?php endif; ?>
		<?php if ( $ccn_btn_t && $ccn_btn_u ) : ?>
			<a class="btn btn-primary ccn-hero-btn" href="<?php echo esc_url( $ccn_btn_u ); ?>"><?php echo esc_html( $ccn_btn_t ); ?></a>
		<?php endif; ?>
	</div>
</section>
