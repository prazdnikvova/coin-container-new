<?php
/**
 * Block: Stats. Centered accent heading + subtitle and a row of animated
 * counters (vanilla JS in main.js counts .ccn-stat-number up on scroll).
 */

$ccn_heading = get_field( 'heading' );
$ccn_accent  = get_field( 'heading_accent' );
$ccn_sub     = get_field( 'subtitle' );

if ( ! empty( $is_preview ) && ! $ccn_heading && ! have_rows( 'items' ) ) {
	echo '<p><em>' . esc_html__( 'Stats: add a heading and counters in the block sidebar.', 'coin-container' ) . '</em></p>';
	return;
}
?>
<section class="ccn-stats">
	<div class="ccn-stats-inner">
		<?php if ( $ccn_heading ) : ?>
			<h2 class="ccn-stats-heading">
				<?php echo esc_html( $ccn_heading ); ?>
				<?php if ( $ccn_accent ) : ?>
					<span class="ccn-accent-inline"><?php echo esc_html( $ccn_accent ); ?></span>
				<?php endif; ?>
			</h2>
		<?php endif; ?>
		<?php if ( $ccn_sub ) : ?>
			<p class="ccn-stats-subtitle"><?php echo esc_html( $ccn_sub ); ?></p>
		<?php endif; ?>
		<?php if ( have_rows( 'items' ) ) : ?>
			<div class="ccn-stats-grid">
				<?php while ( have_rows( 'items' ) ) : the_row(); ?>
					<div class="ccn-stat">
						<span class="ccn-stat-number" data-target="<?php echo esc_attr( (string) (int) get_sub_field( 'number' ) ); ?>" data-suffix="<?php echo esc_attr( (string) get_sub_field( 'suffix' ) ); ?>">
							<?php echo esc_html( (int) get_sub_field( 'number' ) . get_sub_field( 'suffix' ) ); ?>
						</span>
						<span class="ccn-stat-label"><?php echo esc_html( (string) get_sub_field( 'label' ) ); ?></span>
					</div>
				<?php endwhile; ?>
			</div>
		<?php endif; ?>
	</div>
</section>
