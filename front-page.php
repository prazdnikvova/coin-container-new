<?php
/**
 * Front page. Fully block-based since 2026-07-14 — the content is ACF blocks
 * edited in the block editor. Every page on the site is block-based since
 * 2026-07-17 (T-30); no flexible-content template remains.
 */

get_header();

while ( have_posts() ) {
	the_post();
	the_content();
}

get_footer();
