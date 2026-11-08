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

	// Sticky header: solid background + shadow (.is-stuck) once the sentinel at
	// the top of <body> (header.php) leaves the viewport. No scroll listener; it
	// also runs with reduced motion (a state, not an animation).
	const header = document.getElementById('header');
	const sentinel = document.querySelector('.ccn-header-sentinel');
	if (header && sentinel && 'IntersectionObserver' in window) {
		new IntersectionObserver((es) => header.classList.toggle('is-stuck', !es[es.length - 1].isIntersecting)).observe(sentinel);
	}

	// Motion (T-46, DESIGN.md "Motion"): one IntersectionObserver reveals the
	// [data-motion] blocks and [data-motion-stagger] grids below the fold and
	// starts the stats counters. html.ccn-motion, the class behind every hidden
	// state in theme.css, is set only here: without JS, without IO or with
	// prefers-reduced-motion nothing is hidden and no observer or rAF runs.
	if ('IntersectionObserver' in window && matchMedia('(prefers-reduced-motion: no-preference)').matches) {
		// 0 -> final value in 1200 ms (easeOutCubic, de-DE format, decimals kept).
		// Runs only with the reveal of its grid, which still sits at opacity 0, so
		// the final number printed in the HTML never visibly drops to 0.
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
			// 10 % visible, or simply entered when taller than the viewport.
			if (e.isIntersecting && (e.intersectionRatio >= 0.1 || e.boundingClientRect.height > window.innerHeight)) {
				io.unobserve(e.target);
				show(e.target);
			}
		}), { threshold: [0, 0.1], rootMargin: '0px 0px -5% 0px' });
		// Read all positions first, then write: whatever is in (or above) the
		// viewport now stays visible and never animates.
		const targets = [...document.querySelectorAll('[data-motion],[data-motion-stagger]')];
		const tops = targets.map((el) => el.getBoundingClientRect().top);
		targets.forEach((el, i) => (tops[i] < window.innerHeight ? el.classList.add('is-in') : io.observe(el)));
		document.documentElement.classList.add('ccn-motion');
	}
});
