// lib/actions/image.ts
//
// Image load/error handling without an inline handler.
//
// Svelte server-renders `onload="this.__e=event"` onto any <img> that has a
// load/error handler or an action, so it can replay events that fire before
// hydration. The site's Content-Security-Policy forbids inline handlers, so
// those attributes would be blocked and reported on every page.
//
// These actions therefore go on a CONTAINER, not the image. load and error do
// not bubble, but they can be caught in the capture phase on an ancestor. Images
// that already finished before hydration are picked up by checking their state
// when the action starts.

/** Calls `callback` for every image inside `node` that has loaded, or loads later. */
export function imagesLoaded(node: HTMLElement, callback: (img: HTMLImageElement) => void) {
	const onLoad = (e: Event) => {
		if (e.target instanceof HTMLImageElement) callback(e.target);
	};
	for (const img of node.querySelectorAll('img')) {
		if (img.complete && img.naturalWidth > 0) callback(img);
	}
	node.addEventListener('load', onLoad, true);
	return {
		destroy() {
			node.removeEventListener('load', onLoad, true);
		}
	};
}

/** Calls `callback` for every image inside `node` that has failed, or fails later. */
export function imagesFailed(node: HTMLElement, callback: (img: HTMLImageElement) => void) {
	const onError = (e: Event) => {
		if (e.target instanceof HTMLImageElement) callback(e.target);
	};
	for (const img of node.querySelectorAll('img')) {
		if (img.complete && img.naturalWidth === 0 && img.currentSrc) callback(img);
	}
	node.addEventListener('error', onError, true);
	return {
		destroy() {
			node.removeEventListener('error', onError, true);
		}
	};
}
