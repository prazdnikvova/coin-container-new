<?php
/**
 * Block: Gallery rail (T-53b, DESIGN.md "Gallery rail"). Photos in one
 * horizontal scroll-snap row (.ccn-rail, T-46) with ‹ › buttons: the image
 * carousels, galleries and portfolio sliders of the old site, without
 * autoplay and without a library. An optional heading (h2) and text sit
 * above the row (the project rows of /container-projekte-referenzen/). The
 * row is a focusable list named by the heading, so it also scrolls with the
 * arrow keys. Styles: assets/css/gallery-rail.css, loaded with the block only.
 *
 * @var array $block      Block settings (anchor).
 * @var bool  $is_preview True when rendered inside the editor.
 */

$ccn_heading = (string) get_field( 'heading' );
$ccn_text    = (string) get_field( 'text' );
$ccn_images  = array();
foreach ( (array) get_field( 'images' ) as $ccn_row ) {
	if ( ! empty( $ccn_row['image'] ) && wp_attachment_is_image( (int) $ccn_row['image'] ) ) {
		$ccn_images[] = $ccn_row;
	}
}

if ( ! $ccn_images ) {
	if ( ! empty( $is_preview ) ) {
		echo '<p><em>' . esc_html__( 'Gallery rail: add images in the block sidebar.', 'coin-container' ) . '</em></p>';
	}
	return;
}

$ccn_rail  = wp_unique_id( 'ccn-gallery-rail-' );
$ccn_title = $ccn_rail . '-title';
?>
<section class="ccn-gallery-rail <?php echo esc_attr( ccn_section_classes() ); ?>" data-motion="reveal"<?php echo ! empty( $block['anchor'] ) ? ' id="' . esc_attr( $block['anchor'] ) . '"' : ''; ?>>
	<div class="ccn-gallery-rail-inner ccn-container">
		<?php if ( '' !== $ccn_heading ) : ?>
			<h2 id="<?php echo esc_attr( $ccn_title ); ?>" class="ccn-gallery-rail-heading"><?php echo esc_html( $ccn_heading ); ?></h2>
		<?php endif; ?>
		<?php if ( '' !== trim( wp_strip_all_tags( $ccn_text ) ) ) : ?>
			<div class="ccn-gallery-rail-text rich-text"><?php echo wp_kses_post( $ccn_text ); ?></div>
		<?php endif; ?>
		<?php // The list is the scroll container: focusable for the arrow keys, named by the heading (or a label of its own). ?>
		<ul id="<?php echo esc_attr( $ccn_rail ); ?>" class="ccn-gallery-rail-list ccn-rail" role="list" tabindex="0"
			<?php if ( '' !== $ccn_heading ) : ?>
				aria-labelledby="<?php echo esc_attr( $ccn_title ); ?>"
			<?php else : ?>
				aria-label="<?php esc_attr_e( 'Bildergalerie', 'coin-container' ); ?>"
			<?php endif; ?>>
			<?php
			foreach ( $ccn_images as $ccn_row ) :
				$ccn_img = wp_get_attachment_image(
					(int) $ccn_row['image'],
					'medium_large',
					false,
					array(
						'loading' => 'lazy',
						'sizes'   => '(max-width: 575px) 85vw, 320px',
					)
				);
				// A figure only around a captioned photo: a project page holds 80+ photos (DOM budget < 800 nodes).
				?>
				<li class="ccn-gallery-rail-item">
					<?php if ( ! empty( $ccn_row['caption'] ) ) : ?>
						<figure><?php echo $ccn_img; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- core image markup. ?><figcaption><?php echo esc_html( $ccn_row['caption'] ); ?></figcaption></figure>
					<?php else : ?>
						<?php echo $ccn_img; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- core image markup. ?>
					<?php endif; ?>
				</li>
			<?php endforeach; ?>
		</ul>
		<?php if ( count( $ccn_images ) > 1 ) : ?>
			<?php // Icon-only buttons named by screen-reader text (README "Markup standard"); invisible but space-keeping until main.js wires them. ?>
			<div class="ccn-rail-nav">
				<button type="button" class="ccn-rail-btn" data-dir="-1" aria-controls="<?php echo esc_attr( $ccn_rail ); ?>"><span aria-hidden="true">‹</span><span class="screen-reader-text"><?php esc_html_e( 'Zurück', 'coin-container' ); ?></span></button>
				<button type="button" class="ccn-rail-btn" data-dir="1" aria-controls="<?php echo esc_attr( $ccn_rail ); ?>"><span aria-hidden="true">›</span><span class="screen-reader-text"><?php esc_html_e( 'Weiter', 'coin-container' ); ?></span></button>
			</div>
		<?php endif; ?>
	</div>
</section>
