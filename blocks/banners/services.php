<?php
/**
 * Block: Services strip. Accent heading + intro, then a full-width photo
 * strip with numbered columns (01-04); each column reveals its text on
 * hover, like the original. The photo is a lazy <img> — the strip sits
 * below the fold and must never join the LCP request chain.
 */

$ccn_heading = get_field( 'heading' );
$ccn_accent  = get_field( 'heading_accent' );
$ccn_intro   = get_field( 'intro' );
$ccn_img     = (int) get_field( 'image' );

if ( ! empty( $is_preview ) && ! $ccn_heading && ! have_rows( 'items' ) ) {
	echo '<p><em>' . esc_html__( 'Services: add a heading and items in the block sidebar.', 'coin-container' ) . '</em></p>';
	return;
}
?>
<section class="ccn-services">
	<div class="ccn-services-head">
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
		<div class="ccn-services-strip">
			<?php
			if ( $ccn_img ) {
				echo wp_get_attachment_image( $ccn_img, 'ccn-hero', false, array( 'class' => 'ccn-services-bg', 'loading' => 'lazy', 'sizes' => '100vw' ) );
			}
			?>
			<div class="ccn-services-grid">
				<?php while ( have_rows( 'items' ) ) : the_row(); ?>
					<div class="ccn-service">
						<?php if ( $ccn_num = get_sub_field( 'number' ) ) : ?>
							<span class="ccn-service-number"><?php echo esc_html( $ccn_num ); ?></span>
						<?php endif; ?>
						<?php if ( $ccn_title = get_sub_field( 'title' ) ) : ?>
							<h3 class="ccn-service-title"><?php echo esc_html( $ccn_title ); ?></h3>
						<?php endif; ?>
						<?php if ( $ccn_item_text = get_sub_field( 'text' ) ) : ?>
							<p class="ccn-service-text"><?php echo esc_html( $ccn_item_text ); ?></p>
						<?php endif; ?>
					</div>
				<?php endwhile; ?>
			</div>
		</div>
	<?php endif; ?>
</section>
