<?php
/**
 * Block editor for the team (T-52, README "Patterns" and "Editor", DESIGN.md
 * "Editor"): the theme's own patterns only (patterns/, category «Coin
 * Container»; core's patterns and the wordpress.org pattern directory stay out
 * of the inserter), the helpers the pattern files and the block examples
 * share, the block set of the page and post editor and the core block styles
 * the theme does not style. Nothing here prints on a public page.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Core's block patterns (query loops, navigation overlays) are a theme support
 * that classic themes get by default; wordpress.org's pattern directory loads
 * through the REST API of the editor. Both off: the Patterns tab lists the
 * theme's patterns only.
 */
add_action( 'after_setup_theme', 'ccn_editor_setup' );
function ccn_editor_setup() {
	remove_theme_support( 'core-block-patterns' );
}
add_filter( 'should_load_remote_block_patterns', '__return_false' );

/**
 * The one pattern category: every file in patterns/ names it under
 * "Categories". WordPress registers the files itself (theme patterns
 * directory); the list of files is cached for 30 minutes per theme version
 * (README "Patterns").
 */
add_action( 'init', 'ccn_register_pattern_category' );
function ccn_register_pattern_category() {
	register_block_pattern_category(
		'coin-container',
		array(
			'label'       => __( 'Coin Container', 'coin-container' ),
			'description' => __( 'Page layouts of the theme: replace every [placeholder], then pick the images and the form in the block sidebar.', 'coin-container' ),
		)
	);
}

/**
 * Placeholder texts of the patterns and the block examples: German like the
 * content they stand for, in square brackets, never a fact, figure, price,
 * product name or phone number (content rule: nothing invented). The smoke
 * test fails when one of them reaches a public page.
 *
 * The block examples are built on every request (block registration), so the
 * translated set is kept per locale.
 *
 * @param string $key Placeholder key.
 * @return string Placeholder; empty for an unknown key.
 */
function ccn_placeholder( $key ) {
	static $texts = array();
	$locale = determine_locale();
	if ( ! isset( $texts[ $locale ] ) ) {
		$texts[ $locale ] = array(
			'heading'    => __( '[Überschrift]', 'coin-container' ),
			'accent'     => __( '[Akzent]', 'coin-container' ),
			'intro'      => __( '[Kurzer Einleitungstext]', 'coin-container' ),
			'text'       => __( '[Text]', 'coin-container' ),
			'title'      => __( '[Titel]', 'coin-container' ),
			'teaser'     => __( '[Kurzer Text]', 'coin-container' ),
			'question'   => __( '[Frage]', 'coin-container' ),
			'answer'     => __( '[Antwort]', 'coin-container' ),
			'highlight'  => __( '[Hervorhebung]', 'coin-container' ),
			'subheading' => __( '[Zwischenüberschrift]', 'coin-container' ),
			'item'       => __( '[Listenpunkt]', 'coin-container' ),
		);
	}
	return isset( $texts[ $locale ][ $key ] ) ? $texts[ $locale ][ $key ] : '';
}

/**
 * Data of an ACF block as the editor stores it: every value under its field
 * name plus the "_name" => field key reference next to it (keys from
 * acf-json/group_ccn_block_*.json; without the references the fields show
 * empty in the block sidebar). A repeater is its row count, its rows are
 * "<name>_<row>_<sub field>" entries.
 *
 * @param array $fields Field name => array( field key, value ).
 * @return array Block data.
 */
function ccn_block_data( $fields ) {
	$data = array();
	foreach ( $fields as $name => $field ) {
		$data[ $name ]       = $field[1];
		$data[ '_' . $name ] = $field[0];
	}
	return $data;
}

/**
 * Repeater rows for ccn_block_data(): the row count under the repeater's name,
 * then every sub field of every row as "<name>_<row>_<sub field>".
 *
 * @param string $name Repeater field name.
 * @param string $key  Repeater field key.
 * @param array  $rows One array per row: sub field name => array( sub field key, value ).
 * @return array Field name => array( field key, value ).
 */
function ccn_block_rows( $name, $key, $rows ) {
	$fields = array( $name => array( $key, count( $rows ) ) );
	foreach ( array_values( $rows ) as $index => $row ) {
		foreach ( $row as $sub => $field ) {
			$fields[ "{$name}_{$index}_{$sub}" ] = $field;
		}
	}
	return $fields;
}

/**
 * One ACF block of a pattern file (patterns/*.php), serialized by core
 * (serialize_block() encodes the attributes the way the editor does).
 *
 * @param string $name   Block name, e.g. 'acf/intro'.
 * @param array  $fields Field name => array( field key, value ); see ccn_block_data().
 * @return string Block markup.
 */
function ccn_pattern_block( $name, $fields = array() ) {
	return serialize_block(
		array(
			'blockName'    => $name,
			'attrs'        => array(
				'name' => $name,
				'data' => ccn_block_data( $fields ),
				'mode' => 'preview',
			),
			'innerBlocks'  => array(),
			'innerHTML'    => '',
			'innerContent' => array(),
		)
	) . "\n\n";
}

/**
 * A paragraph of placeholder text for a rich-text (wysiwyg) field.
 *
 * @param string $key Placeholder key.
 * @return string HTML.
 */
function ccn_placeholder_html( $key ) {
	return '<p>' . esc_html( ccn_placeholder( $key ) ) . '</p>';
}

/**
 * Inserter preview of an ACF block ('example' in blocks/acf-blocks.php):
 * placeholder data, rendered like the preview in the canvas. Only for blocks
 * that render from their own fields or Site Settings: none for blocks that
 * query products or posts, start third-party scripts or need a chosen form or
 * image (they would show live data or nothing).
 *
 * @param array $fields Field name => array( field key, value ); see ccn_block_data().
 * @return array Block type example.
 */
