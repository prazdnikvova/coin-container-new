<?php
/**
 * Full-width hero band shared by the landing templates: featured image as a
 * responsive eager <img> (the page's LCP element, preloaded in
 * ccn_preload_hero) with the page title as the only H1.
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
	</div>
</section>
