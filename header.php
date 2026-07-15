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
	<div class="ccn-topbar">
		<div class="ccn-topbar-inner">
			<div class="ccn-topbar-contacts">
				<?php $ccn_phone = ccn_setting( 'phone' ); ?>
				<?php if ( $ccn_phone ) : ?>
					<a class="header-phone" href="tel:<?php echo esc_attr( preg_replace( '/[^0-9+]/', '', $ccn_phone ) ); ?>">
						<svg class="ccn-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 16.5v2.6a1.9 1.9 0 0 1-2.1 1.9 19 19 0 0 1-8.3-3 18.7 18.7 0 0 1-5.7-5.7 19 19 0 0 1-3-8.3A1.9 1.9 0 0 1 3.8 2h2.6a1.9 1.9 0 0 1 1.9 1.6c.12.92.34 1.83.65 2.7a1.9 1.9 0 0 1-.43 2L7.4 9.4a15.2 15.2 0 0 0 5.7 5.7l1.1-1.12a1.9 1.9 0 0 1 2-.43c.87.31 1.78.53 2.7.65a1.9 1.9 0 0 1 1.6 1.9Z"/></svg>
						<?php echo esc_html( $ccn_phone ); ?>
					</a>
				<?php endif; ?>
				<?php $ccn_email = ccn_setting( 'email' ); ?>
				<?php if ( $ccn_email ) : ?>
					<a class="ccn-topbar-email" href="mailto:<?php echo esc_attr( $ccn_email ); ?>">
						<svg class="ccn-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="m3.5 6.5 8.5 6 8.5-6"/></svg>
						<?php echo esc_html( $ccn_email ); ?>
					</a>
				<?php endif; ?>
			</div>
			<ul class="ccn-topbar-social">
				<?php
				$ccn_topbar_social = array(
					'social_facebook'  => array(
						'label' => 'Facebook',
						'path'  => 'M13.5 9H16l.5-3h-3V4.5c0-.9.3-1.5 1.6-1.5H16.6V.2C16.3.2 15.3 0 14.2 0 11.8 0 10.2 1.5 10.2 4.2V6H7.5v3h2.7v9h3.3V9Z',
					),
					'social_instagram' => array(
						'label' => 'Instagram',
						'path'  => 'M9 1.8c2.3 0 2.6 0 3.6.1 2.4.1 3.5 1.2 3.6 3.6 0 1 .1 1.2.1 3.5s0 2.6-.1 3.5c-.1 2.4-1.2 3.5-3.6 3.6-1 0-1.2.1-3.6.1-2.3 0-2.6 0-3.5-.1-2.4-.1-3.5-1.2-3.6-3.6 0-1-.1-1.2-.1-3.5s0-2.6.1-3.5C2 3.1 3.1 2 5.5 1.9c.9-.1 1.2-.1 3.5-.1ZM9 0C6.6 0 6.3 0 5.4.1 2.1.2.2 2 .1 5.4 0 6.3 0 6.6 0 9s0 2.7.1 3.6c.1 3.3 2 5.2 5.3 5.3 1 .1 1.2.1 3.6.1s2.7 0 3.6-.1c3.3-.1 5.2-2 5.3-5.3.1-1 .1-1.2.1-3.6s0-2.7-.1-3.6C17.8 2.1 16 .2 12.6.1 11.7 0 11.4 0 9 0Zm0 4.4a4.6 4.6 0 1 0 0 9.2 4.6 4.6 0 0 0 0-9.2ZM9 12a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm4.8-8.9a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2Z',
					),
					'social_linkedin'  => array(
						'label' => 'LinkedIn',
						'path'  => 'M4 18H.3V6H4v12ZM2.1 4.4A2.2 2.2 0 0 1 0 2.2 2.2 2.2 0 0 1 2.2 0a2.2 2.2 0 0 1 2.1 2.2c0 1.2-1 2.2-2.2 2.2ZM18 18h-3.7v-5.8c0-1.4 0-3.2-2-3.2s-2.2 1.5-2.2 3.1V18H6.4V6H10v1.6h.1c.5-.9 1.7-2 3.5-2 3.8 0 4.5 2.5 4.5 5.7V18Z',
					),
				);
				foreach ( $ccn_topbar_social as $ccn_key => $ccn_soc ) :
					$ccn_url = ccn_setting( $ccn_key );
					if ( ! $ccn_url ) {
						continue;
					}
					?>
					<li>
						<a href="<?php echo esc_url( $ccn_url ); ?>" rel="noopener" target="_blank" aria-label="<?php echo esc_attr( $ccn_soc['label'] ); ?>">
							<svg class="ccn-icon" width="13" height="13" viewBox="0 0 18 18" fill="currentColor" aria-hidden="true"><path d="<?php echo esc_attr( $ccn_soc['path'] ); ?>"/></svg>
						</a>
					</li>
				<?php endforeach; ?>
			</ul>
		</div>
	</div>

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
			<?php if ( class_exists( 'WooCommerce' ) && function_exists( 'wc_get_cart_url' ) ) : ?>
				<?php $ccn_cart_count = ( WC()->cart ) ? WC()->cart->get_cart_contents_count() : 0; ?>
				<?php // No aria-label here: it would override the content and hide the visible count from the accessible name (axe label-content-name-mismatch); the screen-reader-text span below names the link. ?>
				<a class="header-cart" href="<?php echo esc_url( wc_get_cart_url() ); ?>">
					<svg class="ccn-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9h18l-1.7 9.6a2 2 0 0 1-2 1.6H6.7a2 2 0 0 1-2-1.6L3 9Z"/><path d="m8.6 9 3.4-6 3.4 6"/><path d="M9.5 13v3.5M14.5 13v3.5"/></svg>
					<span class="header-cart-count" aria-hidden="true"><?php echo esc_html( (string) $ccn_cart_count ); ?></span>
					<span class="screen-reader-text"><?php echo esc_html( sprintf( /* translators: %d: items in cart */ __( 'Warenkorb, %d Artikel', 'coin-container' ), $ccn_cart_count ) ); ?></span>
				</a>
			<?php endif; ?>

			<div class="header-search">
				<button class="search-toggle" aria-expanded="false" aria-controls="header-search-form">
					<svg class="ccn-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>
					<span class="screen-reader-text"><?php esc_html_e( 'Suche', 'coin-container' ); ?></span>
				</button>
				<form id="header-search-form" class="header-search-form" role="search" method="get" action="<?php echo esc_url( home_url( '/' ) ); ?>" hidden>
					<label class="screen-reader-text" for="header-search-input"><?php esc_html_e( 'Suche', 'coin-container' ); ?></label>
					<input id="header-search-input" type="search" name="s" placeholder="<?php esc_attr_e( 'Suchen …', 'coin-container' ); ?>" value="<?php echo esc_attr( get_search_query() ); ?>">
					<button type="submit" class="btn btn-primary"><?php esc_html_e( 'Suchen', 'coin-container' ); ?></button>
				</form>
			</div>
		</div>
	</div>
</header>

<main id="content" class="site-main">
