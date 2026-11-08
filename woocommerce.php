<?php
/**
 * WooCommerce wrapper — shop, category archives, single products all render
 * through here. Keeps the theme's header/footer and a single content container;
 * the breadcrumbs come first, above the h1 (inc/seo.php).
 */

get_header();
?>
<div class="section">
	<div class="section-inner woocommerce-page-inner ccn-container">
		<?php ccn_breadcrumbs(); ?>
		<?php woocommerce_content(); ?>
	</div>
</div>
<?php
get_footer();
