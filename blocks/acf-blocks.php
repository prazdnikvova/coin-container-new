<?php
/**
 * ACF blocks: custom editor categories + a single registry.
 *
 * Templates live in blocks/<category>/<name>.php (folder = editor category).
 * Field groups come from acf-json/ (one group per block, location: block).
 * Per-block assets: list registered handles in 'assets' — they are enqueued
 * only on pages where the block is actually present.
 * Inserter preview: 'example' with placeholder data (ccn_block_example(),
 * inc/editor.php) only for blocks that render from their own fields or Site
 * Settings; none for blocks that query products or posts, start third-party
 * scripts or need a chosen form or image (README "Editor").
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Theme block categories, shown above the core ones in the inserter. Titles
 * carry the brand as «Coin» (never «COIN», DESIGN.md "Content & brand rules");
 * the slugs stay, stored content does not name them.
 */
add_filter( 'block_categories_all', 'ccn_block_categories' );
function ccn_block_categories( $categories ) {
	$custom = array(
		array(
			'slug'  => 'ccn-banners',
			'title' => __( 'Coin: Banners', 'coin-container' ),
		),
		array(
			'slug'  => 'ccn-lists',
			'title' => __( 'Coin: Lists', 'coin-container' ),
		),
		array(
			'slug'  => 'ccn-products',
			'title' => __( 'Coin: Products', 'coin-container' ),
		),
		array(
			'slug'  => 'ccn-text',
			'title' => __( 'Coin: Text', 'coin-container' ),
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
			'example'     => ccn_block_example(
				array(
					'heading'        => array( 'field_ccn_in_heading', ccn_placeholder( 'heading' ) ),
					'heading_accent' => array( 'field_ccn_in_heading_accent', ccn_placeholder( 'accent' ) ),
					'text'           => array( 'field_ccn_in_text', ccn_placeholder_html( 'intro' ) ),
				)
			),
		),
		array(
			'name'        => 'text-section',
			'title'       => __( 'Text section', 'coin-container' ),
			'description' => __( 'Optional photo, heading with an inline yellow accent, rich text — landing content section.', 'coin-container' ),
			'category'    => 'ccn-text',
			'icon'        => 'editor-alignleft',
			'keywords'    => array( 'text', 'section', 'landing' ),
			'template'    => 'blocks/text/text-section.php',
			'example'     => ccn_block_example(
				array(
					'heading'        => array( 'field_ccn_ts_heading', ccn_placeholder( 'heading' ) ),
					'heading_accent' => array( 'field_ccn_ts_heading_accent', ccn_placeholder( 'accent' ) ),
					'text'           => array( 'field_ccn_ts_text', ccn_placeholder_html( 'text' ) ),
				)
			),
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
			'example'     => ccn_block_example(
				array(
					'heading'   => array( 'field_ccn_ti_heading', ccn_placeholder( 'heading' ) ),
					'text'      => array( 'field_ccn_ti_text', ccn_placeholder_html( 'text' ) ),
					'highlight' => array( 'field_ccn_ti_highlight', ccn_placeholder( 'highlight' ) ),
				)
			),
		),
		array(
			'name'        => 'services',
			'title'       => __( 'Services strip', 'coin-container' ),
			'description' => __( 'Accent heading and intro, then one card per service (icon, title, text) on a light grey band.', 'coin-container' ),
			'category'    => 'ccn-banners',
			'icon'        => 'columns',
			'keywords'    => array( 'services', 'strip', 'cards' ),
			'template'    => 'blocks/banners/services.php',
			'example'     => ccn_block_example(
				array(
					'heading'        => array( 'field_ccn_sv_heading', ccn_placeholder( 'heading' ) ),
					'heading_accent' => array( 'field_ccn_sv_heading_accent', ccn_placeholder( 'accent' ) ),
				) + ccn_block_rows(
					'items',
					'field_ccn_sv_items',
					array_map(
						function ( $icon ) {
							return array(
								'icon'  => array( 'field_ccn_sv_item_icon', $icon ),
								'title' => array( 'field_ccn_sv_item_title', ccn_placeholder( 'title' ) ),
								'text'  => array( 'field_ccn_sv_item_text', ccn_placeholder( 'teaser' ) ),
							);
						},
						array( 'buy', 'rent', 'transport' )
					)
				)
			),
		),
		array(
			'name'        => 'stats',
			'title'       => __( 'Stats', 'coin-container' ),
			'description' => __( 'Centered accent heading with animated counters.', 'coin-container' ),
			'category'    => 'ccn-lists',
			'icon'        => 'chart-bar',
			'keywords'    => array( 'stats', 'numbers', 'counters' ),
			'template'    => 'blocks/lists/stats.php',
			// Heading and subtitle only: a counter needs a real figure (a placeholder prints as 0).
			'example'     => ccn_block_example(
				array(
					'heading'        => array( 'field_ccn_st_heading', ccn_placeholder( 'heading' ) ),
					'heading_accent' => array( 'field_ccn_st_heading_accent', ccn_placeholder( 'accent' ) ),
					'subtitle'       => array( 'field_ccn_st_subtitle', ccn_placeholder( 'intro' ) ),
				)
			),
		),
		array(
			'name'        => 'cta-banner',
			'title'       => __( 'CTA banner', 'coin-container' ),
			'description' => __( 'Yellow band: heading, optional text line, the button (else the request button of Site Settings) and the phone; with a photo, the photo under a dark overlay and an optional logo.', 'coin-container' ),
			'category'    => 'ccn-banners',
			'icon'        => 'megaphone',
			'keywords'    => array( 'cta', 'banner' ),
			'template'    => 'blocks/banners/cta-banner.php',
			// Without own button fields the band takes the button and the phone from Site Settings.
			'example'     => ccn_block_example(
				array(
					'heading' => array( 'field_ccn_cb_heading', ccn_placeholder( 'heading' ) ),
					'text'    => array( 'field_ccn_cb_text', ccn_placeholder( 'teaser' ) ),
				)
			),
		),
		array(
			'name'        => 'info-cards',
			'title'       => __( 'Info cards', 'coin-container' ),
			'description' => __( 'White cards in a grid: photo, title, text (accessory trio of the original).', 'coin-container' ),
			'category'    => 'ccn-lists',
			'icon'        => 'grid-view',
			'keywords'    => array( 'cards', 'grid', 'info' ),
			'template'    => 'blocks/lists/info-cards.php',
			'example'     => ccn_block_example(
				array( 'heading' => array( 'field_ccn_ic_heading', ccn_placeholder( 'heading' ) ) ) + ccn_block_rows(
					'cards',
					'field_ccn_ic_cards',
					array_fill(
						0,
						3,
						array(
							'title' => array( 'field_ccn_ic_title', ccn_placeholder( 'title' ) ),
							'text'  => array( 'field_ccn_ic_text', ccn_placeholder_html( 'teaser' ) ),
						)
					)
				)
			),
		),
		array(
			'name'        => 'numbered-list',
			'title'       => __( 'Numbered list', 'coin-container' ),
			'description' => __( 'Accent heading with numbered items (01, 02, …).', 'coin-container' ),
			'category'    => 'ccn-lists',
			'icon'        => 'editor-ol',
			'keywords'    => array( 'numbered', 'list', 'steps' ),
			'template'    => 'blocks/lists/numbered-list.php',
			'example'     => ccn_block_example(
				array(
					'heading'        => array( 'field_ccn_nl_heading', ccn_placeholder( 'heading' ) ),
					'heading_accent' => array( 'field_ccn_nl_heading_accent', ccn_placeholder( 'accent' ) ),
				) + ccn_block_rows(
					'items',
					'field_ccn_nl_items',
					array_fill(
						0,
						3,
						array(
							'title' => array( 'field_ccn_nl_item_title', ccn_placeholder( 'title' ) ),
							'text'  => array( 'field_ccn_nl_item_text', ccn_placeholder( 'teaser' ) ),
						)
					)
				)
			),
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
			'example'     => ccn_block_example(
				array( 'heading' => array( 'field_ccn_fq_heading', ccn_placeholder( 'heading' ) ) ) + ccn_block_rows(
					'items',
					'field_ccn_fq_items',
					array_fill(
						0,
						2,
						array(
							'question' => array( 'field_ccn_fq_question', ccn_placeholder( 'question' ) ),
							'answer'   => array( 'field_ccn_fq_answer', ccn_placeholder_html( 'answer' ) ),
						)
					)
				)
			),
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
			// Styles outside theme.css (first TCP window): inc/assets-cleanup.php.
			'assets'      => array( 'ccn-content-cards' ),
			// The rows come from Site Settings → Preise, as on every page.
			'example'     => ccn_block_example(
				array(
					'heading'       => array( 'field_ccn_pt_heading', ccn_placeholder( 'heading' ) ),
					'show_footnote' => array( 'field_ccn_pt_show_footnote', 1 ),
				)
			),
		),
		array(
			'name'        => 'related-links',
			'title'       => __( 'Related links', 'coin-container' ),
			'description' => __( 'Up to six hand-picked pages, posts or products as link cards under a heading (default «Verwandte Leistungen»), optionally with a short excerpt.', 'coin-container' ),
			'category'    => 'ccn-lists',
			'icon'        => 'admin-links',
			'keywords'    => array( 'links', 'related', 'verwandte leistungen', 'hub' ),
			'template'    => 'blocks/lists/related-links.php',
			'assets'      => array( 'ccn-content-cards' ),
		),
		array(
			'name'        => 'gallery-rail',
			'title'       => __( 'Gallery rail', 'coin-container' ),
			'description' => __( 'Photos in one horizontal row that scrolls sideways (buttons, swipe, arrow keys; no autoplay), with an optional heading and text above — the image carousels and galleries of the old site.', 'coin-container' ),
			'category'    => 'ccn-lists',
			'icon'        => 'images-alt2',
			'keywords'    => array( 'gallery', 'galerie', 'carousel', 'karussell', 'photos', 'bilder', 'projekte' ),
			'template'    => 'blocks/lists/gallery-rail.php',
			// Styles outside theme.css (first TCP window), registered below.
			'assets'      => array( 'ccn-gallery-rail' ),
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

		if ( ! empty( $block['example'] ) ) {
			$args['example'] = $block['example'];
		}

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
 * Stylesheet of the gallery rail block (T-53b, DESIGN.md "Gallery rail"): a file of its
 * own, enqueued by the block's 'assets' only where it renders; WordPress 7.1 moves the
 * late link into <head> for classic themes, after theme.css (its dependency).
 */
add_action( 'init', 'ccn_register_gallery_rail_style' );
function ccn_register_gallery_rail_style() {
	wp_register_style(
		'ccn-gallery-rail',
		get_template_directory_uri() . '/assets/css/gallery-rail.css',
		array( 'coin-container' ),
		ccn_asset_version( '/assets/css/gallery-rail.css' )
	);
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
