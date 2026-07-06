<footer class="entry-footer">
	<?php if ( has_category() ) : ?>
		<span class="cat-links"><?php esc_html_e( 'Categories: ', 'coin-container' ); ?><?php the_category( ', ' ); ?></span>
	<?php endif; ?>
	<?php the_tags( '<span class="tag-links">', ', ', '</span>' ); ?>
</footer>
