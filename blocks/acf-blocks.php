<?php
/**
 * ACF blocks: custom editor categories + a single registry.
 *
 * Templates live in blocks/<category>/<name>.php (folder = editor category).
 * Field groups come from acf-json/ (one group per block, location: block).
 * Per-block assets: list registered handles in 'assets' — they are enqueued
 * only on pages where the block is actually present.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Theme block categories, shown above the core ones in the inserter.
 */
add_filter( 'block_categories_all', 'ccn_block_categories' );
function ccn_block_categories( $categories ) {
	$custom = array(
		array(
			'slug'  => 'ccn-banners',
			'title' => __( 'COIN Banners', 'coin-container' ),
		),
		array(
			'slug'  => 'ccn-lists',
			'title' => __( 'COIN Lists', 'coin-container' ),
		),
		array(
			'slug'  => 'ccn-products',
			'title' => __( 'COIN Products', 'coin-container' ),
		),
		array(
			'slug'  => 'ccn-text',
			'title' => __( 'COIN Text', 'coin-container' ),
		),
	);
	return array_merge( $custom, $categories );
}

add_action( 'acf/init', 'ccn_register_blocks' );
function ccn_register_blocks() {
	if ( ! function_exists( 'acf_register_block_type' ) ) {
		return;
	}

	$blocks = array(
		array(
			'name'        => 'home-hero',
			'title'       => __( 'Home hero', 'coin-container' ),
			'description' => __( 'Full-screen hero: background photo, dark gradient, big left-aligned heading.', 'coin-container' ),
			'category'    => 'ccn-banners',
			'icon'        => 'cover-image',
			'keywords'    => array( 'hero', 'banner', 'cover' ),
			'template'    => 'blocks/banners/home-hero.php',
		),
	);

	foreach ( $blocks as $block ) {
		$args = array(
			'name'            => $block['name'],
			'title'           => $block['title'],
			'description'     => $block['description'] ?? '',
			'category'        => $block['category'] ?? 'ccn-banners',
			'icon'            => $block['icon'] ?? 'block-default',
			'keywords'        => $block['keywords'] ?? array(),
			'mode'            => 'preview',
			'supports'        => array(
				'align'  => false,
				'anchor' => true,
				'jsx'    => false,
			),
			'render_template' => $block['template'],
		);

		if ( ! empty( $block['assets'] ) ) {
			$handles                = $block['assets'];
			$args['enqueue_assets'] = function () use ( $handles ) {
				foreach ( $handles as $handle ) {
					if ( wp_script_is( $handle, 'registered' ) ) {
						wp_enqueue_script( $handle );
					}
					if ( wp_style_is( $handle, 'registered' ) ) {
						wp_enqueue_style( $handle );
					}
				}
			};
		}

		acf_register_block_type( $args );
	}
}
