<?php
/**
 * Section: featured products. Renders nothing until products exist (T-08).
 */
if ( ! class_exists( 'WooCommerce' ) ) {
	return;
}
$ccn_count = (int) get_sub_field( 'count' );
$ccn_count = $ccn_count > 0 ? $ccn_count : 4;
$ccn_cat   = get_sub_field( 'category' );

$ccn_args = array(
	'post_type'      => 'product',
	'posts_per_page' => $ccn_count,
	'post_status'    => 'publish',
	'no_found_rows'  => true,
);
if ( $ccn_cat ) {
	$ccn_args['tax_query'] = array(
		array(
			'taxonomy' => 'product_cat',
			'field'    => 'slug',
			'terms'    => $ccn_cat,
		),
	);
} else {
	$ccn_args['tax_query'] = array(
		array(
			'taxonomy' => 'product_visibility',
			'field'    => 'name',
			'terms'    => 'featured',
		),
	);
}
$ccn_q = new WP_Query( $ccn_args );
if ( ! $ccn_q->have_posts() ) {
	wp_reset_postdata();
	return;
}
?>
<section class="section section-featured">
	<div class="section-inner">
		<?php if ( $ccn_h = get_sub_field( 'heading' ) ) : ?>
			<h2 class="section-heading"><?php echo esc_html( $ccn_h ); ?></h2>
		<?php endif; ?>
		<ul class="products-grid">
			<?php
			while ( $ccn_q->have_posts() ) :
				$ccn_q->the_post();
				wc_get_template_part( 'content', 'product-card' );
			endwhile;
			?>
		</ul>
	</div>
</section>
<?php
wp_reset_postdata();
