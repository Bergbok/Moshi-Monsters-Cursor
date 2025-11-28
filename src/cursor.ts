import { gsap } from 'gsap';

interface CursorOptions {
	assetsBase?: string;
}

export function iggyCursor(options: CursorOptions = {}) {
	const assetsBase = options.assetsBase || '/iggy/';

	const images = [
		'iggyright.avif',
		'iggyleft.avif',
		'iggyeat.avif',
		'iggytongue.avif',
		'iggy.avif',
		'cursor.avif'
	];
	images.forEach((img) => {
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
	document.body.appendChild(cursor);

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
	document.body.appendChild(follower);

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

	gsap.set(cursor, { xPercent: -50, yPercent: -50 });
	gsap.set(follower, { xPercent: -50, yPercent: -50 });

	window.addEventListener('mousemove', (e) => {
		gsap.to(cursor, { duration: 0.2, x: e.clientX, y: e.clientY });
		gsap.to(follower, { duration: 0.9, x: e.clientX, y: e.clientY });

		cursor.style.opacity = '1';
		const dist = getDistanceBetweenElements(cursor, follower);

		if (dist.a > dist.b) {
			follower.style.backgroundImage = `url(${assetsBase}iggyright.avif)`;
		} else if (dist.a < dist.b) {
			follower.style.backgroundImage = `url(${assetsBase}iggyleft.avif)`;
		}
	});

	// Eat effect
	(function (mouseStopDelay: number) {
		let timeout: number | undefined;
		document.addEventListener('mousemove', function (e) {
			if (timeout) clearTimeout(timeout);
			timeout = window.setTimeout(function () {
				const event = new CustomEvent('mousestop', {
					detail: {
						clientX: e.clientX,
						clientY: e.clientY
					},
					bubbles: true,
					cancelable: true
				});
				e.target?.dispatchEvent(event);
			}, mouseStopDelay);
		});
	})(1000);

	window.addEventListener('mousestop', () => {
		const dist = getDistanceBetweenElements(cursor, follower);
		const isOverlapping = dist.a === dist.b;
		if (isOverlapping) {
			follower.style.backgroundImage = `url(${assetsBase}iggyeat.avif)`;
			cursor.style.opacity = '0';
		}
	});

	// Tongue effect
	(function (mouseStopDelay2: number) {
		let timeout: number | undefined;
		document.addEventListener('mousemove', function (e) {
			if (timeout) clearTimeout(timeout);
			timeout = window.setTimeout(function () {
				const event = new CustomEvent('mousestop2', {
					detail: {
						clientX: e.clientX,
						clientY: e.clientY
					},
					bubbles: true,
					cancelable: true
				});
				e.target?.dispatchEvent(event);
			}, mouseStopDelay2);
		});
	})(400);

	window.addEventListener('mousestop2', () => {
		follower.style.backgroundImage = `url(${assetsBase}iggytongue.avif)`;
	});
}
