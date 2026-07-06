<?php get_header(); ?>

<?php
while ( have_posts() ) :
	the_post();
	get_template_part( 'entry' );
	if ( comments_open() || get_comments_number() ) {
		comments_template();
	}
endwhile;
?>
<?php get_template_part( 'nav', 'below-single' ); ?>

<?php get_footer(); ?>
