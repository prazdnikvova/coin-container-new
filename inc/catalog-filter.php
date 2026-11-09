<?php
/**
 * Attribute filters of the product categories (T-57b, DESIGN.md "Shop: filters").
 *
 * Production filters its product archives with the BeRocket plugin «AJAX
 * Product Filters»: three checkbox groups, Zustand, Containertyp and Größe,
 * OR inside a group, AND between groups. Here the same groups are plain links
 * to WooCommerce's own layered-nav query vars (?filter_<attribute>=<slug>,…
 * &query_type_<attribute>=or), which WC_Query applies on every product
 * archive, public attribute or not: no plugin, no JS, one small stylesheet.
 *
 * - One <details class="ccn-filter"> after the category strip
 *   (woocommerce_before_shop_loop 26), open only while a filter is active.
 * - A group lists the terms the products of the category carry, in the
 *   attribute's own order, each with its count in the category without
 *   filters: one SQL over the term relationships, cached per category in a
 *   transient; a saved product, a changed term assignment or an edited term
 *   starts a new cache generation.
 * - Filtered listings are noindex, follow, and their canonical URL is the
 *   category (Rank Math; on a noindex page it prints that URL as og:url and
 *   leaves out the canonical tag by design); the links are nofollow.
 * - The category description stands under the grid, as on production
 *   (transmax-child/inc/product-order.php), on the first page only and
 *   without a filter or a chosen sort order.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Filter groups in production's order and with its names: attribute (the
 * taxonomy is pa_<attribute>) => group name. The label of the attribute
 * «typ» is «Typ»; production's group says «Containertyp».
 *
 * @return array<string, string>
 */
function ccn_catalog_filter_groups() {
	return (array) apply_filters(
		'ccn_catalog_filter_groups',
		array(
			'zustand' => __( 'Zustand', 'coin-container' ),
			'typ'     => __( 'Containertyp', 'coin-container' ),
			'grosse'  => __( 'Größe', 'coin-container' ),
		)
	);
}

/**
 * Taxonomies of the filter groups that exist on this site.
 *
 * @return string[]
 */
function ccn_catalog_filter_taxonomies() {
	$taxonomies = array();
	foreach ( array_keys( ccn_catalog_filter_groups() ) as $attribute ) {
		$taxonomy = wc_attribute_taxonomy_name( (string) $attribute );
		if ( taxonomy_exists( $taxonomy ) ) {
			$taxonomies[] = $taxonomy;
		}
	}
	return $taxonomies;
}

/**
 * True when the request filters a product listing: any layered-nav
 * parameter of WooCommerce (filter_*, query_type_*, the price and rating
 * filters), whether it matches a term or not.
 *
 * @return bool
 */
function ccn_catalog_filtered() {
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- read-only: the parameter names only.
	foreach ( array_keys( (array) $_GET ) as $key ) {
		$key = (string) $key;
		if ( 0 === strpos( $key, 'filter_' ) || 0 === strpos( $key, 'query_type_' ) || in_array( $key, array( 'min_price', 'max_price', 'rating_filter' ), true ) ) {
			return true;
		}
	}
	return false;
}

/**
 * Terms of the filter groups that the products of a category carry (the
 * category and its subcategories, as its archive lists them: published,
 * visible in the catalogue), each with its product count, in the order the
 * attribute is set to in WooCommerce (menu order, then the name; or name,
 * numeric name, ID). One query; cached per category.
 *
 * @param WP_Term $term Product category.
 * @return array<string, array<int, array{slug: string, name: string, count: int}>> Taxonomy => terms; taxonomies without terms are left out.
 */
