<?php
/**
 * Block: Trust bar (T-50, DESIGN.md "Trust", A6 C8). A section around the shared
 * trust row (template-parts/trust-row.php: Trustpilot, Google and the badge from
 * Site Settings → Vertrauen, the same chips as in the home hero) plus up to three
 * key facts that carry a source. No fields of its own: the chips have one source
 * of truth site-wide. Renders nothing when nothing is filled in. No requests:
 * marks are inline SVG, the badge prints as text (the badge image belongs to the
 * logos block, below the first screens).
 */

ob_start();
get_template_part( 'template-parts/trust-row' );
$ccn_chips = trim( (string) ob_get_clean() );

$ccn_facts = array();
foreach ( (array) ccn_setting( 'key_facts', array() ) as $ccn_fact ) {
	// A figure without a source is never shown (content rule: nothing invented).
	if ( is_array( $ccn_fact ) && isset( $ccn_fact['number'] ) && '' !== (string) $ccn_fact['number'] && ! empty( $ccn_fact['label'] ) && ! empty( $ccn_fact['source'] ) ) {
		$ccn_facts[] = $ccn_fact;
	}
}
$ccn_facts = array_slice( $ccn_facts, 0, 3 );

if ( '' === $ccn_chips && ! $ccn_facts ) {
	if ( ! empty( $is_preview ) ) {
		echo '<p><em>' . esc_html__( 'Trust bar: fill in Site Settings → Vertrauen.', 'coin-container' ) . '</em></p>';
	}
	return;
}
?>
<section class="ccn-trust-bar ccn-section ccn-section--default" data-motion="reveal"<?php echo ! empty( $block['anchor'] ) ? ' id="' . esc_attr( $block['anchor'] ) . '"' : ''; ?>>
	<div class="ccn-trust-bar-inner ccn-container">
		<?php echo $ccn_chips; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped in template-parts/trust-row.php. ?>
		<?php if ( $ccn_facts ) : ?>
			<ul class="ccn-trust-facts">
				<?php foreach ( $ccn_facts as $ccn_fact ) : ?>
					<?php $ccn_num = (float) $ccn_fact['number']; ?>
					<li><strong><?php echo esc_html( number_format_i18n( $ccn_num, floor( $ccn_num ) === $ccn_num ? 0 : 1 ) . ( $ccn_fact['suffix'] ?? '' ) ); ?></strong> <?php echo esc_html( $ccn_fact['label'] ); ?></li>
				<?php endforeach; ?>
			</ul>
		<?php endif; ?>
	</div>
</section>
