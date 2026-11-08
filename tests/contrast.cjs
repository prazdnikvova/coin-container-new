#!/usr/bin/env node
/**
 * WCAG 2.x contrast calculator for the design tokens (T-45).
 *
 *   node contrast.cjs <fg> <bg> [<bg> ...]       ratio of one colour on each background
 *   node contrast.cjs --darken <hex> --on <bg>[,<bg>...] [--step 4] [--target 4.5]
 *                                                darken in HSL lightness steps (percentage
 *                                                points) until the colour passes on every bg
 *   node contrast.cjs --tokens [--json]          the token table documented in DESIGN.md
 *   node contrast.cjs --self-test                known reference pairs
 *
 * Ratio = (L1 + 0.05) / (L2 + 0.05) with sRGB relative luminance. Pass/fail is decided
 * on the unrounded ratio (WCAG: never round up); output shows two decimals, truncated.
 * AA thresholds: 4.5:1 normal text, 3:1 large text (>= 24px, or >= 18.66px bold) and
 * non-text UI parts.
 */
'use strict';

function hexToRgb(hex) {
	let h = String(hex).trim().replace(/^#/, '');
	if (h.length === 3) h = h.split('').map((c) => c + c).join('');
	if (!/^[0-9a-f]{6}$/i.test(h)) throw new Error(`not a hex colour: ${hex}`);
	return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

function rgbToHex(rgb) {
	return '#' + rgb.map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('');
}

function luminance(hex) {
	const lin = (c) => {
		const s = c / 255;
		return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
	};
	const [r, g, b] = hexToRgb(hex);
	return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function ratio(fg, bg) {
	const a = luminance(fg);
	const b = luminance(bg);
	return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

const fmt = (r) => (Math.floor(r * 100) / 100).toFixed(2);

function rgbToHsl([r, g, b]) {
	const [R, G, B] = [r / 255, g / 255, b / 255];
	const max = Math.max(R, G, B);
	const min = Math.min(R, G, B);
	const l = (max + min) / 2;
	let h = 0;
	let s = 0;
	if (max !== min) {
		const d = max - min;
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
		if (max === R) h = (G - B) / d + (G < B ? 6 : 0);
		else if (max === G) h = (B - R) / d + 2;
		else h = (R - G) / d + 4;
		h *= 60;
	}
	return [h, s * 100, l * 100];
}

function hslToRgb([h, s, l]) {
	const S = s / 100;
	const L = l / 100;
	const c = (1 - Math.abs(2 * L - 1)) * S;
	const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
	const m = L - c / 2;
	const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x]
		: h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
	return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}

/**
 * Sass-style darken(): lower HSL lightness by `step` percentage points per round,
 * keep hue and saturation, stop at the first colour that reaches `target` on all
 * backgrounds. Returns every round so the report can show the chain.
 */
function darkenUntil(hex, bgs, step = 4, target = 4.5) {
	const hsl = rgbToHsl(hexToRgb(hex));
	const rounds = [];
	for (let i = 0; i <= 25; i++) {
		const l = Math.max(0, hsl[2] - i * step);
		const c = i === 0 ? hex.toLowerCase() : rgbToHex(hslToRgb([hsl[0], hsl[1], l]));
		const ratios = bgs.map((bg) => ratio(c, bg));
		rounds.push({ step: i, lightness: Math.round(l * 10) / 10, hex: c, ratios });
		if (ratios.every((r) => r >= target)) break;
	}
	return rounds;
}

// The pairs documented in DESIGN.md (role, foreground, background, threshold).
const TOKEN_PAIRS = [
	['Brand yellow as text on white (forbidden)', '#f7c600', '#ffffff', 4.5],
	['Brand orange as text on white (forbidden)', '#ff7d44', '#ffffff', 4.5],
	['primary-text #a88400 on white (large only)', '#a88400', '#ffffff', 3],
	['primary-text #a88400 on light (large only)', '#a88400', '#f7f7f7', 3],
	['primary-text #a88400 on white as normal text', '#a88400', '#ffffff', 4.5],
	['primary-text-strong #8a6b00 on white', '#8a6b00', '#ffffff', 4.5],
	['primary-text-strong #8a6b00 on light', '#8a6b00', '#f7f7f7', 4.5],
	['A6 candidate #c4511f on white', '#c4511f', '#ffffff', 4.5],
	['A6 candidate #c4511f on light', '#c4511f', '#f7f7f7', 4.5],
	['accent-text #b24a1c on white', '#b24a1c', '#ffffff', 4.5],
	['accent-text #b24a1c on light', '#b24a1c', '#f7f7f7', 4.5],
	['secondary #605e5e on white', '#605e5e', '#ffffff', 4.5],
	['secondary #605e5e on light', '#605e5e', '#f7f7f7', 4.5],
	['text/link #202020 on white', '#202020', '#ffffff', 4.5],
	['text/link #202020 on light', '#202020', '#f7f7f7', 4.5],
	['text #202020 on brand yellow', '#202020', '#f7c600', 4.5],
	['text #202020 on brand orange', '#202020', '#ff7d44', 4.5],
	['white on secondary #605e5e', '#ffffff', '#605e5e', 4.5],
	['white on dark #141414', '#ffffff', '#141414', 4.5],
	['brand yellow on dark #141414', '#f7c600', '#141414', 4.5],
	['brand yellow on secondary #605e5e (icons, 3:1)', '#f7c600', '#605e5e', 3],
	['text-on-dark #d5d5d5 on dark', '#d5d5d5', '#141414', 4.5],
	['text-on-dark-muted #a5a5a5 on dark', '#a5a5a5', '#141414', 4.5],
	['old skip-link #007acc on light', '#007acc', '#f7f7f7', 4.5],
	['focus #202020 vs brand yellow (UI, 3:1)', '#202020', '#f7c600', 3],
];

function tokenRows() {
	return TOKEN_PAIRS.map(([role, fg, bg, need]) => {
		const r = ratio(fg, bg);
		return { role, fg, bg, ratio: Number(fmt(r)), need, pass: r >= need };
	});
}

function main(argv) {
	if (argv.includes('--self-test')) {
		const cases = [['#000000', '#ffffff', 21], ['#ffffff', '#ffffff', 1], ['#777777', '#ffffff', 4.47], ['#767676', '#ffffff', 4.54]];
		let bad = 0;
		for (const [a, b, want] of cases) {
			const got = Number(fmt(ratio(a, b)));
			const okay = Math.abs(got - want) < 0.011;
			if (!okay) bad++;
			console.log(`${okay ? 'PASS' : 'FAIL'} ${a} on ${b}: ${got} (want ${want})`);
		}
		process.exit(bad ? 1 : 0);
	}
	if (argv.includes('--tokens')) {
		const rows = tokenRows();
		if (argv.includes('--json')) {
			console.log(JSON.stringify(rows, null, 1));
			return;
		}
		console.log('| Pair | Fg | Bg | Ratio | Needs | AA |');
		console.log('|---|---|---|---|---|---|');
		for (const r of rows) console.log(`| ${r.role} | \`${r.fg}\` | \`${r.bg}\` | ${r.ratio.toFixed(2)}:1 | ${r.need}:1 | ${r.pass ? 'pass' : 'FAIL'} |`);
		return;
	}
	const di = argv.indexOf('--darken');
	if (di !== -1) {
		const hex = argv[di + 1];
		const oi = argv.indexOf('--on');
		const bgs = oi !== -1 ? argv[oi + 1].split(',') : ['#ffffff'];
		const si = argv.indexOf('--step');
		const ti = argv.indexOf('--target');
		const step = si !== -1 ? Number(argv[si + 1]) : 4;
		const target = ti !== -1 ? Number(argv[ti + 1]) : 4.5;
		for (const r of darkenUntil(hex, bgs, step, target)) {
			const parts = r.ratios.map((x, i) => `${fmt(x)}:1 on ${bgs[i]}`).join(', ');
			const pass = r.ratios.every((x) => x >= target);
			console.log(`step ${r.step} L=${r.lightness}% ${r.hex}  ${parts}  ${pass ? 'PASS' : 'below ' + target}`);
		}
		return;
	}
	const colours = argv.filter((a) => !a.startsWith('--'));
	if (colours.length < 2) {
		console.log('usage: node contrast.cjs <fg> <bg> [<bg> ...] | --darken <hex> --on <bg,...> | --tokens | --self-test');
		process.exit(2);
	}
	const [fg, ...bgs] = colours;
	for (const bg of bgs) {
		const r = ratio(fg, bg);
		console.log(`${fg} on ${bg}: ${fmt(r)}:1  normal ${r >= 4.5 ? 'pass' : 'FAIL'}  large ${r >= 3 ? 'pass' : 'FAIL'}`);
	}
}

module.exports = { hexToRgb, rgbToHex, luminance, ratio, darkenUntil, tokenRows };

if (require.main === module) main(process.argv.slice(2));
