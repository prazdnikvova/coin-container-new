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

	// Header search toggle.
	const searchToggle = document.querySelector('.search-toggle');
	const searchForm = document.getElementById('header-search-form');

	if (searchToggle && searchForm) {
		const closeSearch = () => {
			searchToggle.setAttribute('aria-expanded', 'false');
			searchForm.hidden = true;
		};

		searchToggle.addEventListener('click', () => {
			const open = searchToggle.getAttribute('aria-expanded') === 'true';
			searchToggle.setAttribute('aria-expanded', String(!open));
			searchForm.hidden = open;
			if (!open) {
				searchForm.querySelector('input[type="search"]').focus();
			}
		});

		document.addEventListener('keydown', (e) => {
			if (e.key === 'Escape' && !searchForm.hidden) {
				closeSearch();
				searchToggle.focus();
			}
		});

		document.addEventListener('click', (e) => {
			if (!searchForm.hidden && !searchForm.contains(e.target) && !searchToggle.contains(e.target)) {
				closeSearch();
			}
		});
	}

	// Sticky header shadow once the page scrolls.
	const header = document.getElementById('header');
	if (header) {
		const onScroll = () => header.classList.toggle('is-stuck', window.scrollY > 8);
		onScroll();
		window.addEventListener('scroll', onScroll, { passive: true });
	}

	// Stats block: count numbers up once the block scrolls into view.
	const counters = document.querySelectorAll('.ccn-stat-number[data-target]');
	if (counters.length && 'IntersectionObserver' in window) {
		const animate = (el) => {
			const target = parseInt(el.dataset.target, 10) || 0;
			const suffix = el.dataset.suffix || '';
			const duration = 1200;
			const start = performance.now();
			const tick = (now) => {
				const p = Math.min((now - start) / duration, 1);
				el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + suffix;
				if (p < 1) requestAnimationFrame(tick);
			};
			requestAnimationFrame(tick);
		};
		const seen = new WeakSet();
		const io = new IntersectionObserver((entries) => {
			entries.forEach((e) => {
				if (e.isIntersecting && !seen.has(e.target)) {
					seen.add(e.target);
					animate(e.target);
					io.unobserve(e.target);
				}
			});
		}, { threshold: 0.4 });
		counters.forEach((c) => io.observe(c));
	}
});
