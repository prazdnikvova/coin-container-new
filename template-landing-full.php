<?php
/**
 * Template Name: Landing (full width)
 *
 * Landing pages without the services sidebar (Containerzubehör, Bürocontainer
 * and the text-heavy landings of the original): the same full-width hero band
 * from the featured image, then content blocks across the full width.
 */

get_header();

while ( have_posts() ) :
	the_post();
	get_template_part( 'template-parts/page-hero' );
	?>
	<div class="ccn-landing-full">
		<?php the_content(); ?>
	</div>
	<?php
endwhile;

get_footer();
