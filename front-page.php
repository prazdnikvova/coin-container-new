<?php
/**
 * Front page. Blocks render first (the page is being migrated to ACF blocks,
 * decision 2026-07-14), then any flexible-content sections that have not
 * been migrated yet. Once all sections are blocks, the sections loop goes.
 */

get_header();

while ( have_posts() ) {
	the_post();
	the_content();
}

if ( function_exists( 'have_rows' ) && have_rows( 'page_sections' ) ) {
	while ( have_rows( 'page_sections' ) ) {
		the_row();
		$ccn_layout = get_row_layout();
		$ccn_part   = locate_template( 'sections/' . $ccn_layout . '.php' );
		if ( $ccn_part ) {
			include $ccn_part;
		}
	}
}

get_footer();
