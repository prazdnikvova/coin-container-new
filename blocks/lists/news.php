<?php
/**
 * Block: News. Yellow left-aligned heading and the latest posts as cards:
 * photo with a yellow category badge, date, title, "Weiterlesen" link.
 */

$ccn_heading = get_field( 'heading' );
$ccn_count   = (int) get_field( 'count' );
$ccn_count   = $ccn_count > 0 ? $ccn_count : 4;

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
	if ( ! empty( $is_preview ) ) {
		echo '<p><em>' . esc_html__( 'News: no posts published yet.', 'coin-container' ) . '</em></p>';
	}
	return;
}
?>
<section class="ccn-news">
	<div class="ccn-news-inner">
		<?php if ( $ccn_heading ) : ?>
			<h2 class="ccn-news-heading"><?php echo esc_html( $ccn_heading ); ?></h2>
		<?php endif; ?>
		<div class="ccn-news-grid">
			<?php
			while ( $ccn_q->have_posts() ) :
				$ccn_q->the_post();
				$ccn_cat = get_the_category();
				?>
				<article class="ccn-news-card">
					<a class="ccn-news-media" href="<?php the_permalink(); ?>" aria-hidden="true" tabindex="-1">
						<?php if ( has_post_thumbnail() ) : ?>
							<?php the_post_thumbnail( 'medium_large', array( 'loading' => 'lazy' ) ); ?>
						<?php endif; ?>
						<?php if ( ! empty( $ccn_cat ) ) : ?>
							<span class="ccn-news-badge"><?php echo esc_html( $ccn_cat[0]->name ); ?></span>
						<?php endif; ?>
					</a>
					<div class="ccn-news-body">
						<time class="ccn-news-date" datetime="<?php echo esc_attr( get_the_date( 'c' ) ); ?>"><?php echo esc_html( get_the_date( 'd.m.Y' ) ); ?></time>
						<h3 class="ccn-news-title"><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h3>
						<a class="ccn-news-more" href="<?php the_permalink(); ?>"><?php esc_html_e( 'Weiterlesen', 'coin-container' ); ?><span class="screen-reader-text"> <?php the_title(); ?></span></a>
					</div>
				</article>
			<?php endwhile; ?>
		</div>
	</div>
</section>
<?php
wp_reset_postdata();
