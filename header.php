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
	<div class="site-branding">
		<?php if ( has_custom_logo() ) : ?>
			<?php the_custom_logo(); ?>
		<?php else : ?>
			<?php $ccn_title_tag = ( is_front_page() || is_home() ) ? 'h1' : 'p'; ?>
			<<?php echo tag_escape( $ccn_title_tag ); ?> class="site-title">
				<a href="<?php echo esc_url( home_url( '/' ) ); ?>" rel="home"><?php echo esc_html( get_bloginfo( 'name' ) ); ?></a>
			</<?php echo tag_escape( $ccn_title_tag ); ?>>
			<?php $ccn_description = get_bloginfo( 'description', 'display' ); ?>
			<?php if ( $ccn_description ) : ?>
				<p class="site-description"><?php echo esc_html( $ccn_description ); ?></p>
			<?php endif; ?>
		<?php endif; ?>
	</div>

	<nav class="site-nav" aria-label="<?php esc_attr_e( 'Primary Navigation', 'coin-container' ); ?>">
		<?php
		wp_nav_menu(
			array(
				'theme_location' => 'primary',
				'fallback_cb'    => false,
			)
		);
		?>
	</nav>
</header>

<main id="content" class="site-main">
