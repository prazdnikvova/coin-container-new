<?php
/**
 * Hero calls to action (T-47, DESIGN.md "Hero"): a primary button, an optional
 * outlined light secondary one and the phone line from Site Settings. Shared by
 * the home hero block and the landing hero band (template-parts/page-hero.php),
 * so both first screens carry the same CTA and phone components.
 *
 * @var array $args {
 *     Passed by get_template_part().
 *
 *     @type string $primary_text   Primary button label (printed after a decorative +, as on production).
 *     @type string $primary_url    Primary button URL.
 *     @type string $secondary_text Secondary button label.
 *     @type string $secondary_url  Secondary button URL.
 *     @type bool   $phone          Print the phone line. Default true.
 * }
 */

$ccn_cta = wp_parse_args(
	isset( $args ) ? (array) $args : array(),
	array(
		'primary_text'   => '',
		'primary_url'    => '',
		'secondary_text' => '',
		'secondary_url'  => '',
		'phone'          => true,
	)
);
$ccn_cta_primary   = $ccn_cta['primary_text'] && $ccn_cta['primary_url'];
$ccn_cta_secondary = $ccn_cta['secondary_text'] && $ccn_cta['secondary_url'];
$ccn_cta_tel       = $ccn_cta['phone'] ? ccn_phone_href() : '';

if ( $ccn_cta_primary || $ccn_cta_secondary ) :
	?>
	<div class="ccn-hero-cta">
		<?php if ( $ccn_cta_primary ) : ?>
			<a class="btn btn-primary" href="<?php echo esc_url( $ccn_cta['primary_url'] ); ?>"><span aria-hidden="true">+</span> <?php echo esc_html( $ccn_cta['primary_text'] ); ?></a>
		<?php endif; ?>
		<?php if ( $ccn_cta_secondary ) : ?>
			<a class="btn btn-outline-light" href="<?php echo esc_url( $ccn_cta['secondary_url'] ); ?>"><?php echo esc_html( $ccn_cta['secondary_text'] ); ?></a>
		<?php endif; ?>
	</div>
	<?php
endif;

if ( $ccn_cta_tel ) :
	?>
	<a class="ccn-phone-line" href="<?php echo esc_url( $ccn_cta_tel ); ?>"><?php echo ccn_phone_icon( 20 ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static SVG. ?><?php echo esc_html( ccn_setting( 'phone' ) ); ?></a>
	<?php
endif;
