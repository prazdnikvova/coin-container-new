<?php
/**
 * Front page — renders the ACF flexible-content sections.
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
		the_content();
	}
}

get_footer();
