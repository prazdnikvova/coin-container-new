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

	// Sticky header: .is-stuck once the header.php sentinel leaves the viewport (a state: also with reduced motion).
	const header = document.getElementById('header');
	const sentinel = document.querySelector('.ccn-header-sentinel');
	if (header && sentinel && 'IntersectionObserver' in window) {
		new IntersectionObserver((es) => header.classList.toggle('is-stuck', !es[es.length - 1].isIntersecting)).observe(sentinel);
	}

	// Motion (DESIGN.md "Motion"): reveal, stagger, counters. html.ccn-motion (all hidden states) only from here.
	if ('IntersectionObserver' in window && matchMedia('(prefers-reduced-motion: no-preference)').matches) {
		// 0 -> printed value in 1200 ms, easeOutCubic, de-DE; starts with its grid's reveal (still at opacity 0).
		const count = (el) => {
			const to = parseFloat(el.dataset.target) || 0;
			const dec = (el.dataset.target.split('.')[1] || '').length;
			const t0 = performance.now();
			const tick = (now) => {
				const p = Math.min((now - t0) / 1200, 1);
				el.textContent = (to * (1 - Math.pow(1 - p, 3))).toLocaleString('de-DE', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + (el.dataset.suffix || '');
				if (p < 1) requestAnimationFrame(tick);
			};
			requestAnimationFrame(tick);
		};
		const show = (el) => {
			el.classList.add('is-in', 'is-anim');
			if (el.hasAttribute('data-motion-stagger')) {
				[...el.children].forEach((c, i) => { c.style.animationDelay = Math.min(i * 80, 400) + 'ms'; });
			}
			el.querySelectorAll('.ccn-stat-number[data-target]').forEach((c) => {
				if (c.closest('[data-motion],[data-motion-stagger]') === el) count(c);
			});
		};
		const io = new IntersectionObserver((entries) => entries.forEach((e) => {
			// 10 % visible, or entered when taller than the viewport.
			if (e.isIntersecting && (e.intersectionRatio >= 0.1 || e.boundingClientRect.height > window.innerHeight)) {
				io.unobserve(e.target);
				show(e.target);
			}
		}), { threshold: [0, 0.1], rootMargin: '0px 0px -5% 0px' });
		// Reads first, then writes: in (or above) the viewport at load = visible, never animated.
		const targets = [...document.querySelectorAll('[data-motion],[data-motion-stagger]')];
		const tops = targets.map((el) => el.getBoundingClientRect().top);
		targets.forEach((el, i) => (tops[i] < window.innerHeight ? el.classList.add('is-in') : io.observe(el)));
		document.documentElement.classList.add('ccn-motion');
	}

	// Rail buttons: scroll by 80 % of the visible width; their row stays invisible until wired here.
	document.querySelectorAll('.ccn-rail-btn').forEach((b) => {
		const rail = document.getElementById(b.getAttribute('aria-controls'));
		if (!rail) return;
		b.parentNode.classList.add('is-ready');
		b.addEventListener('click', () => rail.scrollBy({
			left: b.dataset.dir * rail.clientWidth * 0.8,
			behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
		}));
	});
});
