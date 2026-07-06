<?php get_header(); ?>

<header class="archive-header">
	<h1 class="archive-title"><?php the_archive_title(); ?></h1>
	<?php the_archive_description( '<div class="archive-description">', '</div>' ); ?>
</header>

<?php if ( have_posts() ) : ?>
	<?php
	while ( have_posts() ) :
		the_post();
		get_template_part( 'entry' );
	endwhile;
	?>
	<?php get_template_part( 'nav', 'below' ); ?>
<?php endif; ?>

<?php get_footer(); ?>
