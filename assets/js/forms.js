/* Request forms (T-51, DESIGN.md "Forms"): after a CF7 submission move the focus
 * to the first invalid field or the response message (with CF7 only). */
(function () {
	function focusResult(e) {
		var form = e.target;
		setTimeout(function () { // CF7 marks the fields after the event
			// CF7 describes the consent wrapper, not the box
			form.querySelectorAll('.wpcf7-acceptance').forEach(function (s) {
				var d = s.getAttribute('aria-describedby'), c = s.querySelector('input');
				if (c) d ? c.setAttribute('aria-describedby', d) : c.removeAttribute('aria-describedby');
			});
			var el = e.type === 'wpcf7invalid' && form.querySelector('[aria-invalid="true"]');
			if (!el) {
				el = form.querySelector('.wpcf7-response-output');
				if (!el) return;
				el.removeAttribute('aria-hidden');
				el.tabIndex = -1;
			}
			el.focus();
		}, 0);
	}
	['wpcf7invalid', 'wpcf7mailsent', 'wpcf7mailfailed'].forEach(function (t) {
		document.addEventListener(t, focusResult);
	});
})();
