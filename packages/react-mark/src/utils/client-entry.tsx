import { StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';

declare global {
	interface Window {
		__REACT_MARK_PATH: string;
		__REACT_MARK_COMPONENTS_PATH: string;
	}
}

async function hydrate() {
	if (typeof window !== 'undefined') {
		const __REACT_MARK_PATH = window.__REACT_MARK_PATH;
		const __REACT_MARK_COMPONENTS_PATH = window.__REACT_MARK_COMPONENTS_PATH;

		if (!__REACT_MARK_PATH) {
			throw new Error(
				'failed to find the page you are looking for if this was mistake please open an issue in our github page'
			);
		}
		const App = await import(/* @vite-ignore */ __REACT_MARK_PATH).then((module) => module.default);

		const { MDXComponents } = (await import(__REACT_MARK_COMPONENTS_PATH)) as {
			MDXComponents: Record<string, unknown>;
		};

		const root = hydrateRoot(
			document.getElementById('root')!,
			<StrictMode>
				<App components={MDXComponents} />
			</StrictMode>
		);

		const updatePage = async () => {
			const response = await fetch(`/ssr?url=${window.location.href}`);
			const { __REACT_MARK_COMPONENTS_PATH, __REACT_MARK_PATH } = (await response.json()) as {
				__REACT_MARK_PATH: string;
				__REACT_MARK_COMPONENTS_PATH: string;
			};

			const App = await import(/* @vite-ignore */ __REACT_MARK_PATH).then(
				(module) => module.default
			);

			const { MDXComponents } = (await import(__REACT_MARK_COMPONENTS_PATH)) as {
				MDXComponents: Record<string, unknown>;
			};

			root?.render(<App components={MDXComponents} />);
		};

		window.addEventListener('popstate', async function (event) {
			await updatePage();
		});

		window.addEventListener('updatePage', async () => {
			await updatePage();
		});
	}

	return null;
}

hydrate();
