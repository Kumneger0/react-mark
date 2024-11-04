import { build } from 'vite';
import { mdxToTsx } from '../plugins/mdxToTsx.js';
import { basePath } from '../server/dev.js';
import { buildRoutesMap } from './utils.js';

export const buildFiles = async () => {
	const routesMap = buildRoutesMap(basePath);
	console.group(routesMap);

	const result = await build({
		build: {
			ssrManifest: true,
			ssr: true,
			rollupOptions: {
				input: Object.fromEntries(
					Array.from(routesMap).map(([key, value]: [string, string]) => [
						key === '/' ? 'index' : key.replace(/^\/+/, ''),
						value
					])
				),
				plugins: [mdxToTsx()]
			}
		}
	});
};
