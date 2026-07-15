<?php
/**
 * Landing sidebar: "Unsere Dienstleistungen" service links (the current page
 * is skipped, as on the original) + the "Jetzt anfragen" card. All content
 * comes from Site Settings -> Landing sidebar via ccn_setting().
 */

$ccn_services = (array) ccn_setting( 'landing_services', array() );
$ccn_current  = untrailingslashit( (string) wp_parse_url( get_permalink(), PHP_URL_PATH ) );
$ccn_links    = array();
foreach ( $ccn_services as $ccn_row ) {
	$ccn_label = isset( $ccn_row['label'] ) ? trim( (string) $ccn_row['label'] ) : '';
	$ccn_url   = isset( $ccn_row['url'] ) ? trim( (string) $ccn_row['url'] ) : '';
	if ( '' === $ccn_label || '' === $ccn_url ) {
		continue;
	}
	if ( untrailingslashit( (string) wp_parse_url( $ccn_url, PHP_URL_PATH ) ) === $ccn_current ) {
		continue; // The original never links a landing to itself.
	}
	$ccn_links[] = array( $ccn_label, $ccn_url );
}

$ccn_card_title = ccn_setting( 'landing_card_title' );
$ccn_card_btn_t = ccn_setting( 'landing_card_button_text' );
$ccn_card_btn_u = ccn_setting( 'landing_card_button_url' );
?>
<aside class="ccn-landing-sidebar">
	<?php if ( $ccn_links ) : ?>
		<nav class="ccn-sidebar-services" aria-label="<?php esc_attr_e( 'Unsere Dienstleistungen', 'coin-container' ); ?>">
			<h2 class="ccn-sidebar-heading"><?php esc_html_e( 'Unsere Dienstleistungen', 'coin-container' ); ?></h2>
			<ul class="ccn-sidebar-services-list">
				<?php foreach ( $ccn_links as $ccn_link ) : ?>
					<li><a href="<?php echo esc_url( $ccn_link[1] ); ?>"><?php echo esc_html( $ccn_link[0] ); ?></a></li>
				<?php endforeach; ?>
			</ul>
		</nav>
	<?php endif; ?>

	<?php if ( $ccn_card_title && $ccn_card_btn_t && $ccn_card_btn_u ) : ?>
		<div class="ccn-sidebar-card">
			<img src="<?php echo esc_url( get_template_directory_uri() . '/assets/img/logo.webp' ); ?>" width="106" height="80" loading="lazy" alt="" aria-hidden="true">
			<p class="ccn-sidebar-card-title"><?php echo esc_html( $ccn_card_title ); ?></p>
			<a class="btn btn-dark" href="<?php echo esc_url( $ccn_card_btn_u ); ?>"><?php echo esc_html( $ccn_card_btn_t ); ?></a>
		</div>
	<?php endif; ?>
</aside>
