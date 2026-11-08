<?php
/**
 * Block: Services. Accent heading + intro, then one card per service (icon,
 * title, text) on a light grey band (T-48, DESIGN.md "Components" C4). The
 * text is always visible (no hover-only content); the numbers 01-04 of the
 * original are not printed (they carry no sequence) and the strip photo is no
 * longer used as a texture behind text (A6 §6.5). Both fields stay in ACF for
 * old content.
 */

$ccn_heading = get_field( 'heading' );
$ccn_accent  = get_field( 'heading_accent' );
$ccn_intro   = get_field( 'intro' );

if ( ! empty( $is_preview ) && ! $ccn_heading && ! have_rows( 'items' ) ) {
	echo '<p><em>' . esc_html__( 'Services: add a heading and items in the block sidebar.', 'coin-container' ) . '</em></p>';
	return;
}
?>
<section class="ccn-services ccn-section" data-motion="reveal"<?php echo ! empty( $block['anchor'] ) ? ' id="' . esc_attr( $block['anchor'] ) . '"' : ''; ?>>
	<div class="ccn-services-head ccn-container">
		<?php if ( $ccn_heading ) : ?>
			<h2 class="ccn-services-heading">
				<?php echo esc_html( $ccn_heading ); ?>
				<?php if ( $ccn_accent ) : ?>
					<span class="ccn-accent-inline"><?php echo esc_html( $ccn_accent ); ?></span>
				<?php endif; ?>
			</h2>
		<?php endif; ?>
		<?php if ( $ccn_intro ) : ?>
			<p class="ccn-services-intro"><?php echo esc_html( $ccn_intro ); ?></p>
		<?php endif; ?>
	</div>
	<?php if ( have_rows( 'items' ) ) : ?>
		<div class="ccn-services-grid ccn-container" data-motion-stagger>
			<?php
			while ( have_rows( 'items' ) ) :
				the_row();
				$ccn_icon = (string) get_sub_field( 'icon' );
				?>
				<div class="ccn-service ccn-card">
					<span class="ccn-service-icon"><?php echo ccn_icon( $ccn_icon ? $ccn_icon : 'container', 24 ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static SVG. ?></span>
					<?php if ( $ccn_title = get_sub_field( 'title' ) ) : ?>
						<h3 class="ccn-service-title"><?php echo esc_html( $ccn_title ); ?></h3>
					<?php endif; ?>
					<?php if ( $ccn_item_text = get_sub_field( 'text' ) ) : ?>
						<p class="ccn-service-text"><?php echo esc_html( $ccn_item_text ); ?></p>
					<?php endif; ?>
				</div>
			<?php endwhile; ?>
		</div>
	<?php endif; ?>
</section>