function ccn_catalog_filter_terms( $term ) {
	$key  = 'ccn_catalog_filter_' . (int) get_option( 'ccn_catalog_filter_gen', 0 ) . '_' . (int) $term->term_id;
	$data = get_transient( $key );
	if ( is_array( $data ) ) {
		return $data;
	}
	$data       = array();
	$taxonomies = ccn_catalog_filter_taxonomies();
	if ( $taxonomies ) {
		global $wpdb;
		$cats   = array_merge( array( (int) $term->term_id ), array_map( 'intval', (array) get_term_children( $term->term_id, 'product_cat' ) ) );
		$vis    = wc_get_product_visibility_term_ids();
		$hidden = array( (int) ( $vis['exclude-from-catalog'] ?? 0 ) );
		if ( 'yes' === get_option( 'woocommerce_hide_out_of_stock_items' ) ) {
			$hidden[] = (int) ( $vis['outofstock'] ?? 0 );
		}
		$rows = $wpdb->get_results( // phpcs:ignore WordPress.DB.DirectDatabaseQuery -- one grouped count for every group, cached in a transient.
			$wpdb->prepare(
				"SELECT tt.taxonomy, t.term_id, t.slug, t.name, COALESCE( MAX( CAST( tm.meta_value AS SIGNED ) ), 0 ) AS ord, COUNT( DISTINCT tr.object_id ) AS n
				FROM {$wpdb->term_relationships} AS tr
				INNER JOIN {$wpdb->term_taxonomy} AS tt ON tt.term_taxonomy_id = tr.term_taxonomy_id
				INNER JOIN {$wpdb->terms} AS t ON t.term_id = tt.term_id
				LEFT JOIN {$wpdb->termmeta} AS tm ON tm.term_id = t.term_id AND tm.meta_key = 'order'
				INNER JOIN {$wpdb->posts} AS p ON p.ID = tr.object_id AND p.post_type = 'product' AND p.post_status = 'publish'
				WHERE tt.taxonomy IN (" . implode( ',', array_fill( 0, count( $taxonomies ), '%s' ) ) . ")
				AND tr.object_id IN ( SELECT cr.object_id FROM {$wpdb->term_relationships} AS cr INNER JOIN {$wpdb->term_taxonomy} AS ct ON ct.term_taxonomy_id = cr.term_taxonomy_id WHERE ct.taxonomy = 'product_cat' AND ct.term_id IN (" . implode( ',', array_fill( 0, count( $cats ), '%d' ) ) . ") )
				AND tr.object_id NOT IN ( SELECT hr.object_id FROM {$wpdb->term_relationships} AS hr WHERE hr.term_taxonomy_id IN (" . implode( ',', array_fill( 0, count( $hidden ), '%d' ) ) . ') )
				GROUP BY tt.taxonomy, t.term_id, t.slug, t.name',
				array_merge( $taxonomies, $cats, $hidden )
			)
		);
		$found = array();
		foreach ( (array) $rows as $row ) {
			$found[ $row->taxonomy ][] = array(
				'id'    => (int) $row->term_id,
				'slug'  => (string) $row->slug,
				'name'  => (string) $row->name,
				'order' => (int) $row->ord,
				'count' => (int) $row->n,
			);
		}
		foreach ( $taxonomies as $taxonomy ) {
			if ( empty( $found[ $taxonomy ] ) ) {
				continue;
			}
			$orderby = wc_attribute_orderby( $taxonomy );
			usort(
				$found[ $taxonomy ],
				static function ( $a, $b ) use ( $orderby ) {
					$name = strcasecmp( remove_accents( $a['name'] ), remove_accents( $b['name'] ) );
					if ( 'id' === $orderby ) {
						return $a['id'] <=> $b['id'];
					}
					if ( 'name_num' === $orderby ) {
						return strnatcasecmp( $a['name'], $b['name'] );
					}
					if ( 'name' === $orderby ) {
						return $name;
					}
					return ( $a['order'] <=> $b['order'] ) ? ( $a['order'] <=> $b['order'] ) : $name;
				}
			);
			foreach ( $found[ $taxonomy ] as $item ) {
				$data[ $taxonomy ][] = array(
					'slug'  => $item['slug'],
					'name'  => $item['name'],
					'count' => $item['count'],
				);
			}
		}
	}
	set_transient( $key, $data, DAY_IN_SECONDS );
	return $data;
}

/**
 * The filter of the current product category: its groups with every term,
 * the link that adds or removes the term (the other choices and the sort
 * order kept, back to page 1) and whether it is chosen. Empty outside
 * product categories and where no product carries a group's attribute.
 *
 * @return array<int, array{label: string, terms: array<int, array{name: string, count: int, url: string, active: bool}>}>
 */
function ccn_catalog_filter_view() {
	static $view = null;
	if ( null !== $view ) {
		return $view;
	}
	$view = array();
	$term = is_product_category() ? get_queried_object() : null;
	$base = $term instanceof WP_Term ? get_term_link( $term ) : '';
	if ( ! is_string( $base ) || '' === $base ) {
		return $view;
	}
	$terms  = ccn_catalog_filter_terms( $term );
	$chosen = WC_Query::get_layered_nav_chosen_attributes();
	$groups = array();
	$picked = array();
	foreach ( ccn_catalog_filter_groups() as $attribute => $label ) {
		$taxonomy = wc_attribute_taxonomy_name( (string) $attribute );
		if ( empty( $terms[ $taxonomy ] ) ) {
			continue;
		}
		$slugs                  = wp_list_pluck( $terms[ $taxonomy ], 'slug' );
		$now                    = isset( $chosen[ $taxonomy ]['terms'] ) ? (array) $chosen[ $taxonomy ]['terms'] : array();
		$picked[ $attribute ]   = array_values( array_intersect( $slugs, $now ) );
		$groups[ $attribute ]   = array(
			'label' => (string) $label,
			'slugs' => $slugs,
			'terms' => $terms[ $taxonomy ],
		);
	}
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- read-only: the visitor's sort order stays in the filter links.
	$orderby = isset( $_GET['orderby'] ) ? sanitize_key( wp_unslash( $_GET['orderby'] ) ) : '';
	foreach ( $groups as $attribute => $group ) {
		$items = array();
		foreach ( $group['terms'] as $item ) {
			$active = in_array( $item['slug'], $picked[ $attribute ], true );
			$next   = $picked;
			// Adding keeps the attribute's term order in the URL, so one choice has one address.
			$next[ $attribute ] = $active
				? array_values( array_diff( $picked[ $attribute ], array( $item['slug'] ) ) )
				: array_values( array_intersect( $group['slugs'], array_merge( $picked[ $attribute ], array( $item['slug'] ) ) ) );
			$args = array();
			foreach ( $next as $name => $slugs ) {
				if ( $slugs ) {
					$args[ 'filter_' . $name ]     = implode( ',', $slugs );
					$args[ 'query_type_' . $name ] = 'or';
				}
			}
			if ( '' !== $orderby ) {
				$args['orderby'] = $orderby;
			}
			$items[] = array(
				'name'   => $item['name'],
				'count'  => $item['count'],
				'url'    => $args ? add_query_arg( $args, $base ) : $base,
				'active' => $active,
			);
		}
		$view[] = array(
			'label' => $group['label'],
			'terms' => $items,
		);
	}
	return $view;
}

add_action( 'woocommerce_before_shop_loop', 'ccn_catalog_attribute_filter', 26 );
/**
 * The filter after the category strip (ccn_catalog_filter(), 25), before the
 * sort order (30): one <details>, closed without an active filter, three
 * groups (<fieldset> + <legend>) of term links with their count; the chosen
 * terms carry aria-current and their link removes them; «Zurücksetzen» back
 * to the category while a filter is active.
 */
function ccn_catalog_attribute_filter() {
	$view = ccn_catalog_filter_view();
	if ( ! $view ) {
		return;
	}
	$filtered = ccn_catalog_filtered();
	$active   = 0;
	foreach ( $view as $group ) {
		$active += count( array_filter( wp_list_pluck( $group['terms'], 'active' ) ) );
	}
	$summary = __( 'Filter', 'coin-container' );
	if ( $active ) {
		/* translators: %d: number of chosen filter values */
		$summary = sprintf( __( 'Filter (%d aktiv)', 'coin-container' ), $active );
	}
	echo '<details class="ccn-filter"' . ( $filtered ? ' open' : '' ) . '><summary>' . esc_html( $summary ) . '</summary><div class="ccn-filter-body">';
	foreach ( $view as $group ) {
		echo '<fieldset><legend>' . esc_html( $group['label'] ) . '</legend>';
		foreach ( $group['terms'] as $item ) {
			printf(
				'<a href="%1$s" rel="nofollow"%2$s>%3$s</a>',
				esc_url( $item['url'] ),
				$item['active'] ? ' aria-current="true"' : '',
				esc_html( $item['name'] . ' (' . number_format_i18n( $item['count'] ) . ')' )
			);
		}
		echo '</fieldset>';
	}
	if ( $filtered ) {
		$link = get_term_link( get_queried_object() );
		if ( is_string( $link ) ) {
			echo '<a class="ccn-filter-reset" href="' . esc_url( $link ) . '">' . esc_html__( 'Zurücksetzen', 'coin-container' ) . '</a>';
		}
	}
	echo '</div></details>';
}

add_action( 'woocommerce_no_products_found', 'ccn_catalog_attribute_filter_empty', 5 );
/**
 * A choice without products (two groups that exclude each other): the filter
 * stays above WooCommerce's notice, so «Zurücksetzen» and the chosen terms
 * are still there.
 */
function ccn_catalog_attribute_filter_empty() {
	if ( ccn_catalog_filtered() ) {
		ccn_catalog_attribute_filter();
	}
}

add_action( 'wp', 'ccn_catalog_description_below_grid' );
/**
 * The category text under the product grid, as on production (decision
 * 20.09.2026, transmax-child/inc/product-order.php): WooCommerce prints it
 * under the h1; here it moves to woocommerce_after_shop_loop 20, after the
 * pagination and before the «Siehe auch:» line (25). A category without
 * products keeps it under the h1 (there is no grid to stand under); a
 * filtered listing without products shows none, like any filtered listing.
 */
function ccn_catalog_description_below_grid() {
	global $wp_query;
	if ( ! is_product_taxonomy() || ( empty( $wp_query->post_count ) && ! ccn_catalog_filtered() ) ) {
		return;
	}
	remove_action( 'woocommerce_archive_description', 'woocommerce_taxonomy_archive_description', 10 );
	add_action( 'woocommerce_after_shop_loop', 'ccn_catalog_description', 20 );
}

/**
 * The category text, only on the first page without a filter or a sort
 * order the visitor picked (production: not paged, no ?filters=, no
 * ?orderby=).
 */
function ccn_catalog_description() {
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- read-only: whether the visitor picked a sort order.
	if ( is_paged() || ccn_catalog_filtered() || isset( $_GET['orderby'] ) ) {
		return;
	}
	woocommerce_taxonomy_archive_description();
}

/**
 * True on a filtered product listing (shop or product taxonomy): WooCommerce
 * applies the filter parameters on both.
 *
 * @return bool
 */
function ccn_catalog_filter_seo_applies() {
	return ( is_shop() || is_product_taxonomy() ) && ccn_catalog_filtered();
}

add_filter( 'rank_math/frontend/robots', 'ccn_catalog_filter_robots' );
/**
 * Filtered listings: noindex, follow (the category itself stays indexed).
 *
 * @param array $robots Robots directives of Rank Math (key => value).
 * @return array
 */
function ccn_catalog_filter_robots( $robots ) {
	if ( ! ccn_catalog_filter_seo_applies() ) {
		return $robots;
	}
	$robots           = is_array( $robots ) ? $robots : array();
	$robots['index']  = 'noindex';
	$robots['follow'] = 'follow';
	return $robots;
}

add_filter( 'rank_math/frontend/canonical', 'ccn_catalog_filter_canonical' );
/**
 * Filtered listings: the canonical URL is the category (or the shop) without
 * query, on every page of the listing. Rank Math prints it as og:url; the
 * canonical tag itself it leaves out on noindex pages (Head::robots(), with
 * Google's advice not to mix noindex and a canonical). Priority 10, before
 * the English canonical of inc/trp-seo-en.php (20), which turns it into the
 * /en/ address on English pages.
 *
 * @param string $canonical Canonical URL of Rank Math.
 * @return string
 */
function ccn_catalog_filter_canonical( $canonical ) {
	if ( ! ccn_catalog_filter_seo_applies() ) {
		return $canonical;
	}
	$url = is_shop() ? wc_get_page_permalink( 'shop' ) : get_term_link( get_queried_object() );
	return is_string( $url ) && '' !== $url ? $url : $canonical;
}

/**
 * A new cache generation of the filter counts: every category reads fresh
 * counts on its next view, the old transients expire on their own.
 */
function ccn_catalog_filter_flush() {
	update_option( 'ccn_catalog_filter_gen', (int) get_option( 'ccn_catalog_filter_gen', 0 ) + 1, true );
}

add_action( 'woocommerce_after_product_object_save', 'ccn_catalog_filter_flush' );

add_action( 'set_object_terms', 'ccn_catalog_filter_terms_changed', 10, 6 );
/**
 * A product's categories, visibility or filter terms changed.
 *
 * @param int    $object_id  Object ID.
 * @param array  $terms      Terms as passed.
 * @param array  $tt_ids     New term taxonomy IDs.
 * @param string $taxonomy   Taxonomy.
 * @param bool   $append     Appended or replaced.
 * @param array  $old_tt_ids Old term taxonomy IDs.
 */
function ccn_catalog_filter_terms_changed( $object_id, $terms, $tt_ids, $taxonomy, $append, $old_tt_ids ) {
	if ( 'product' !== get_post_type( $object_id ) || ! in_array( $taxonomy, array_merge( array( 'product_cat', 'product_visibility' ), ccn_catalog_filter_taxonomies() ), true ) ) {
		return;
	}
	$new = array_map( 'intval', (array) $tt_ids );
	$old = array_map( 'intval', (array) $old_tt_ids );
	sort( $new );
	sort( $old );
	if ( $new !== $old ) {
		ccn_catalog_filter_flush();
	}
}

add_action( 'edited_term', 'ccn_catalog_filter_term_changed', 10, 3 );
add_action( 'delete_term', 'ccn_catalog_filter_term_changed', 10, 3 );
/**
 * A category or a filter term was renamed, moved or deleted.
 *
 * @param int    $term_id  Term ID.
 * @param int    $tt_id    Term taxonomy ID.
 * @param string $taxonomy Taxonomy.
 */
function ccn_catalog_filter_term_changed( $term_id, $tt_id, $taxonomy ) {
	if ( 'product_cat' === $taxonomy || in_array( $taxonomy, ccn_catalog_filter_taxonomies(), true ) ) {
		ccn_catalog_filter_flush();
	}
}

add_action( 'updated_term_meta', 'ccn_catalog_filter_term_order', 10, 3 );
add_action( 'added_term_meta', 'ccn_catalog_filter_term_order', 10, 3 );
/**
 * WooCommerce's drag-and-drop order of the terms (term meta «order»).
 *
 * @param int    $meta_id  Meta ID.
 * @param int    $term_id  Term ID.
 * @param string $meta_key Meta key.
 */
function ccn_catalog_filter_term_order( $meta_id, $term_id, $meta_key ) {
	if ( 'order' === $meta_key ) {
		ccn_catalog_filter_flush();
	}
}

add_action( 'transition_post_status', 'ccn_catalog_filter_status_changed', 10, 3 );
add_action( 'before_delete_post', 'ccn_catalog_filter_product_deleted' );
/**
 * A product was published, unpublished or trashed.
 *
 * @param string  $new_status New status.
 * @param string  $old_status Old status.
 * @param WP_Post $post       Post.
 */
function ccn_catalog_filter_status_changed( $new_status, $old_status, $post ) {
	if ( $new_status !== $old_status && $post instanceof WP_Post && 'product' === $post->post_type ) {
		ccn_catalog_filter_flush();
	}
}

/**
 * A product was deleted.
 *
 * @param int $post_id Post ID.
 */
function ccn_catalog_filter_product_deleted( $post_id ) {
	if ( 'product' === get_post_type( $post_id ) ) {
		ccn_catalog_filter_flush();
	}
}
