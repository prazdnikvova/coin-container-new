<?php
/**
 * Block: Price table (T-56, DESIGN.md "Price table"): the price ranges of
 * Site Settings → Preise as the table of production's [coin_preise]
 * (transmax-child/functions.php, data in inc/preise.php): Größe, gebraucht,
 * One Way, fabrikneu; «ca. 850–1.200 €» per range, «auf Anfrage» without one;
 * «Stand: …» and the note underneath. «Sizes» works like the shortcode's
 * groesse attribute: the ticked sizes only, in Site Settings order; none
 * ticked = every row. The table scrolls sideways inside a labelled, focusable
 * region on narrow screens (no JS); the swipe hint shows only while the table
 * is wider than its box.
 */

$ccn_heading = (string) get_field( 'heading' );
$ccn_intro   = (string) get_field( 'intro' );
$ccn_sizes   = array_filter( array_map( 'strval', (array) get_field( 'sizes' ) ) );
$ccn_rows    = array();
foreach ( ccn_price_rows() as $ccn_row ) {
	if ( ! $ccn_sizes || in_array( (string) $ccn_row['size'], $ccn_sizes, true ) ) {
		$ccn_rows[] = $ccn_row;
	}
}

if ( ! $ccn_rows ) {
	if ( ! empty( $is_preview ) ) {
		echo '<p><em>' . esc_html__( 'Price table: no rows in Site Settings → Preise (or none of the ticked sizes).', 'coin-container' ) . '</em></p>';
	}
	return;
}

$ccn_stand   = (string) ccn_setting( 'price_stand' );
$ccn_note    = trim( (string) ccn_setting( 'price_footnote' ) );
$ccn_show    = false !== get_field( 'show_footnote' );
$ccn_id      = wp_unique_id( 'ccn-price-table-' );
$ccn_caption = '' !== $ccn_heading ? $ccn_heading : __( 'Preis-Richtwerte', 'coin-container' );
if ( '' === $ccn_heading && '' !== $ccn_stand ) {
	/* translators: %s: «Stand» of the prices, e.g. Oktober 2026. */
	$ccn_caption = sprintf( __( 'Preis-Richtwerte, Stand: %s', 'coin-container' ), $ccn_stand );
}
$ccn_columns = array(
	'used'   => __( 'gebraucht', 'coin-container' ),
	'oneway' => __( 'One Way', 'coin-container' ),
	'new'    => __( 'fabrikneu', 'coin-container' ),
);
?>
<section class="ccn-price-table ccn-section ccn-section--default" data-motion="reveal"<?php echo ! empty( $block['anchor'] ) ? ' id="' . esc_attr( $block['anchor'] ) . '"' : ''; ?>>
	<div class="ccn-price-table-inner ccn-container">
		<?php if ( '' !== $ccn_heading ) : ?>
			<h2 class="ccn-price-table-heading"><?php echo esc_html( $ccn_heading ); ?></h2>
		<?php endif; ?>
		<?php if ( '' !== $ccn_intro ) : ?>
			<p class="ccn-price-table-intro"><?php echo esc_html( $ccn_intro ); ?></p>
		<?php endif; ?>
		<div class="ccn-price-table-box">
			<div class="ccn-table-wrap" tabindex="0" role="region" aria-labelledby="<?php echo esc_attr( $ccn_id ); ?>">
				<table class="ccn-table">
					<caption id="<?php echo esc_attr( $ccn_id ); ?>" class="screen-reader-text"><?php echo esc_html( $ccn_caption ); ?></caption>
					<thead>
						<tr>
							<th scope="col"><?php esc_html_e( 'Größe', 'coin-container' ); ?></th>
							<?php foreach ( $ccn_columns as $ccn_label ) : ?>
								<th scope="col"><?php echo esc_html( $ccn_label ); ?></th>
							<?php endforeach; ?>
						</tr>
					</thead>
					<tbody>
						<?php foreach ( $ccn_rows as $ccn_row ) : ?>
							<tr>
								<th scope="row"><?php echo esc_html( $ccn_row['size'] ); ?><?php echo ! empty( $ccn_row['note'] ) ? '<span class="ccn-price-row-note">' . esc_html( $ccn_row['note'] ) . '</span>' : ''; ?></th>
								<?php foreach ( array_keys( $ccn_columns ) as $ccn_col ) : ?>
									<td><?php echo esc_html( ccn_price_range( $ccn_row[ $ccn_col . '_min' ] ?? '', $ccn_row[ $ccn_col . '_max' ] ?? '' ) ); ?></td>
								<?php endforeach; ?>
							</tr>
						<?php endforeach; ?>
					</tbody>
				</table>
			</div>
			<p class="ccn-table-hint" aria-hidden="true">&#8596; <?php esc_html_e( 'Tabelle nach links/rechts wischen', 'coin-container' ); ?></p>
		</div>
		<?php
		if ( $ccn_show && ( '' !== $ccn_stand || '' !== $ccn_note ) ) :
			/* translators: %s: «Stand» of the prices, e.g. Oktober 2026. */
			$ccn_line = trim( ( '' !== $ccn_stand ? sprintf( __( 'Stand: %s.', 'coin-container' ), $ccn_stand ) : '' ) . ' ' . $ccn_note );
			?>
			<p class="ccn-price-table-note"><?php echo esc_html( $ccn_line ); ?></p>
		<?php endif; ?>
	</div>
</section>
