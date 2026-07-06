<?php get_header(); ?>

<?php if ( have_posts() ) : ?>
	<header class="archive-header">
		<h1 class="archive-title">
			<?php
			/* translators: %s: search query */
			printf( esc_html__( 'Search Results for: %s', 'coin-container' ), esc_html( get_search_query() ) );
			?>
		</h1>
	</header>
	<?php
	while ( have_posts() ) :
		the_post();
		get_template_part( 'entry' );
	endwhile;
	?>
	<?php get_template_part( 'nav', 'below' ); ?>
<?php else : ?>
	<article class="no-results">
		<header class="entry-header">
			<h1 class="entry-title"><?php esc_html_e( 'Nothing Found', 'coin-container' ); ?></h1>
		</header>
		<div class="entry-content">
			<p><?php esc_html_e( 'Sorry, nothing matched your search. Please try again.', 'coin-container' ); ?></p>
			<?php get_search_form(); ?>
		</div>
	</article>
<?php endif; ?>

<?php get_footer(); ?>
