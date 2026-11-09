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
			'description' => __( 'First-screen hero: background photo, big left-aligned heading, call-to-action buttons, phone line and trust row.', 'coin-container' ),
			'category'    => 'ccn-banners',
			'icon'        => 'cover-image',
			'keywords'    => array( 'hero', 'banner', 'cover' ),
			'template'    => 'blocks/banners/home-hero.php',
		),
		array(
			'name'        => 'contact-cards',
			'title'       => __( 'Contact cards', 'coin-container' ),
			'description' => __( 'Email / phone / address cards fed by Site Settings (no own fields).', 'coin-container' ),
			'category'    => 'ccn-banners',
			'icon'        => 'id-alt',
			'keywords'    => array( 'contact', 'cards', 'email', 'phone' ),
			'template'    => 'blocks/banners/contact-cards.php',
		),
		array(
			'name'        => 'intro',
			'title'       => __( 'Intro', 'coin-container' ),
			'description' => __( 'Heading with a yellow accent line, bold subheading, text and a CTA button.', 'coin-container' ),
			'category'    => 'ccn-text',
			'icon'        => 'text-page',
			'keywords'    => array( 'intro', 'text', 'heading' ),
			'template'    => 'blocks/text/intro.php',
		),
		array(
			'name'        => 'text-section',
			'title'       => __( 'Text section', 'coin-container' ),
			'description' => __( 'Optional photo, heading with an inline yellow accent, rich text — landing content section.', 'coin-container' ),
			'category'    => 'ccn-text',
			'icon'        => 'editor-alignleft',
			'keywords'    => array( 'text', 'section', 'landing' ),
			'template'    => 'blocks/text/text-section.php',
		),
		array(
			'name'        => 'featured-products',
			'title'       => __( 'Featured products', 'coin-container' ),
			'description' => __( 'WooCommerce product grid: featured products or a chosen category.', 'coin-container' ),
			'category'    => 'ccn-products',
			'icon'        => 'products',
			'keywords'    => array( 'products', 'woocommerce', 'grid' ),
			'template'    => 'blocks/products/featured-products.php',
		),
		array(
			'name'        => 'text-image',
			'title'       => __( 'Text + image', 'coin-container' ),
			'description' => __( 'Heading, text, bold highlight and CTA on the left; photo collage on the right.', 'coin-container' ),
			'category'    => 'ccn-text',
			'icon'        => 'align-pull-right',
			'keywords'    => array( 'text', 'image', 'collage' ),
			'template'    => 'blocks/text/text-image.php',
		),
		array(
			'name'        => 'services',
			'title'       => __( 'Services strip', 'coin-container' ),
			'description' => __( 'Accent heading and a full-width photo strip with numbered service columns.', 'coin-container' ),
			'category'    => 'ccn-banners',
			'icon'        => 'columns',
			'keywords'    => array( 'services', 'strip', 'numbers' ),
			'template'    => 'blocks/banners/services.php',
		),
		array(
			'name'        => 'stats',
			'title'       => __( 'Stats', 'coin-container' ),
			'description' => __( 'Centered accent heading with animated counters.', 'coin-container' ),
			'category'    => 'ccn-lists',
			'icon'        => 'chart-bar',
			'keywords'    => array( 'stats', 'numbers', 'counters' ),
			'template'    => 'blocks/lists/stats.php',
		),
		array(
			'name'        => 'cta-banner',
			'title'       => __( 'CTA banner', 'coin-container' ),
			'description' => __( 'Full-width photo banner with logo, heading and a yellow button.', 'coin-container' ),
			'category'    => 'ccn-banners',
			'icon'        => 'megaphone',
			'keywords'    => array( 'cta', 'banner' ),
			'template'    => 'blocks/banners/cta-banner.php',
		),
		array(
			'name'        => 'info-cards',
			'title'       => __( 'Info cards', 'coin-container' ),
			'description' => __( 'White cards in a grid: photo, title, text (accessory trio of the original).', 'coin-container' ),
			'category'    => 'ccn-lists',
			'icon'        => 'grid-view',
			'keywords'    => array( 'cards', 'grid', 'info' ),
			'template'    => 'blocks/lists/info-cards.php',
		),
		array(
			'name'        => 'numbered-list',
			'title'       => __( 'Numbered list', 'coin-container' ),
			'description' => __( 'Accent heading with numbered items (01, 02, …).', 'coin-container' ),
			'category'    => 'ccn-lists',
			'icon'        => 'editor-ol',
			'keywords'    => array( 'numbered', 'list', 'steps' ),
			'template'    => 'blocks/lists/numbered-list.php',
		),
		array(
			'name'        => 'news',
			'title'       => __( 'News', 'coin-container' ),
			'description' => __( 'Latest posts as cards with category badges and dates.', 'coin-container' ),
			'category'    => 'ccn-lists',
			'icon'        => 'admin-post',
			'keywords'    => array( 'news', 'posts', 'blog' ),
			'template'    => 'blocks/lists/news.php',
		),
		array(
			'name'        => 'trust-bar',
			'title'       => __( 'Trust bar', 'coin-container' ),
			'description' => __( 'Trustpilot and Google ratings and the badge from Site Settings (Vertrauen), the same chips as in the home hero, plus up to three key facts with a source. No own fields.', 'coin-container' ),
			'category'    => 'ccn-banners',
			'icon'        => 'shield',
			'keywords'    => array( 'trust', 'reviews', 'rating', 'trustpilot', 'google' ),
			'template'    => 'blocks/banners/trust-bar.php',
		),
		array(
			'name'        => 'reviews-widget',
			'title'       => __( 'Reviews widget', 'coin-container' ),
			'description' => __( 'Live Google reviews (Trustindex, as on production) and the Trustpilot TrustBox, loaded only when the section comes near.', 'coin-container' ),
			'category'    => 'ccn-lists',
			'icon'        => 'star-filled',
			'keywords'    => array( 'reviews', 'google', 'trustpilot', 'widget' ),
			'template'    => 'blocks/lists/reviews-widget.php',
		),
		array(
			'name'        => 'faq',
			'title'       => __( 'FAQ', 'coin-container' ),
			'description' => __( 'Frequently asked questions as expandable items (details/summary); JSON-LD per Site Settings → Schema.', 'coin-container' ),
			'category'    => 'ccn-text',
			'icon'        => 'editor-help',
			'keywords'    => array( 'faq', 'questions', 'fragen', 'accordion' ),
			'template'    => 'blocks/text/faq.php',
		),
		array(
			'name'        => 'logos',
			'title'       => __( 'Logos', 'coin-container' ),
			'description' => __( 'Partner and certificate logos in a row (lazy, grey until hover).', 'coin-container' ),
			'category'    => 'ccn-lists',
			'icon'        => 'awards',
			'keywords'    => array( 'logos', 'partner', 'certificate', 'zertifikate' ),
			'template'    => 'blocks/lists/logos.php',
		),
		array(
			'name'        => 'form-card',
			'title'       => __( 'Form card', 'coin-container' ),
			'description' => __( 'Request form: heading, intro and a Contact Form 7 form on a light card, optionally with e-mail, phone and address from Site Settings beside it.', 'coin-container' ),
			'category'    => 'ccn-text',
			'icon'        => 'email-alt',
			'keywords'    => array( 'form', 'anfrage', 'kontakt', 'contact form 7' ),
			'template'    => 'blocks/text/form-card.php',
		),
		array(
			'name'        => 'price-table',
			'title'       => __( 'Price table', 'coin-container' ),
			'description' => __( 'Price ranges per container size from Site Settings → Preise (used, One Way, new) with «Stand» and the note; optional heading, chosen sizes only.', 'coin-container' ),
			'category'    => 'ccn-lists',
			'icon'        => 'editor-table',
			'keywords'    => array( 'preise', 'prices', 'table', 'tabelle', 'richtwerte' ),
			'template'    => 'blocks/lists/price-table.php',
		),
		array(
			'name'        => 'related-links',
			'title'       => __( 'Related links', 'coin-container' ),
			'description' => __( 'Up to six hand-picked pages, posts or products as link cards under a heading (default «Verwandte Leistungen»), optionally with a short excerpt.', 'coin-container' ),
			'category'    => 'ccn-lists',
			'icon'        => 'admin-links',
			'keywords'    => array( 'links', 'related', 'verwandte leistungen', 'hub' ),
			'template'    => 'blocks/lists/related-links.php',
		),
	);

	foreach ( $blocks as $block ) {
		$args = array(
			'name'              => $block['name'],
			'title'             => $block['title'],
			'description'       => $block['description'] ?? '',
			'category'          => $block['category'] ?? 'ccn-banners',
			'icon'              => $block['icon'] ?? 'block-default',
			'keywords'          => $block['keywords'] ?? array(),
			'mode'              => 'preview',
			// Block API v3: WP 7.1 always edits in an iframe. ACF Blocks v3: ACF
			// 6.3.9 treats every version above 1 as v2 markup (no extra wrapper);
			// an ACF release with the v3 editing UI picks it up without a change here.
			'api_version'       => 3,
			'acf_block_version' => 3,
			'supports'          => array(
				'align'  => false,
				'anchor' => true,
				'jsx'    => false,
				// No inline edit form in the canvas: fields live in the sidebar,
				// the canvas always shows the rendered preview.
				'mode'   => false,
			),
			'render_template'   => $block['template'],
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

/**
 * Classes for the root <section> of a block with the "background" field
 * (T-48, DESIGN.md "Sections"): the shared vertical rhythm plus one of four
 * backgrounds. Old content without the field renders as "default".
 *
 * @return string Class list.
 */
function ccn_section_classes() {
	$ccn_bg = (string) get_field( 'background' );
	if ( ! in_array( $ccn_bg, array( 'light', 'dark', 'yellow' ), true ) ) {
		$ccn_bg = 'default';
	}
	return 'ccn-section ccn-section--' . $ccn_bg;
}
