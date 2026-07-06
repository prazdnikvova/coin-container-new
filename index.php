<?php get_header(); ?>

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
