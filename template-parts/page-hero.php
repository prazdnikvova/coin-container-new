<?php
/**
 * Full-width hero band shared by the landing templates: featured image as a
 * responsive eager <img> (the page's LCP element, preloaded in
 * ccn_preload_hero) with the page title as the only H1, then the global
 * landing call to action and the phone line (Site Settings → Calls to action,
 * same partial as the home hero: template-parts/hero-cta.php). A page that
 * opens with the request form (first block acf/form-card, the contact pages)
 * keeps only the phone line: the form is its call to action. The
 * breadcrumbs follow under the band, on white (inc/seo.php).
 */
?>
<section class="ccn-page-hero">
	<?php
	if ( has_post_thumbnail() ) {
		// Soft (scaled) size, never a hard crop: cropping changes the aspect
		// ratio, so WP drops every scaled variant from the srcset and mobile
		// gets the full file. The band crops via object-fit. Every hero in
		// this theme uses this size — see the note in functions.php.
		the_post_thumbnail(
			'1536x1536',
			array(
				'class'         => 'ccn-page-hero-img',
				'sizes'         => '100vw',
				'loading'       => 'eager',
				'fetchpriority' => 'high',
			)
		);
	}
	?>
	<div class="ccn-page-hero-inner ccn-container">
		<h1 class="ccn-page-hero-title"><?php the_title(); ?></h1>
		<?php
		get_template_part(
			'template-parts/hero-cta',
			null,
			array(
				'primary_text' => ccn_page_leads_with_form() ? '' : ccn_setting( 'hero_cta_text' ),
				'primary_url'  => ccn_setting( 'hero_cta_url', ccn_setting( 'anfrage_url' ) ),
			)
		);
		?>
	</div>
</section>
<?php
ccn_breadcrumbs( 'ccn-container' );
