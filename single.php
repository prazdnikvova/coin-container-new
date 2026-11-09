<?php get_header(); ?>

<?php
ccn_breadcrumbs();
while ( have_posts() ) :
	the_post();
	get_template_part( 'entry' );
	if ( comments_open() || get_comments_number() ) {
		comments_template();
	}
endwhile;
?>
<?php get_template_part( 'nav', 'below-single' ); ?>
<?php get_template_part( 'template-parts/related-posts' ); ?>

<?php get_footer(); ?>
