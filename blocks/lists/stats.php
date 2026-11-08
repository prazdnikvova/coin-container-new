<?php
/**
 * Block: Stats. Centered accent heading + subtitle and a row of counters.
 * The final number is in the HTML (no JS, reduced motion, crawlers); main.js
 * counts .ccn-stat-number[data-target] up from 0 when the grid is revealed
 * (T-46). data-target is machine format ("4.8"), the text German ("4,8").
 */

$ccn_heading = get_field( 'heading' );
$ccn_accent  = get_field( 'heading_accent' );
$ccn_sub     = get_field( 'subtitle' );

if ( ! empty( $is_preview ) && ! $ccn_heading && ! have_rows( 'items' ) ) {
	echo '<p><em>' . esc_html__( 'Stats: add a heading and counters in the block sidebar.', 'coin-container' ) . '</em></p>';
	return;
}
?>
<section class="ccn-stats" data-motion="reveal"<?php echo ! empty( $block['anchor'] ) ? ' id="' . esc_attr( $block['anchor'] ) . '"' : ''; ?>>
	<div class="ccn-stats-inner ccn-container">
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
			<div class="ccn-stats-grid" data-motion-stagger>
				<?php
				while ( have_rows( 'items' ) ) :
					the_row();
					// 4.8 and "4,8" alike; decimals are kept, never cut to an integer.
					$ccn_raw = str_replace( ',', '.', trim( (string) get_sub_field( 'number' ) ) );
					$ccn_num = is_numeric( $ccn_raw ) ? (float) $ccn_raw : 0;
					$ccn_dot = strrchr( $ccn_raw, '.' );
					$ccn_dec = $ccn_dot ? strlen( $ccn_dot ) - 1 : 0;
					$ccn_suf = (string) get_sub_field( 'suffix' );
					?>
					<div class="ccn-stat">
						<span class="ccn-stat-number" data-target="<?php echo esc_attr( number_format( $ccn_num, $ccn_dec, '.', '' ) ); ?>" data-suffix="<?php echo esc_attr( $ccn_suf ); ?>"><?php echo esc_html( number_format_i18n( $ccn_num, $ccn_dec ) . $ccn_suf ); ?></span>
						<span class="ccn-stat-label"><?php echo esc_html( (string) get_sub_field( 'label' ) ); ?></span>
					</div>
				<?php endwhile; ?>
			</div>
		<?php endif; ?>
	</div>
</section>
