<?php
/**
 * Block: Text section. Optional photo, then an H2 with an inline yellow
 * accent, then rich text — mirrors the landing content sections of the
 * original (e.g. "Überlegen Sie, ob Sie einen Container kaufen ...").
 *
 * @var bool $is_preview True when rendered inside the editor.
 */

$ccn_img_id  = (int) get_field( 'image' );
$ccn_heading = get_field( 'heading' );
$ccn_accent  = get_field( 'heading_accent' );
$ccn_after   = get_field( 'heading_after' );
$ccn_text    = get_field( 'text' );

if ( ! empty( $is_preview ) && ! $ccn_heading && ! $ccn_text ) {
	echo '<p><em>' . esc_html__( 'Text section: add a heading or text in the block sidebar.', 'coin-container' ) . '</em></p>';
	return;
}
?>
<section class="ccn-text-section">
	<?php if ( $ccn_img_id ) : ?>
		<?php
		echo wp_get_attachment_image(
			$ccn_img_id,
			'large',
			false,
			array(
				'class'   => 'ccn-text-section-img',
				'loading' => 'lazy',
			)
		);
		?>
	<?php endif; ?>
	<?php if ( $ccn_heading || $ccn_accent ) : ?>
		<h2 class="ccn-text-section-heading">
			<?php echo esc_html( $ccn_heading ); ?>
			<?php if ( $ccn_accent ) : ?>
				<span class="ccn-accent-inline"><?php echo esc_html( $ccn_accent ); ?></span>
			<?php endif; ?>
			<?php echo esc_html( $ccn_after ); ?>
		</h2>
	<?php endif; ?>
	<?php if ( $ccn_text ) : ?>
		<div class="ccn-text-section-text rich-text"><?php echo wp_kses_post( $ccn_text ); ?></div>
	<?php endif; ?>
</section>
