<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo( 'charset' ); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1">
<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
<header id="header" class="site-header">
	<div class="header-inner">
		<a class="site-logo" href="<?php echo esc_url( home_url( '/' ) ); ?>" rel="home" aria-label="<?php echo esc_attr( get_bloginfo( 'name' ) ); ?>">
			<img src="<?php echo esc_url( get_template_directory_uri() . '/assets/img/logo.webp' ); ?>" width="106" height="80" alt="<?php echo esc_attr( get_bloginfo( 'name' ) ); ?>">
		</a>

		<button class="nav-toggle" aria-expanded="false" aria-controls="site-nav">
			<span class="nav-toggle-bar" aria-hidden="true"></span>
			<span class="screen-reader-text"><?php esc_html_e( 'Menü', 'coin-container' ); ?></span>
		</button>

		<nav id="site-nav" class="site-nav" aria-label="<?php esc_attr_e( 'Hauptnavigation', 'coin-container' ); ?>">
			<?php
			wp_nav_menu(
				array(
					'theme_location' => 'primary',
					'container'      => false,
					'menu_class'     => 'site-menu',
					'fallback_cb'    => false,
				)
			);
			?>
		</nav>

		<div class="header-actions">
			<?php $ccn_phone = ccn_setting( 'phone' ); ?>
			<?php if ( $ccn_phone ) : ?>
				<a class="header-phone" href="tel:<?php echo esc_attr( preg_replace( '/[^0-9+]/', '', $ccn_phone ) ); ?>"><?php echo esc_html( $ccn_phone ); ?></a>
			<?php endif; ?>
			<?php if ( class_exists( 'WooCommerce' ) && function_exists( 'wc_get_cart_url' ) ) : ?>
				<?php $ccn_cart_count = ( WC()->cart ) ? WC()->cart->get_cart_contents_count() : 0; ?>
				<a class="header-cart" href="<?php echo esc_url( wc_get_cart_url() ); ?>">
					<?php esc_html_e( 'Warenkorb', 'coin-container' ); ?><span class="header-cart-count">(<?php echo esc_html( (string) $ccn_cart_count ); ?>)</span>
				</a>
			<?php endif; ?>
		</div>
	</div>
</header>

<main id="content" class="site-main">
