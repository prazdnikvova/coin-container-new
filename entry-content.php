<div class="entry-content">
	<?php if ( has_post_thumbnail() ) : ?>
		<?php the_post_thumbnail( 'full' ); ?>
	<?php endif; ?>
	<?php the_content(); ?>
	<?php wp_link_pages(); ?>
</div>
