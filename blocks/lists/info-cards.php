<?php
/**
 * Block: Info cards. White cards in a grid — photo, title, text — mirrors
 * the Twist Locks / Bridge Fittings / Stacking Cone trio of the original
 * Containerzubehör page. The optional heading renders as the section h2
 * above the grid, so the h3 card titles never follow the page h1 directly.
 */

$ccn_heading = get_field( 'heading' );
$ccn_cards   = get_field( 'cards' );

if ( empty( $ccn_cards ) ) {
	if ( ! empty( $is_preview ) ) {
		echo '<p><em>' . esc_html__( 'Info cards: add cards in the block sidebar.', 'coin-container' ) . '</em></p>';
	}
	return;
}
?>
<section class="ccn-info-cards" data-motion="reveal"<?php echo ! empty( $block['anchor'] ) ? ' id="' . esc_attr( $block['anchor'] ) . '"' : ''; ?>>
	<?php if ( $ccn_heading ) : ?>
		<div class="section-inner ccn-container">
			<h2 class="section-heading"><?php echo esc_html( $ccn_heading ); ?></h2>
		</div>
	<?php endif; ?>
	<div class="ccn-info-cards-inner ccn-container" data-motion-stagger>
		<?php foreach ( $ccn_cards as $ccn_card ) : ?>
			<div class="ccn-info-card ccn-card">
				<?php if ( ! empty( $ccn_card['image'] ) ) : ?>
					<?php echo wp_get_attachment_image( (int) $ccn_card['image'], 'medium', false, array( 'class' => 'ccn-info-card-img', 'loading' => 'lazy' ) ); ?>
				<?php endif; ?>
				<?php if ( ! empty( $ccn_card['title'] ) ) : ?>
					<h3 class="ccn-info-card-title"><?php echo esc_html( $ccn_card['title'] ); ?></h3>
				<?php endif; ?>
				<?php if ( ! empty( $ccn_card['text'] ) ) : ?>
					<div class="ccn-info-card-text rich-text"><?php echo wp_kses_post( $ccn_card['text'] ); ?></div>
				<?php endif; ?>
			</div>
		<?php endforeach; ?>
	</div>
</section>
