<?php
/**
 * Block: Home hero. Background photo with a dark overlay, big left-aligned
 * heading, then the first-screen actions (T-47, DESIGN.md "Hero"): primary +
 * optional secondary button and the phone line (template-parts/hero-cta.php),
 * and the trust row (template-parts/trust-row.php) — on 360x800 all of it fits
 * the first screen. The image is the LCP element: preloaded in
 * ccn_preload_hero() and marked fetchpriority=high here. Never lazy-load
 * anything in this block.
 *
 * @var array $block      Block settings (anchor, etc.).
 * @var bool  $is_preview True when rendered inside the editor.
 */

$ccn_preview = ! empty( $is_preview );
$ccn_img_id  = (int) get_field( 'image' );
$ccn_title   = get_field( 'title' );
$ccn_sub     = get_field( 'subtitle' );
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
	// small variant. Soft '1536x1536' on purpose — a hard-cropped size would
	// leave srcset empty and ship the full file to phones. fetchpriority=high
	// backs up the preload in ccn_preload_hero(); the two point at the same
	// size so the browser reuses one request.
	if ( $ccn_img_id ) {
		echo wp_get_attachment_image(
			$ccn_img_id,
			'1536x1536',
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
	<div class="ccn-hero-inner ccn-container">
		<?php if ( $ccn_title ) : ?>
			<<?php echo $ccn_tag; // phpcs:ignore WordPress.Security.EscapeOutput -- fixed h1/h2. ?> class="ccn-hero-title"><?php echo esc_html( $ccn_title ); ?></<?php echo $ccn_tag; // phpcs:ignore WordPress.Security.EscapeOutput ?>>
		<?php endif; ?>
		<?php if ( $ccn_sub ) : ?>
			<p class="ccn-hero-subtitle"><?php echo esc_html( $ccn_sub ); ?></p>
		<?php endif; ?>
		<?php
		get_template_part(
			'template-parts/hero-cta',
			null,
			array(
				'primary_text'   => get_field( 'button_text' ),
				'primary_url'    => get_field( 'button_url' ),
				'secondary_text' => get_field( 'button2_text' ),
				'secondary_url'  => get_field( 'button2_url' ),
				'phone'          => (bool) get_field( 'show_phone' ),
			)
		);
		if ( get_field( 'show_trust' ) ) {
			get_template_part( 'template-parts/trust-row' );
		}
		?>
	</div>
</section>
