<?php
/**
 * Block: Numbered list. Accent heading, optional intro and numbered items
 * (01, 02, …) — mirrors the "Ersatzteile für Seecontainer" section of the
 * original Containerzubehör page.
 */

$ccn_heading = get_field( 'heading' );
$ccn_accent  = get_field( 'heading_accent' );
$ccn_intro   = get_field( 'intro' );
$ccn_items   = get_field( 'items' );

if ( empty( $ccn_items ) ) {
	if ( ! empty( $is_preview ) ) {
		echo '<p><em>' . esc_html__( 'Numbered list: add items in the block sidebar.', 'coin-container' ) . '</em></p>';
	}
	return;
}
?>
<section class="ccn-numbered">
	<div class="ccn-numbered-inner">
		<?php if ( $ccn_heading || $ccn_accent ) : ?>
			<h2 class="ccn-numbered-heading">
				<?php echo esc_html( $ccn_heading ); ?>
				<?php if ( $ccn_accent ) : ?>
					<span class="ccn-accent-inline"><?php echo esc_html( $ccn_accent ); ?></span>
				<?php endif; ?>
			</h2>
		<?php endif; ?>
		<?php if ( $ccn_intro ) : ?>
			<p class="ccn-numbered-intro"><?php echo esc_html( $ccn_intro ); ?></p>
		<?php endif; ?>
		<ol class="ccn-numbered-list">
			<?php foreach ( $ccn_items as $ccn_item ) : ?>
				<li class="ccn-numbered-item">
					<span class="ccn-numbered-title"><?php echo esc_html( $ccn_item['title'] ?? '' ); ?></span>
					<?php if ( ! empty( $ccn_item['text'] ) ) : ?>
						<span class="ccn-numbered-text"><?php echo esc_html( $ccn_item['text'] ); ?></span>
					<?php endif; ?>
				</li>
			<?php endforeach; ?>
		</ol>
	</div>
</section>
