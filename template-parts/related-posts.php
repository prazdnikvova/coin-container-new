<?php
/**
 * «Ähnliche Beiträge» under a single post (T-56, DESIGN.md "Related links"):
 * up to three posts of the same categories as link cards (title + excerpt of
 * 120 characters), newest first, never the post itself; nothing without a
 * related post. Production: the parent theme's block with the heading
 * «Ähnliche Beiträge», fixed in transmax-child/inc/blog-related-fix.php (K69).
 */

$ccn_related = ccn_related_post_ids( get_queried_object_id() );
if ( ! $ccn_related ) {
	return;
}
?>
<section class="ccn-related-posts" aria-labelledby="ccn-related-posts-title">
	<h2 id="ccn-related-posts-title" class="ccn-related-posts-heading"><?php esc_html_e( 'Ähnliche Beiträge', 'coin-container' ); ?></h2>
	<ul class="ccn-related-list">
		<?php foreach ( $ccn_related as $ccn_post_id ) : ?>
			<?php $ccn_text = ccn_card_excerpt( $ccn_post_id ); ?>
			<li class="ccn-related-card ccn-card">
				<h3 class="ccn-related-card-title"><a class="ccn-related-card-link" href="<?php echo esc_url( get_permalink( $ccn_post_id ) ); ?>"><?php echo esc_html( wp_strip_all_tags( get_the_title( $ccn_post_id ) ) ); ?></a></h3>
				<?php if ( '' !== $ccn_text ) : ?>
					<p class="ccn-related-card-excerpt"><?php echo esc_html( $ccn_text ); ?></p>
				<?php endif; ?>
			</li>
		<?php endforeach; ?>
	</ul>
</section>
