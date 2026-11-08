<?php
/**
 * Block: Logos (T-50, DESIGN.md "Logos", A6 C8): optional heading and a row of
 * partner / certificate logos (lazy images 40–48px high, grey until hover or
 * focus). Content only as on production: the AVPQ seal and the Logistik-Initiative
 * Hamburg logo of /ueber-uns/zertifikate/; further marks need the client's
 * permission (OPEN #72).
 */

$ccn_heading = get_field( 'heading' );
$ccn_items   = array_filter(
	(array) get_field( 'items' ),
	function ( $item ) {
		return is_array( $item ) && ! empty( $item['image'] ) && ! empty( $item['alt'] );
	}
);

if ( ! $ccn_items ) {
	if ( ! empty( $is_preview ) ) {
		echo '<p><em>' . esc_html__( 'Logos: add logos with alt text in the block sidebar.', 'coin-container' ) . '</em></p>';
	}
	return;
}
?>
<section class="ccn-logos ccn-section ccn-section--default" data-motion="reveal"<?php echo ! empty( $block['anchor'] ) ? ' id="' . esc_attr( $block['anchor'] ) . '"' : ''; ?>>
	<div class="ccn-logos-inner ccn-container">
		<?php if ( $ccn_heading ) : ?>
			<h2 class="section-heading"><?php echo esc_html( $ccn_heading ); ?></h2>
		<?php endif; ?>
		<ul class="ccn-logos-list">
			<?php foreach ( $ccn_items as $ccn_item ) : ?>
				<?php
				$ccn_img = wp_get_attachment_image(
					(int) $ccn_item['image'],
					'medium',
					false,
					array(
						'class'   => 'ccn-logo-img',
						'alt'     => $ccn_item['alt'],
						'loading' => 'lazy',
						'sizes'   => '200px',
					)
				);
				if ( ! $ccn_img ) {
					continue;
				}
				?>
				<li>
					<?php if ( ! empty( $ccn_item['url'] ) ) : ?>
						<a href="<?php echo esc_url( $ccn_item['url'] ); ?>"><?php echo $ccn_img; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- wp_get_attachment_image() escapes. ?></a>
					<?php else : ?>
						<?php echo $ccn_img; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- wp_get_attachment_image() escapes. ?>
					<?php endif; ?>
				</li>
			<?php endforeach; ?>
		</ul>
	</div>
</section>
