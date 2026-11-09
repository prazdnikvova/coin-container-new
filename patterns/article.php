<?php
/**
 * Title: Coin: Article
 * Slug: coin-container/article
 * Description: Lead paragraph, two subheadings with text, an image and a list, for a post or a text page.
 * Categories: coin-container
 * Block Types: core/post-content
 * Post Types: post, page
 * Viewport Width: 1200
 *
 * Core blocks only, in the markup the editor saves (no block validation
 * warning). The image stays empty: it is picked in the editor, and an image
 * block without a file prints nothing on the site.
 */

?>
<!-- wp:paragraph -->
<p><?php echo esc_html( ccn_placeholder( 'intro' ) ); ?></p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading"><?php echo esc_html( ccn_placeholder( 'subheading' ) ); ?></h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p><?php echo esc_html( ccn_placeholder( 'text' ) ); ?></p>
<!-- /wp:paragraph -->

<!-- wp:image {"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img alt=""/></figure>
<!-- /wp:image -->

<!-- wp:heading -->
<h2 class="wp-block-heading"><?php echo esc_html( ccn_placeholder( 'subheading' ) ); ?></h2>
<!-- /wp:heading -->

<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li><?php echo esc_html( ccn_placeholder( 'item' ) ); ?></li>
<!-- /wp:list-item --><!-- wp:list-item -->
<li><?php echo esc_html( ccn_placeholder( 'item' ) ); ?></li>
<!-- /wp:list-item --><!-- wp:list-item -->
<li><?php echo esc_html( ccn_placeholder( 'item' ) ); ?></li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p><?php echo esc_html( ccn_placeholder( 'text' ) ); ?></p>
<!-- /wp:paragraph -->
