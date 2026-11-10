<?php get_header(); ?>

<?php
ccn_breadcrumbs();
while ( have_posts() ) :
	the_post();
	get_template_part( 'entry' );
endwhile;
?>
<?php get_template_part( 'nav', 'below-single' ); ?>
<?php get_template_part( 'template-parts/related-posts' ); ?>

<?php get_footer(); ?>
