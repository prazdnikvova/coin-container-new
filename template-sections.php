<?php
/**
 * Template Name: Sections (flexible content)
 *
 * Renders the same ACF flexible-content sections as the front page, for landing
 * pages rebuilt block-by-block in the site design.
 */

get_header();

if ( function_exists( 'have_rows' ) && have_rows( 'page_sections' ) ) {
	while ( have_rows( 'page_sections' ) ) {
		the_row();
		$ccn_layout = get_row_layout();
		$ccn_part   = locate_template( 'sections/' . $ccn_layout . '.php' );
		if ( $ccn_part ) {
			include $ccn_part;
		}
	}
} else {
	while ( have_posts() ) {
		the_post();
		?>
		<article <?php post_class(); ?>>
			<header class="entry-header section-inner-narrow"><h1 class="entry-title"><?php the_title(); ?></h1></header>
			<div class="entry-content section-inner-narrow"><?php the_content(); ?></div>
		</article>
		<?php
	}
}

get_footer();
