<?php
/**
 * Section: stats counters. Numbers are plain text (no JS animation needed —
 * keeps the section render-cost at zero and avoids CLS).
 */
?>
<section class="section section-stats">
	<div class="section-inner">
		<?php if ( $ccn_h = get_sub_field( 'heading' ) ) : ?>
			<h2 class="section-heading"><?php echo esc_html( $ccn_h ); ?></h2>
		<?php endif; ?>
		<?php if ( $ccn_sub = get_sub_field( 'subtitle' ) ) : ?>
			<p class="section-intro"><?php echo esc_html( $ccn_sub ); ?></p>
		<?php endif; ?>
		<?php if ( have_rows( 'items' ) ) : ?>
			<div class="stats-grid">
				<?php while ( have_rows( 'items' ) ) : the_row(); ?>
					<div class="stat">
						<span class="stat-number"><?php echo esc_html( get_sub_field( 'number' ) ); ?><span class="stat-suffix"><?php echo esc_html( get_sub_field( 'suffix' ) ); ?></span></span>
						<span class="stat-label"><?php echo esc_html( get_sub_field( 'label' ) ); ?></span>
					</div>
				<?php endwhile; ?>
			</div>
		<?php endif; ?>
	</div>
</section>
