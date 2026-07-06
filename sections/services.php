<?php
/**
 * Section: services grid (numbered cards).
 */
?>
<section class="section section-services">
	<div class="section-inner">
		<?php if ( $ccn_h = get_sub_field( 'heading' ) ) : ?>
			<h2 class="section-heading"><?php echo esc_html( $ccn_h ); ?></h2>
		<?php endif; ?>
		<?php if ( $ccn_intro = get_sub_field( 'intro' ) ) : ?>
			<p class="section-intro"><?php echo esc_html( $ccn_intro ); ?></p>
		<?php endif; ?>
		<?php if ( have_rows( 'items' ) ) : ?>
			<div class="services-grid">
				<?php
				while ( have_rows( 'items' ) ) :
					the_row();
					$ccn_link_text = get_sub_field( 'link_text' );
					$ccn_link_url  = get_sub_field( 'link_url' );
					?>
					<article class="service-card">
						<?php if ( $ccn_num = get_sub_field( 'number' ) ) : ?>
							<span class="service-number"><?php echo esc_html( $ccn_num ); ?></span>
						<?php endif; ?>
						<?php if ( $ccn_t = get_sub_field( 'title' ) ) : ?>
							<h3 class="service-title"><?php echo esc_html( $ccn_t ); ?></h3>
						<?php endif; ?>
						<?php if ( $ccn_tx = get_sub_field( 'text' ) ) : ?>
							<p class="service-text"><?php echo esc_html( $ccn_tx ); ?></p>
						<?php endif; ?>
						<?php if ( $ccn_link_text && $ccn_link_url ) : ?>
							<a class="service-link" href="<?php echo esc_url( $ccn_link_url ); ?>"><?php echo esc_html( $ccn_link_text ); ?></a>
						<?php endif; ?>
					</article>
				<?php endwhile; ?>
			</div>
		<?php endif; ?>
	</div>
</section>
