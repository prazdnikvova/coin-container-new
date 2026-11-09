<?php
/**
 * Curated /llms.txt (format: https://llmstxt.org), ported 1:1 from production
 * (transmax-child/inc/llms-txt.php): the topic hubs, the cluster pages and the
 * key guides with one sentence each, for AI assistants.
 *
 * - The list lives in code, as on production (filter ccn_llms_txt_sections).
 *   An entry whose page or post is missing or not published is left out, so
 *   the file never links to a 404. Links are built with home_url(), so the
 *   same list works on every environment.
 * - Virtual route: /llms.txt is answered on template_redirect (before the
 *   canonical redirect), as text/plain with X-Robots-Tag: noindex sent by PHP.
 * - Static copy: in production the same text is also written to
 *   ABSPATH/llms.txt whenever a page or post is saved, so the web server
 *   serves the file without booting WordPress (production: 0.1 s instead of
 *   ~1.1 s). The web server then sends the noindex header itself (production:
 *   <Files "llms.txt"> in the root .htaccess). Local sites stay on the PHP
 *   route, where PHP sends the header.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Sections of the file: title => list of [ slug, description ] or
 * [ slug, label, description ]. Without a label the page title is printed.
 *
 * @return array<string, array<int, array<int, string>>>
 */
function ccn_llms_txt_sections() {
	$sections = array(
		'Themen-Hubs'             => array(
			array( 'container-kaufen', 'Seecontainer und Lagercontainer kaufen – neu, One Way und gebraucht, mit Größen, Zuständen, Preisen und Ablauf.' ),
			array( 'container-mieten', 'Ergänzend zum Kauf: Lager-, Büro-, Sanitär-, Kühl- und Materialcontainer mieten, betriebsfertig geliefert.' ),
			array( 'container-transport-logistik', 'Containertransport & Logistik', 'Zustellarten, Kran-LKW, Kippchassis, Kosten und Ablauf.' ),
			array( 'container-modifikation-umbau-dienstleistungen', 'Container umbauen und modifizieren: Türen, Fenster, Dämmung, Elektrik, Lackierung – aus einer Hand organisiert.' ),
			array( 'container-ratgeber', 'Container-Ratgeber', 'Überblick zu Containertypen, Maßen, Zuständen, Preisen, Baugenehmigung und Umbau, mit weiterführenden Detail-Ratgebern.' ),
			array( 'containerzubehoer', 'Containerzubehör und Ersatzteile: Schlösser, Twist Locks, Bridge Fittings, Auffahrrampen, Türdichtungen.' ),
		),
		'Kaufen – Detailseiten'   => array(
			array( 'seecontainer-preise', 'Was kostet ein Seecontainer? Richtwerte nach Größe und Zustand, Kostenfaktoren und ein Rechenbeispiel inklusive Transport.' ),
			array( 'gebrauchte-seecontainer-kaufen', 'Gebrauchte Seecontainer kaufen: Zustandsklassen (WWT, CW, One Way, IICL-5), Preisrahmen und Prüf-Checkliste.' ),
			array( '20-fuss-container-kaufen', '20 Fuß Container kaufen: Maße, Volumen, Standard vs. High Cube, Zustände, Preise, Lieferung.' ),
			array( '40-fuss-container-kaufen', '40 Fuß Container kaufen: Standard und High Cube, Maße, wann ein 40 Fuß statt zwei 20 Fuß, Preise.' ),
			array( '8-fuss-container-kaufen', '8 Fuß Container kaufen: kompakter Lagercontainer für Werkzeug und Garten, Maße, Abgrenzung zu 10 und 20 Fuß.' ),
			array( 'isoliercontainer-kaufen', 'Isoliercontainer kaufen: passiv gedämmt ohne Stromanschluss, Unterschied zum Kühlcontainer, Aufbau, Einsatz.' ),
			array( 'ueberseecontainer-kaufen', 'Überseecontainer kaufen: was Übersee-, Schiffs- und Seecontainer unterscheidet, Größen, Bauformen, Zustand, Preise.' ),
			array( 'wohncontainer', 'Wohncontainer mieten, kaufen oder aus einem Seecontainer umbauen: Ausstattung, Baugenehmigung, Kosten.' ),
			array( 'containerschloss', 'Containerschloss richtig wählen: Lock Box, Riegelschloss, elektronische Schlösser – Schutzniveau und Montage.' ),
			array( 'buerocontainer-kaufen', 'Bürocontainer kaufen: gedämmte, mobile Büros in 10 bis 40 Fuß mit Elektrik, Heizung und Fenstern, Einsatz und Genehmigung.' ),
			array( 'sanitaercontainer-kaufen', 'Sanitärcontainer kaufen: WC-, Dusch-, Kombi- und barrierefreie Container, autark mit Abwassertank (ca. 2.300 bis 8.300 l), Größen und Einsatz.' ),
			array( 'container-projekte-referenzen', 'Container-Projekte und Referenzen', 'Realisierte Projekte: Umlackierungen, Personentüren, Rolltore, Stahl- und Aluminiumböden, Isolierung, Barcontainer, Bühne, Dosierstation.' ),
			array( 'container-ideen-inspiration', 'Container Ideen und Inspiration', 'Einsatzideen: Tiny House, Gastro und Kiosk, Unterkunft, Pool, Sauna, Fitness, Geschäft und Lager.' ),
		),
		'Mieten – Detailseiten'   => array(
			array( 'lagercontainer-mieten', 'Lagercontainer mieten in 10, 20 und 40 Fuß: abschließbar, wetterfest, schnelle Lieferung ab wenigen Werktagen.' ),
			array( 'kuehlcontainer-mieten', 'Kühl- und Tiefkühlcontainer mieten für Gastro, Ernte und Pufferkühlung, auch ohne Netzanschluss mit Aggregat.' ),
			array( 'materialcontainer-mieten', 'Materialcontainer mieten: diebstahlsicherer Stauraum für Werkzeug, Maschinen und Baumaterial auf der Baustelle.' ),
			array( 'sanitaercontainer-mieten', 'WC-, Dusch- und Kombicontainer mieten für Baustelle und Event, betriebsfertig geliefert.' ),
			array( 'buerocontainer-mieten', 'Bürocontainer mieten', 'Bürocontainer mieten für Baustelle, Umbau, Messe und Event: ausgestattet, geliefert und abgeholt.' ),
		),
		'Wissen / Ratgeber'       => array(
			array( 'container-masse-groessen', 'Alle Container-Maße: Außen- und Innenmaße, Türöffnung, Gewicht und Volumen für 20 Fuß, 40 Fuß, High Cube und Spezialcontainer.' ),
			array( 'seecontainer-baugenehmigung', 'Ob ein Seecontainer genehmigungspflichtig ist, hängt von Nutzung, Größe, Dauer und Bundesland ab – alle Fälle im Überblick.' ),
			array( 'container-daemmen-isolieren', 'Container dämmen: Materialvergleich (PU, PIR, Mineralwolle, Armaflex), Schichtaufbau, Wärmebrücken, Dampfsperre, Fehler.' ),
			array( 'container-lackierung', 'Container lackieren: Vorbereitung, 2K- oder 1K-Lacksystem, Spritzen oder Rolle, RAL-Farbwahl, Haltbarkeit.' ),
			array( 'seecontainer-umbauen-ideen', 'Seecontainer umbauen: 10 Ideen vom Gartenbüro bis zur Sauna, Aufwand je Gewerk, Reihenfolge beim Ausbau.' ),
			array( 'seecontainer-lieferung-absetzen', 'Seecontainer liefern lassen: Zustellarten im Vergleich, Platzbedarf für Kran-LKW und Kippchassis, Untergrund, Checkliste.' ),
			array( 'iso-container-einfach-erklaert', 'ISO-Container einfach erklärt', 'Was ist ein ISO-Container? Normung nach ISO 668, Maße, Kennzeichnung und die CSC-Plakette einfach erklärt.' ),
			array( 'seecontainer-sicher-kaufen', 'Seecontainer sicher kaufen', 'Unseriöse Container-Shops erkennen, Prüfpunkte vor der Überweisung, sichere Zahlung und was im Betrugsfall zu tun ist.' ),
			array( 'glossar', 'Container-Glossar', 'Fachbegriffe rund um See- und Lagercontainer kurz erklärt: CSC-Plakette, High Cube, Cargo Worthy, Twistlock, Wärmebrücke und mehr.' ),
			array( 'kondenswasser-im-container-wie-man-es-vermeidet-und-was-wirklich-zaehlt', 'Kondenswasser im Container vermeiden', 'Kondenswasser im Container: Ursachen, was gegen Schwitzwasser wirklich hilft, Lüftung und Dämmung.' ),
			array( 'containerkauf-teure-fehler', 'Teure Fehler beim Containerkauf', 'Die häufigsten und teuersten Fehler beim Containerkauf – und wie man sie vermeidet.' ),
			array( 'container-mieten-oder-kaufen-ratgeber-2026', 'Container kaufen oder mieten', 'Container kaufen oder mieten? Faustregel, Rechenbeispiel und wann sich welche Variante lohnt.' ),
		),
		'Transport'               => array(
			array( 'container-transport-europa', 'Containertransport in Europa: typische Relationen, LKW vs. Schiene vs. Binnenschiff, Ablauf, Zoll, Kosten.' ),
			array( 'container-transport-kosten-lieferzeiten-seecontainer', 'Containertransport – Kosten und Lieferzeiten', 'Warum Frachtpreise schwanken und was den Preis bestimmt.' ),
		),
		'Standorte'               => array(
			array( 'seecontainer-kaufen-hamburg', 'Seecontainer kaufen in Hamburg', 'Schnelle Lieferung im Großraum Hamburg; Firmensitz Weidestraße 122B.' ),
			array( 'seecontainer-kaufen-bremen', 'Seecontainer kaufen in Bremen und Bremerhaven: Lieferung in die Region.' ),
			array( 'seecontainer-kaufen-duisburg', 'Seecontainer kaufen in Duisburg und im Ruhrgebiet: Lieferung, Zufahrt zu Hafen- und Werksgeländen, Genehmigung in NRW.' ),
			array( 'container-ab-rotterdam-antwerpen', 'Container ab Rotterdam und Antwerpen: attraktive Einkaufspreise, geprüfter Zustand, Lieferung nach Deutschland.' ),
			array( 'seecontainer-kaufen-frankfurt', 'Seecontainer kaufen in Frankfurt und Rhein-Main: Lieferung, Zufahrt, Genehmigung in Hessen.' ),
			array( 'seecontainer-kaufen-muenchen', 'Seecontainer kaufen in München und Oberbayern: Lieferung inklusive, Events und Baustellen, Genehmigung in Bayern.' ),
			array( 'seecontainer-kaufen-stuttgart', 'Seecontainer kaufen in Stuttgart und Baden-Württemberg: Zufahrt in Hanglagen, Lieferung, Genehmigung.' ),
			array( 'seecontainer-kaufen-berlin', 'Seecontainer kaufen in Berlin und Brandenburg: Lieferung, Halteverbotszone, Genehmigung in Berlin.' ),
			array( 'lagercontainer-mieten-hamburg', 'Lagercontainer mieten in Hamburg: Anlieferung meist innerhalb weniger Werktage, Selbstabholung nach Absprache.' ),
			array( 'gebrauchte-seecontainer-in-cuxhaven', 'Gebrauchte Seecontainer in Cuxhaven', 'Gebrauchte Seecontainer an der Nordseeküste, inkl. Referenzprojekt Cuxport GmbH.' ),
		),
		'Unternehmen'             => array(
			array( 'ueber-uns', 'Coin Container / Coin Container Inspiration GmbH, Hamburg – Handel, Vermietung, Transport und Umbau von Containern, präqualifiziertes Unternehmen.' ),
			array( 'bewertungen', 'Kundenbewertungen', 'Bewertungen bei Trustpilot (4,5 von 5, 13 Bewertungen) und Google (126 Bewertungen), Stand 20.09.2026.' ),
			array( 'ansprechpartner', 'Ansprechpartner', 'Feste Ansprechpartner für Geschäftsführung, Transport und Logistik, Vertrieb, Strategie und Back Office.' ),
			array( 'zertifikate', 'Zertifikate und Nachweise', 'Zertifikat der Handelskammer Hamburg: Eintrag im Amtlichen Verzeichnis präqualifizierter Unternehmen; Firmendaten, Handelsregister HRB 180174.' ),
			array( 'kontakt-beratung', 'Kontakt und Beratung: Telefon +49 40 561 236 56, Weidestraße 122B, 22083 Hamburg.' ),
			array( 'allgemeine-geschaeftsbedingungen-agb', 'Allgemeine Geschäfts- und Mietbedingungen der Coin Container Inspiration GmbH.' ),
		),
	);

	return (array) apply_filters( 'ccn_llms_txt_sections', $sections );
}

