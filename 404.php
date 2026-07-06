<?php get_header(); ?>

<article class="error-404 not-found">
	<header class="entry-header">
		<h1 class="entry-title"><?php esc_html_e( 'Page Not Found', 'coin-container' ); ?></h1>
	</header>
	<div class="entry-content">
		<p><?php esc_html_e( 'Nothing found for the requested page. Try a search instead?', 'coin-container' ); ?></p>
		<?php get_search_form(); ?>
	</div>
</article>

<?php get_footer(); ?>
