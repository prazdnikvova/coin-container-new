<?php
/**
 * Block: Related links (T-56, DESIGN.md "Related links"): hand-picked pages,
 * posts or products (at most six) as link cards under a heading, default
 * «Verwandte Leistungen» as on the production hubs (transmax-child/functions.php,
 * hub -> spoke boxes printed through the_content). Optional excerpt of 120
 * characters (manual excerpt or the text of the content, never rendered).
 * Renders nothing without a published link; the current page is skipped.
 */

$ccn_links = array();
foreach ( array_slice( array_unique( array_map( 'absint', (array) get_field( 'links' ) ) ), 0, 6 ) as $ccn_link_id ) {
	if ( $ccn_link_id && get_queried_object_id() !== $ccn_link_id && 'publish' === get_post_status( $ccn_link_id ) ) {
		$ccn_links[] = $ccn_link_id;
	}
}

if ( ! $ccn_links ) {
	if ( ! empty( $is_preview ) ) {
		echo '<p><em>' . esc_html__( 'Related links: pick up to six pages, posts or products in the block sidebar.', 'coin-container' ) . '</em></p>';
	}
	return;
}

$ccn_heading = (string) get_field( 'heading' );
$ccn_heading = '' !== trim( $ccn_heading ) ? $ccn_heading : __( 'Verwandte Leistungen', 'coin-container' );
$ccn_excerpt = (bool) get_field( 'show_excerpt' );
$ccn_id      = wp_unique_id( 'ccn-related-links-' );
?>
<section class="ccn-related-links ccn-section ccn-section--default" data-motion="reveal"<?php echo ! empty( $block['anchor'] ) ? ' id="' . esc_attr( $block['anchor'] ) . '"' : ''; ?>>
	<div class="ccn-related-links-inner ccn-container">
		<nav aria-labelledby="<?php echo esc_attr( $ccn_id ); ?>">
			<h2 id="<?php echo esc_attr( $ccn_id ); ?>" class="ccn-related-links-heading"><?php echo esc_html( $ccn_heading ); ?></h2>
			<ul class="ccn-related-list" data-motion-stagger>
				<?php foreach ( $ccn_links as $ccn_link_id ) : ?>
					<?php $ccn_text = $ccn_excerpt ? ccn_card_excerpt( $ccn_link_id ) : ''; ?>
					<li class="ccn-related-card ccn-card">
						<h3 class="ccn-related-card-title"><a class="ccn-related-card-link" href="<?php echo esc_url( get_permalink( $ccn_link_id ) ); ?>"><?php echo esc_html( wp_strip_all_tags( get_the_title( $ccn_link_id ) ) ); ?></a></h3>
						<?php if ( '' !== $ccn_text ) : ?>
							<p class="ccn-related-card-excerpt"><?php echo esc_html( $ccn_text ); ?></p>
						<?php endif; ?>
					</li>
				<?php endforeach; ?>
			</ul>
		</nav>
	</div>
</section>
