/**
 * Coin Container main script. Loaded from the footer with defer (see
 * functions.php). Vanilla JS only — the theme ships zero jQuery.
 */
document.addEventListener('DOMContentLoaded', () => {
	// Mobile navigation toggle (burger).
	const toggle = document.querySelector('.nav-toggle');
	const nav = document.getElementById('site-nav');

	if (toggle && nav) {
		const closeNav = () => {
			toggle.setAttribute('aria-expanded', 'false');
			document.body.classList.remove('nav-open');
		};

		toggle.addEventListener('click', () => {
			const open = toggle.getAttribute('aria-expanded') === 'true';
			toggle.setAttribute('aria-expanded', String(!open));
			document.body.classList.toggle('nav-open', !open);
		});

		document.addEventListener('keydown', (e) => {
			if (e.key === 'Escape' && document.body.classList.contains('nav-open')) {
				closeNav();
				toggle.focus();
			}
		});

		document.addEventListener('click', (e) => {
			if (
				document.body.classList.contains('nav-open') &&
				!nav.contains(e.target) &&
				!toggle.contains(e.target)
			) {
				closeNav();
			}
		});
	}
});
