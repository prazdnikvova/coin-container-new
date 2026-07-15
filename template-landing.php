<?php
/**
 * Template Name: Landing (sidebar)
 *
 * Landing pages in the original design: a full-width hero band built from
 * the featured image and the page title, then a two-column area — content
 * blocks on the left, the services sidebar on the right. The hero lives in
 * the template (not a block) so it can span the full width above the
 * columns and the page always has exactly one H1.
 */

get_header();

while ( have_posts() ) :
	the_post();
	get_template_part( 'template-parts/page-hero' );
	?>
	<div class="ccn-landing">
		<div class="ccn-landing-main">
			<?php the_content(); ?>
		</div>
		<?php get_template_part( 'template-parts/landing-sidebar' ); ?>
	</div>
	<?php
endwhile;

get_footer();
