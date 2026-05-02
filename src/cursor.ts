import { gsap } from 'gsap';

interface CursorOptions {
	assetsBase?: string;
	parent?: HTMLElement;
}

interface CursorEvents {
	addEventListener(
		type: 'ate' | 'unate',
		listener: (event: Event) => void,
		options?: boolean | AddEventListenerOptions
	): void;
	removeEventListener(
		type: 'ate' | 'unate',
		listener: (event: Event) => void,
		options?: boolean | EventListenerOptions
	): void;
}

export interface Iggy {
	events: CursorEvents;
	destroy: () => void;
}

export function iggyCursor(options: CursorOptions = {}): Iggy {
	const assetsBase = options.assetsBase || '/iggy/';
	const parent = options.parent || document.body;
	const eventsTarget = new EventTarget();
	const events: CursorEvents = {
		addEventListener(type, listener, options) {
			eventsTarget.addEventListener(
				type,
				listener as EventListener,
				options
			);
		},
		removeEventListener(type, listener, options) {
			eventsTarget.removeEventListener(
				type,
				listener as EventListener,
				options
			);
		}
	};
	let isEaten = false;
	let destroyed = false;
	let mouseStopTimeout: number | undefined;
	let tongueTimeout: number | undefined;

	[
		'cursor.avif',
		'iggy.avif',
		'iggyeat.avif',
		'iggyleft.avif',
		'iggyright.avif',
		'iggytongue.avif'
	].forEach((img) => {
		const image = new Image();
		image.src = assetsBase + img;
	});

	const cursor = document.createElement('div');
	cursor.className = 'cursor';
	cursor.style.cssText = `
		position: fixed;
		top: 10px;
		left: 6px;
		width: 50px;
		height: 50px;
		background-image: url(${assetsBase}cursor.avif);
		background-size: 100%;
		background-repeat: no-repeat;
		background-attachment: fixed;
		background-position: center;
		user-select: none;
		pointer-events: none;
		z-index: 10001;
	`;
	parent.appendChild(cursor);

	const follower = document.createElement('div');
	follower.className = 'follower';
	follower.style.cssText = `
		position: fixed;
		top: 10px;
		left: 6px;
		width: 50px;
		height: 50px;
		background-image: url(${assetsBase}iggy.avif);
		background-size: 100%;
		background-repeat: no-repeat;
		background-attachment: fixed;
		background-position: center;
		user-select: none;
		pointer-events: none;
		z-index: 10000;
	`;
	parent.appendChild(follower);

	gsap.set(cursor, { xPercent: -50, yPercent: -50 });
	gsap.set(follower, { xPercent: -50, yPercent: -50 });

	function getPositionAtCenter(element: HTMLElement) {
		const { top, left, width, height } = element.getBoundingClientRect();
		return {
			x: left + width / 2,
			y: top + height / 2
		};
	}

	function getDistanceBetweenElements(a: HTMLElement, b: HTMLElement) {
		const aPosition = getPositionAtCenter(a);
		const bPosition = getPositionAtCenter(b);
		return {
			a: aPosition.x,
			b: bPosition.x,
			c: aPosition.y,
			d: bPosition.y
		};
	}

	const onWindowMouseMove = (e: MouseEvent) => {
		if (destroyed) return;

		gsap.to(cursor, { duration: 0.2, x: e.clientX, y: e.clientY });
		gsap.to(follower, { duration: 0.9, x: e.clientX, y: e.clientY });

		cursor.style.opacity = '1';

		if (isEaten) {
			isEaten = false;
			eventsTarget.dispatchEvent(new Event('unate'));
		}

		const dist = getDistanceBetweenElements(cursor, follower);

		if (dist.a > dist.b) {
			follower.style.backgroundImage = `url(${assetsBase}iggyright.avif)`;
		} else if (dist.a < dist.b) {
			follower.style.backgroundImage = `url(${assetsBase}iggyleft.avif)`;
		}
	};

	window.addEventListener('mousemove', onWindowMouseMove);

	const onDocumentMouseMoveForTongue = (e: MouseEvent) => {
		if (destroyed) return;

		if (tongueTimeout) clearTimeout(tongueTimeout);
		tongueTimeout = window.setTimeout(() => {
			const event = new CustomEvent('mousestop2', {
				detail: {
					clientX: e.clientX,
					clientY: e.clientY
				},
				bubbles: true,
				cancelable: true
			});
			e.target?.dispatchEvent(event);
		}, 400);
	};

	document.addEventListener('mousemove', onDocumentMouseMoveForTongue);

	const onDocumentMouseMoveForMouseStop = (e: MouseEvent) => {
		if (destroyed) return;

		if (mouseStopTimeout) clearTimeout(mouseStopTimeout);
		mouseStopTimeout = window.setTimeout(() => {
			const event = new CustomEvent('mousestop', {
				detail: {
					clientX: e.clientX,
					clientY: e.clientY
				},
				bubbles: true,
				cancelable: true
			});
			e.target?.dispatchEvent(event);
		}, 1000);
	};

	document.addEventListener('mousemove', onDocumentMouseMoveForMouseStop);

	const onMouseStop = () => {
		if (destroyed) return;

		const dist = getDistanceBetweenElements(cursor, follower);
		const isOverlapping = dist.a === dist.b;
		if (isOverlapping) {
			follower.style.backgroundImage = `url(${assetsBase}iggyeat.avif)`;
			cursor.style.opacity = '0';
			isEaten = true;
			eventsTarget.dispatchEvent(new Event('ate'));
		}
	};

	window.addEventListener('mousestop', onMouseStop);

	const onMouseStop2 = () => {
		if (destroyed) return;

		follower.style.backgroundImage = `url(${assetsBase}iggytongue.avif)`;
	};

	window.addEventListener('mousestop2', onMouseStop2);

	const destroy = () => {
		if (destroyed) return;
		destroyed = true;

		document.removeEventListener(
			'mousemove',
			onDocumentMouseMoveForMouseStop
		);
		document.removeEventListener('mousemove', onDocumentMouseMoveForTongue);
		window.removeEventListener('mousemove', onWindowMouseMove);
		window.removeEventListener('mousestop', onMouseStop);
		window.removeEventListener('mousestop2', onMouseStop2);

		if (mouseStopTimeout) clearTimeout(mouseStopTimeout);
		if (tongueTimeout) clearTimeout(tongueTimeout);

		gsap.killTweensOf(cursor);
		gsap.killTweensOf(follower);
		cursor.remove();
		follower.remove();
	};

	return { events, destroy };
}
