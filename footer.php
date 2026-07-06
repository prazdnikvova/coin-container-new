</main>

<footer id="footer" class="site-footer">
	<div class="footer-inner">
		<div class="footer-col footer-about">
			<img class="footer-logo" src="<?php echo esc_url( get_template_directory_uri() . '/assets/img/logo.png' ); ?>" width="79" height="60" alt="" loading="lazy">
			<?php $ccn_tagline = ccn_setting( 'footer_tagline' ); ?>
			<?php if ( $ccn_tagline ) : ?>
				<p class="footer-tagline"><?php echo esc_html( $ccn_tagline ); ?></p>
			<?php endif; ?>
		</div>

		<div class="footer-col footer-contact">
			<h2 class="footer-heading"><?php esc_html_e( 'Kontakt', 'coin-container' ); ?></h2>
			<?php $ccn_company = ccn_setting( 'company_name' ); ?>
			<?php if ( $ccn_company ) : ?>
				<p class="footer-company"><?php echo esc_html( $ccn_company ); ?></p>
			<?php endif; ?>
			<?php $ccn_address = ccn_setting( 'address' ); ?>
			<?php if ( $ccn_address ) : ?>
				<p class="footer-address"><?php echo esc_html( $ccn_address ); ?></p>
			<?php endif; ?>
			<?php $ccn_phone = ccn_setting( 'phone' ); ?>
			<?php if ( $ccn_phone ) : ?>
				<p><a href="tel:<?php echo esc_attr( preg_replace( '/[^0-9+]/', '', $ccn_phone ) ); ?>"><?php echo esc_html( $ccn_phone ); ?></a></p>
			<?php endif; ?>
			<?php $ccn_email = ccn_setting( 'email' ); ?>
			<?php if ( $ccn_email ) : ?>
				<p><a href="mailto:<?php echo esc_attr( $ccn_email ); ?>"><?php echo esc_html( $ccn_email ); ?></a></p>
			<?php endif; ?>
		</div>

		<div class="footer-col footer-links">
			<h2 class="footer-heading"><?php esc_html_e( 'Rechtliches', 'coin-container' ); ?></h2>
			<?php
			wp_nav_menu(
				array(
					'theme_location' => 'footer',
					'container'      => false,
					'menu_class'     => 'footer-menu',
					'fallback_cb'    => false,
				)
			);
			?>
		</div>

		<div class="footer-col footer-social">
			<h2 class="footer-heading"><?php esc_html_e( 'Folgen Sie uns', 'coin-container' ); ?></h2>
			<ul class="footer-social-list">
				<?php
				$ccn_socials = array(
					'social_facebook'  => 'Facebook',
					'social_instagram' => 'Instagram',
					'social_linkedin'  => 'LinkedIn',
					'social_ebay'      => 'eBay',
					'social_pinterest' => 'Pinterest',
					'social_xing'      => 'Xing',
				);
				foreach ( $ccn_socials as $ccn_key => $ccn_label ) :
					$ccn_url = ccn_setting( $ccn_key );
					if ( ! $ccn_url ) {
						continue;
					}
					?>
					<li><a href="<?php echo esc_url( $ccn_url ); ?>" rel="noopener" target="_blank"><?php echo esc_html( $ccn_label ); ?></a></li>
				<?php endforeach; ?>
			</ul>
		</div>
	</div>

	<div class="site-copyright">
		&copy; <?php echo esc_html( wp_date( 'Y' ) ); ?> <?php echo esc_html( ccn_setting( 'company_name', get_bloginfo( 'name' ) ) ); ?>
	</div>
</footer>

<?php wp_footer(); ?>
</body>
</html>
