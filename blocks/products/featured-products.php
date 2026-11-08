<?php
/**
 * Block: Featured products. Standard WooCommerce product loop so the cards
 * match the shop; falls back to the featured products when no category is
 * given. Ported from the legacy featured_products flexible section.
 */

if ( ! class_exists( 'WooCommerce' ) ) {
	if ( ! empty( $is_preview ) ) {
		echo '<p><em>' . esc_html__( 'Featured products: WooCommerce is not active.', 'coin-container' ) . '</em></p>';
	}
	return;
}

$ccn_count   = (int) get_field( 'count' );
$ccn_count   = $ccn_count > 0 ? $ccn_count : 4;
$ccn_cat     = get_field( 'category' );
$ccn_include = (string) get_field( 'include' );

$ccn_args = array(
	'post_type'      => 'product',
	'posts_per_page' => $ccn_count,
	'post_status'    => 'publish',
	'no_found_rows'  => true,
);
if ( $ccn_include ) {
	// Hand-picked products (landing grids mirror specific originals).
	$ccn_slugs                  = array_filter( array_map( 'trim', explode( ',', $ccn_include ) ) );
	$ccn_args['post_name__in']  = $ccn_slugs;
	$ccn_args['orderby']        = 'post_name__in';
	$ccn_args['posts_per_page'] = count( $ccn_slugs );
} elseif ( $ccn_cat ) {
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
	if ( ! empty( $is_preview ) ) {
		echo '<p><em>' . esc_html__( 'Featured products: no products matched (mark products as featured or set a category).', 'coin-container' ) . '</em></p>';
	}
	return;
}
?>
<section class="ccn-featured <?php echo esc_attr( ccn_section_classes() ); ?>" data-motion="reveal"<?php echo ! empty( $block['anchor'] ) ? ' id="' . esc_attr( $block['anchor'] ) . '"' : ''; ?>>
	<div class="section-inner ccn-container">
		<?php $ccn_h = get_field( 'heading' ); ?>
		<?php if ( $ccn_h ) : ?>
			<h2 class="section-heading"><?php echo esc_html( $ccn_h ); ?></h2>
		<?php endif; ?>
		<?php
		// The cards stagger in (T-46): data-motion-stagger on WooCommerce's
		// <ul class="products">, here only — the shop loop stays untouched.
		echo preg_replace( '/<ul\b/', '<ul data-motion-stagger', woocommerce_product_loop_start( false ), 1 ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- WooCommerce loop-start template markup.
		?>
			<?php
			// Under this block's own h2 the card titles drop to h3 (here only:
			// the shop keeps WooCommerce's h2 under its h1). Without a heading
			// they stay h2, otherwise the page would jump from h1 to h3.
			if ( $ccn_h ) {
				ccn_loop_title_as_h3( true );
			}
			while ( $ccn_q->have_posts() ) :
				$ccn_q->the_post();
				wc_get_template_part( 'content', 'product' );
			endwhile;
			if ( $ccn_h ) {
				ccn_loop_title_as_h3( false );
			}
			?>
		<?php woocommerce_product_loop_end(); ?>
	</div>
</section>
<?php
wp_reset_postdata();