function ccn_block_example( $fields ) {
	return array(
		'attributes' => array(
			'mode' => 'preview',
			'data' => ccn_block_data( $fields ),
		),
	);
}

/**
 * Core blocks of the page and post editor: the ones theme.css styles (prose in
 * the text column, lists, quotes, tables, the rule, images, groups). A core
 * block joins this list once theme.css styles it (DESIGN.md "Editor"); the
 * theme's acf/* blocks need no list.
 *
 * @return string[] Block names.
 */
function ccn_editor_core_blocks() {
	return array( 'core/paragraph', 'core/heading', 'core/list', 'core/list-item', 'core/image', 'core/quote', 'core/table', 'core/separator', 'core/group' );
}

/**
 * Block names of stored content, inner blocks included; text outside any block
 * (classic content) is core/freeform, the Classic block the editor shows it in.
 *
 * @param string $content Post content.
 * @return string[] Block names.
 */
function ccn_content_block_names( $content ) {
	$names = array();
	$walk  = function ( $blocks ) use ( &$walk, &$names ) {
		foreach ( $blocks as $block ) {
			if ( ! empty( $block['blockName'] ) ) {
				$names[] = $block['blockName'];
			} elseif ( '' !== trim( (string) $block['innerHTML'] ) ) {
				$names[] = 'core/freeform';
			}
			if ( ! empty( $block['innerBlocks'] ) ) {
				$walk( $block['innerBlocks'] );
			}
		}
	};
	$walk( parse_blocks( (string) $content ) );
	return array_values( array_unique( $names ) );
}

/**
 * True for the pages WooCommerce renders itself: shop, cart, checkout, account.
 *
 * @param int $post_id Post ID.
 * @return bool
 */
function ccn_is_woocommerce_page_id( $post_id ) {
	if ( ! function_exists( 'wc_get_page_id' ) ) {
		return false;
	}
	foreach ( array( 'shop', 'cart', 'checkout', 'myaccount' ) as $ccn_page ) {
		if ( (int) wc_get_page_id( $ccn_page ) === (int) $post_id ) {
			return true;
		}
	}
	return false;
}

/**
 * Blocks the editor of pages and posts offers: every acf/* block of the theme
 * (a new block of the registry is in at once) and the core blocks of
 * ccn_editor_core_blocks(). Custom HTML and Shortcode only for users who may
 * post unfiltered HTML. A record also keeps every block its content already
 * holds (older posts with buttons, media & text, social icons, spacers, Rank
 * Math's FAQ block, classic content), so nothing in it turns uneditable;
 * converting those is a card of its own. Products, the WooCommerce pages,
 * other post types and editors without a post keep WordPress's set.
 *
 * @param bool|string[]           $allowed Allowed block types; true = all.
 * @param WP_Block_Editor_Context $context Editor context.
 * @return bool|string[]
 */
add_filter( 'allowed_block_types_all', 'ccn_allowed_block_types', 10, 2 );
function ccn_allowed_block_types( $allowed, $context ) {
	$post = ( $context instanceof WP_Block_Editor_Context ) ? $context->post : null;
	if ( ! $post instanceof WP_Post || ! in_array( $post->post_type, array( 'page', 'post' ), true ) || ccn_is_woocommerce_page_id( $post->ID ) ) {
		return $allowed;
	}
	$blocks = ccn_editor_core_blocks();
	foreach ( array_keys( WP_Block_Type_Registry::get_instance()->get_all_registered() ) as $name ) {
		if ( 0 === strpos( $name, 'acf/' ) ) {
			$blocks[] = $name;
		}
	}
	$blocks = array_merge( $blocks, ccn_content_block_names( $post->post_content ) );
	$raw    = array( 'core/html', 'core/shortcode' );
	$blocks = array_diff( $blocks, $raw );
	if ( current_user_can( 'unfiltered_html' ) ) {
		$blocks = array_merge( $blocks, $raw );
	}
	return array_values( array_unique( $blocks ) );
}

/**
 * Core block styles theme.css has no rules for: removed in the editor only, so
 * the Styles panel never offers a look the site does not have (no Styles panel
 * left on these four blocks). An inline script on the post editor screen, run
 * after wp-edit-post has registered the core blocks; the front end and main.js
 * stay untouched. The theme registers no block styles of its own: theme.css
 * has no is-style-* class to map one to.
 */
add_action( 'enqueue_block_editor_assets', 'ccn_editor_block_styles' );
function ccn_editor_block_styles() {
	$screen = function_exists( 'get_current_screen' ) ? get_current_screen() : null;
	if ( ! $screen || 'post' !== $screen->base ) {
		return;
	}
	$styles = array(
		'core/image'     => array( 'default', 'rounded' ),
		'core/quote'     => array( 'default', 'plain' ),
		'core/separator' => array( 'default', 'wide', 'dots' ),
		'core/table'     => array( 'regular', 'stripes' ),
	);
	// No file: the handle only carries the inline script below (no src, no version).
	wp_register_script( 'ccn-editor-block-styles', false, array( 'wp-blocks', 'wp-dom-ready', 'wp-edit-post' ), null, true );
	wp_enqueue_script( 'ccn-editor-block-styles' );
	wp_add_inline_script(
		'ccn-editor-block-styles',
		'wp.domReady(function(){var s=' . wp_json_encode( $styles ) . ';Object.keys(s).forEach(function(b){s[b].forEach(function(n){wp.blocks.unregisterBlockStyle(b,n);});});});'
	);
}
