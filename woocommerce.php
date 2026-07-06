<?php
/**
 * WooCommerce wrapper — shop, category archives, single products all render
 * through here. Keeps the theme's header/footer and a single content container.
 */

get_header();
?>
<div class="section">
	<div class="section-inner woocommerce-page-inner">
		<?php woocommerce_content(); ?>
	</div>
</div>
<?php
get_footer();
