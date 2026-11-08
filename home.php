<?php
/**
 * Blog index (the "Posts page" from Settings -> Reading, is_home()). Takes
 * priority over index.php so the page gets exactly one H1: the title of that
 * posts page. The post cards below stay H2 (entry.php).
 */

get_header();

$ccn_blog_page  = (int) get_option( 'page_for_posts' );
$ccn_blog_title = $ccn_blog_page ? get_the_title( $ccn_blog_page ) : '';
if ( '' === $ccn_blog_title ) {
	$ccn_blog_title = __( 'Blog', 'coin-container' );
}
?>
<div class="archive-header">
	<h1 class="archive-title"><?php echo esc_html( $ccn_blog_title ); ?></h1>
</div>

<?php if ( have_posts() ) : ?>
	<?php
	while ( have_posts() ) :
		the_post();
		get_template_part( 'entry' );
	endwhile;
	?>
	<?php get_template_part( 'nav', 'below' ); ?>
<?php endif; ?>

<?php get_footer(); ?>
