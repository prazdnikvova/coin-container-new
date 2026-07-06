<div class="entry-summary">
	<?php if ( has_post_thumbnail() && ! is_search() ) : ?>
		<a href="<?php the_permalink(); ?>"><?php the_post_thumbnail(); ?></a>
	<?php endif; ?>
	<?php the_excerpt(); ?>
</div>
