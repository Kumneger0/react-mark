let updatePageEvent: CustomEvent<unknown>;

if (typeof window !== 'undefined') {
	updatePageEvent = new CustomEvent('updatePage');
}

interface FikerRouterInstance {
	/**
	 * Pushes a new URL to the history stack and navigates to it
	 * @see https://fiker.com/docs/router#push
	 */
	push: (url: string) => void;

	/**
	 * Replaces the current URL in history with a new one without adding a new entry
	 * @see https://fiker.com/docs/router#replace
	 */
	replace: (url: string) => void;

	/**
	 * Navigates to the previous page in the history stack
	 * @see https://fiker.com/docs/router#back
	 */
	back: () => void;

	/**
	 * Navigates to the next page in the history stack
	 * @see https://fiker.com/docs/router#forward
	 */
	forward: () => void;
}

const push = (url: string) => {
	if (typeof window !== undefined) {
		window.history.pushState({}, '', url);
		window.dispatchEvent(updatePageEvent);
	}
};

const replace = (url: string) => {
	if (typeof window !== undefined) {
		window.history.replaceState({}, '', url);
		window.dispatchEvent(updatePageEvent);
	}
};

const back = () => {
	if (typeof window !== undefined) {
		window.history.back();
		window.dispatchEvent(updatePageEvent);
	}
};
const forward = () => {
	if (typeof window !== undefined) {
		window.history.forward();
		window.dispatchEvent(updatePageEvent);
	}
};

export const useRouter = (): FikerRouterInstance => {
	return {
		push,
		replace,
		back,
		forward
	};
};
