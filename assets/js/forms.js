/* Request forms (T-51, DESIGN.md "Forms"): focus the result of a CF7 submission. */
(function () {
	function onResult(e) {
		var form = e.target;
		setTimeout(function () { // after CF7 has marked the fields
			form.querySelectorAll('.wpcf7-acceptance').forEach(function (s) {
				var a = 'aria-describedby', d = s.getAttribute(a), c = s.querySelector('input');
				if (c) d ? c.setAttribute(a, d) : c.removeAttribute(a);
			});
			var el = e.type === 'wpcf7invalid' && form.querySelector('[aria-invalid="true"]');
			if (!el) {
				el = form.querySelector('.wpcf7-response-output');
				if (!el) return;
				// hidden while CF7 resets a sent form
				if (!el.offsetParent) return form.addEventListener('wpcf7reset', function () { onResult(e); }, { once: true });
				el.removeAttribute('aria-hidden');
				el.tabIndex = -1;
			}
			el.focus();
		}, 0);
	}
	['invalid', 'mailsent', 'mailfailed'].forEach(function (t) {
		document.addEventListener('wpcf7' + t, onResult);
	});
})();