/**
 * The text of the file (Markdown, as on production).
 *
 * @return string
 */
function ccn_llms_txt_body() {
	$out  = "# Coin Container\n\n";
	$out .= "> Coin Container (Coin Container Inspiration GmbH, Hamburg) handelt mit, vermietet, transportiert und baut See- und Lagercontainer um – neu, One Way und gebraucht, europaweit. Firmensitz: Weidestraße 122B, 22083 Hamburg. Telefon +49 40 561 236 56.\n\n";
	$out .= "Präqualifiziertes Unternehmen (Amtliches Verzeichnis präqualifizierter Unternehmen). USt-IdNr. DE360770017, HRB 180174 Hamburg.\n\n";

	foreach ( ccn_llms_txt_sections() as $title => $items ) {
		$lines = array();
		foreach ( (array) $items as $item ) {
			$item  = array_values( (array) $item );
			$slug  = (string) ( $item[0] ?? '' );
			$label = 3 === count( $item ) ? (string) $item[1] : '';
			$desc  = (string) ( 3 === count( $item ) ? $item[2] : ( $item[1] ?? '' ) );
			$post  = '' !== $slug ? get_page_by_path( $slug, OBJECT, array( 'page', 'post' ) ) : null;
			if ( ! $post || 'publish' !== $post->post_status ) {
				continue;
			}
			// get_the_title() is HTML-escaped (& -> &#038;); llms.txt is plain Markdown.
			$name    = '' !== $label ? $label : html_entity_decode( wp_strip_all_tags( get_the_title( $post ) ), ENT_QUOTES | ENT_HTML5, 'UTF-8' );
			$lines[] = '- [' . $name . '](' . home_url( '/' . $slug . '/' ) . '): ' . $desc;
		}
		if ( $lines ) {
			$out .= '## ' . $title . "\n" . implode( "\n", $lines ) . "\n\n";
		}
	}

	$out .= "## Optional\n";
	$out .= '- [Sitemap-Index](' . home_url( '/sitemap_index.xml' ) . ")\n";

	return $out;
}

