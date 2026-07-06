<?php
/**
 * Section: latest news (blog posts). Renders nothing until posts exist (T-18).
 */
$ccn_count = (int) get_sub_field( 'count' );
$ccn_count = $ccn_count > 0 ? $ccn_count : 3;

$ccn_q = new WP_Query(
	array(
		'post_type'      => 'post',
		'posts_per_page' => $ccn_count,
		'post_status'    => 'publish',
		'no_found_rows'  => true,
	)
);
if ( ! $ccn_q->have_posts() ) {
	wp_reset_postdata();
	return;
}
?>
<section class="section section-news">
	<div class="section-inner">
		<?php if ( $ccn_h = get_sub_field( 'heading' ) ) : ?>
			<h2 class="section-heading"><?php echo esc_html( $ccn_h ); ?></h2>
		<?php endif; ?>
		<div class="news-grid">
			<?php
			while ( $ccn_q->have_posts() ) :
				$ccn_q->the_post();
				?>
				<article class="news-card">
					<a class="news-card-link" href="<?php the_permalink(); ?>">
						<?php if ( has_post_thumbnail() ) : ?>
							<div class="news-card-media"><?php the_post_thumbnail( 'medium_large', array( 'loading' => 'lazy' ) ); ?></div>
						<?php endif; ?>
						<h3 class="news-card-title"><?php the_title(); ?></h3>
					</a>
					<p class="news-card-date"><?php echo esc_html( get_the_date() ); ?></p>
				</article>
			<?php endwhile; ?>
		</div>
	</div>
</section>
<?php
wp_reset_postdata();
