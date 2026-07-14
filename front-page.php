<?php
/**
 * Front page. Fully block-based since 2026-07-14 — the content is ACF blocks
 * edited in the block editor. Flexible-content sections remain only on the
 * Sections template landings (template-sections.php).
 */

get_header();

while ( have_posts() ) {
	the_post();
	the_content();
}

get_footer();