/**
 * Whether the static copy is written: production only (filter
 * ccn_llms_txt_write_static). Elsewhere the PHP route answers, which sends
 * the noindex header itself.
 *
 * @return bool
 */
function ccn_llms_txt_static_enabled() {
	return (bool) apply_filters( 'ccn_llms_txt_write_static', 'production' === wp_get_environment_type() );
}

/**
 * Write the static copy ABSPATH/llms.txt. Never replaces the file with an
 * empty one.
 *
 * @return bool False when nothing was written.
 */
function ccn_llms_txt_write_static() {
	if ( ! ccn_llms_txt_static_enabled() ) {
		return false;
	}
	$file = ABSPATH . 'llms.txt';
	if ( file_exists( $file ) ? ! wp_is_writable( $file ) : ! wp_is_writable( ABSPATH ) ) {
		return false;
	}
	$body = ccn_llms_txt_body();
	if ( '' === trim( $body ) ) {
		return false;
	}
	// Direct write with a lock, as on production: WP_Filesystem may ask for FTP credentials on save.
	return false !== file_put_contents( $file, $body, LOCK_EX ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
}

add_action( 'save_post', 'ccn_llms_txt_on_save', 20, 2 );
/**
 * Refresh the static copy when a page or post is saved.
 *
 * @param int     $post_id Post ID.
 * @param WP_Post $post    Post object.
 */
function ccn_llms_txt_on_save( $post_id, $post ) {
	if ( wp_is_post_revision( $post_id ) || wp_is_post_autosave( $post_id ) ) {
		return;
	}
	if ( ! $post instanceof WP_Post || ! in_array( $post->post_type, array( 'page', 'post' ), true ) ) {
		return;
	}
	ccn_llms_txt_write_static();
}

add_action( 'template_redirect', 'ccn_llms_txt_route', 0 );
/**
 * Answer /llms.txt (the request is a 404 for WordPress: no page has that path).
 */
function ccn_llms_txt_route() {
	$home = trim( (string) wp_parse_url( home_url( '/' ), PHP_URL_PATH ), '/' );
	$path = isset( $_SERVER['REQUEST_URI'] ) ? trim( (string) wp_parse_url( esc_url_raw( wp_unslash( $_SERVER['REQUEST_URI'] ) ), PHP_URL_PATH ), '/' ) : '';
	if ( ltrim( $home . '/llms.txt', '/' ) !== $path ) {
		return;
	}
	status_header( 200 );
	nocache_headers();
	header( 'Content-Type: text/plain; charset=utf-8' );
	header( 'X-Robots-Tag: noindex' );
	echo ccn_llms_txt_body(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- text/plain, not HTML.
	exit;
}
