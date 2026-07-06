<article id="post-<?php the_ID(); ?>" <?php post_class(); ?>>
	<header class="entry-header">
		<?php if ( is_singular() ) : ?>
			<h1 class="entry-title"><?php the_title(); ?></h1>
		<?php else : ?>
			<h2 class="entry-title">
				<a href="<?php the_permalink(); ?>" rel="bookmark"><?php the_title(); ?></a>
			</h2>
		<?php endif; ?>
		<?php if ( ! is_search() && 'post' === get_post_type() ) : ?>
			<?php get_template_part( 'entry', 'meta' ); ?>
		<?php endif; ?>
	</header>

	<?php get_template_part( 'entry', is_singular() ? 'content' : 'summary' ); ?>

	<?php if ( is_singular() ) : ?>
		<?php get_template_part( 'entry', 'footer' ); ?>
	<?php endif; ?>
</article>
