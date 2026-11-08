<?php
/**
 * Block: FAQ (T-50, DESIGN.md "FAQ"): heading, optional intro and question/answer
 * pairs as native <details> (keyboard and screen readers without JavaScript).
 * Mirrors the «Häufige Fragen …» sections of production (hub and landing pages).
 * Answers keep a small set of tags (paragraphs, links, lists, bold). The JSON-LD
 * for these pairs is built in inc/schema.php from the stored blocks, switched by
 * Site Settings → Schema (production: questions in WebPage.mainEntity).
 */

$ccn_heading = get_field( 'heading' );
$ccn_intro   = get_field( 'intro' );
$ccn_tags    = array(
	'p'      => array(),
	'br'     => array(),
	'strong' => array(),
	'a'      => array(
		'href'   => true,
		'target' => true,
		'rel'    => true,
	),
	'ul'     => array(),
	'ol'     => array(),
	'li'     => array(),
);
$ccn_items   = array_filter(
	(array) get_field( 'items' ),
	function ( $item ) {
		return is_array( $item ) && ! empty( $item['question'] ) && ! empty( $item['answer'] );
	}
);

if ( ! $ccn_items ) {
	if ( ! empty( $is_preview ) ) {
		echo '<p><em>' . esc_html__( 'FAQ: add questions and answers in the block sidebar.', 'coin-container' ) . '</em></p>';
	}
	return;
}
?>
<section class="ccn-faq ccn-section ccn-section--default" data-motion="reveal"<?php echo ! empty( $block['anchor'] ) ? ' id="' . esc_attr( $block['anchor'] ) . '"' : ''; ?>>
	<div class="ccn-faq-inner ccn-container">
		<?php if ( $ccn_heading ) : ?>
			<h2 class="ccn-faq-heading"><?php echo esc_html( $ccn_heading ); ?></h2>
		<?php endif; ?>
		<?php if ( $ccn_intro ) : ?>
			<p class="ccn-faq-intro"><?php echo esc_html( $ccn_intro ); ?></p>
		<?php endif; ?>
		<div class="ccn-faq-list">
			<?php foreach ( $ccn_items as $ccn_item ) : ?>
				<details class="ccn-faq-item">
					<summary><h3><?php echo esc_html( $ccn_item['question'] ); ?></h3><svg class="ccn-faq-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></summary>
					<div class="ccn-faq-answer"><?php echo wp_kses( $ccn_item['answer'], $ccn_tags ); ?></div>
				</details>
			<?php endforeach; ?>
		</div>
	</div>
</section>
