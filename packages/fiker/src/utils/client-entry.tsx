import { StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';

declare global {
	interface Window {
		__FIKER_PAGE_PATH: string;
		__FIKER_MDX_COMPONENTS_PATH: string;
	}
}

async function hydrate() {
	if (typeof window !== 'undefined') {
		const __FIKER_PAGE_PATH = window.__FIKER_PAGE_PATH;
		const __FIKER_MDX_COMPONENTS_PATH = window.__FIKER_MDX_COMPONENTS_PATH;

		if (!__FIKER_PAGE_PATH) {
			throw new Error(
				'failed to find the page you are looking for if this was mistake please open an issue in our github page'
			);
		}
		const App = await import(/* @vite-ignore */ __FIKER_PAGE_PATH).then((module) => module.default);

		const { MDXComponents } = (await import(__FIKER_MDX_COMPONENTS_PATH)) as {
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
			const { __FIKER_MDX_COMPONENTS_PATH, __FIKER_PAGE_PATH } = (await response.json()) as {
				__FIKER_PAGE_PATH: string;
				__FIKER_MDX_COMPONENTS_PATH: string;
			};

			const App = await import(/* @vite-ignore */ __FIKER_PAGE_PATH).then(
				(module) => module.default
			);

			const { MDXComponents } = (await import(__FIKER_MDX_COMPONENTS_PATH)) as {
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
