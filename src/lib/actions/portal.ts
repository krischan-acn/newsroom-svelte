// lib/actions/portal.ts
//
// Moves an element to the end of <body> - Svelte's stand-in for React's
// createPortal. Tooltips and menus need it: a `position: fixed` element is
// positioned against the nearest transformed ancestor, not the viewport, and
// list rows sit inside several of those.

export function portal(node: HTMLElement) {
	document.body.appendChild(node);
	return {
		destroy() {
			node.remove();
		}
	};
}
