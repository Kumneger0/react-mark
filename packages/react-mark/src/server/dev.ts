import Router from '@koa/router';
import react from '@vitejs/plugin-react';
import * as fs from 'fs';
import Handlebars from 'handlebars';
import Koa from 'koa';
import mount from 'koa-mount';
import serve from 'koa-static';
import { createRequire } from 'module';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { PipeableStream } from 'react-dom/server';
import { PassThrough } from 'stream';
import { createServer as createViteServer, ViteDevServer } from 'vite';
import { getFilePathFromRoute, processMdxFile } from '../utils/utils.js';
import { RenderArgs } from '../utils/server-entry.js';

const req = createRequire(import.meta.url);
const koaConnect = req('koa-connect');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const staticDir = path.join(__dirname, '__static__');
const clientEntry = path.resolve(__dirname, `../utils/client-entry.js`);
const root = process.cwd();
export const basePath = path.join(root, 'src/app');
const reactMarkDir = path.join(root, '.react-mark');
const isProduction = process.env.NODE_ENV == 'production';

export let vite: ViteDevServer;

export async function createServer() {
	vite = await createViteServer({
		server: { middlewareMode: true },
		appType: 'custom',
		plugins: [react()]
	});
	const app = new Koa();
	app.use(koaConnect(vite.middlewares));
	app.use(mount('/__static__', serve(staticDir)));

	const router = new Router();
	let template = isProduction
		? await fs.promises.readFile(path.resolve(root, 'dist/client/index.html'), 'utf-8')
		: fs.readFileSync(path.resolve(root, 'index.html'), 'utf-8');

	const script = `<script type="module" src="${clientEntry}"></script>`;
	template = template.replace('</body>', `${script}\n</body>`);
	const ssrManifest = isProduction
		? await fs.promises.readFile(path.resolve(root, 'dist/client/.vite/ssr-manifest.json'), 'utf-8')
		: undefined;

	const __REACT_MARK_COMPONENTS_PATH = path.resolve(__dirname, '../utils/markdown/components.js');

	router.get('/ssr', async (ctx) => {
		const { url } = ctx.query;

		if (!url) {
			ctx.status = 400;
			ctx.body = { error: 'URL parameter is required' };
			return;
		}
		const pathname = new URL(url as string).pathname;
		const filePath = getFilePathFromRoute(pathname, basePath);

		if (!filePath) {
			ctx.status = 404;
			ctx.body = '404';
			console.log('not found', pathname);
			return;
		}
		const { path, isMdx } = filePath;
		ctx.type = 'application/json';
		if (isMdx) {
			const { Page, filePath, frontMatter } = await processMdxFile({
				reactMarkDir,
				pagePath: path,
				pathname,
				vite
			});
			ctx.body = {
				__REACT_MARK_PATH: filePath,
				__REACT_MARK_COMPONENTS_PATH
			};
			return;
		}
		ctx.body = {
			__REACT_MARK_PATH: path,
			__REACT_MARK_COMPONENTS_PATH
		};
	});

	router.get(/.*/, async (ctx) => {
		try {
			const url = ctx.req.url;
			let __REACT_MARK_PATH = '';

			if (!url) {
				throw Error('failed to determine the path you are looking for');
			}

			const pathname = ctx.URL.pathname;
			const filePath = getFilePathFromRoute(pathname, `${root}/src/app`);

			if (!filePath) {
				ctx.body = '404';
				return;
			}
			const { isMdx, path: pagePath } = filePath;
			let __REACT_MARK_PROPS: Record<string, unknown> = {};
			const __REACT_MARK_COMPONENTS_PATH = path.resolve(
				__dirname,
				'../utils/markdown/components.js'
			);

			let App: React.FC;

			const { render } = (await vite.ssrLoadModule(
				path.resolve(__dirname, '../utils/server-entry.js')
			)) as {
				render: (arg: RenderArgs<typeof App>) => Promise<PipeableStream>;
			};

			if (isMdx) {
				const { MDXComponents } = await vite.ssrLoadModule(__REACT_MARK_COMPONENTS_PATH);
				__REACT_MARK_PROPS = { components: MDXComponents } as any;
				const { Page, frontMatter, filePath } = await processMdxFile({
					reactMarkDir,
					pagePath,
					pathname,
					vite
				});
				App = Page;
				__REACT_MARK_PATH = filePath;

				const comipledTemplate = Handlebars.compile(template);
				template = comipledTemplate({
					title: frontMatter.title,
					description: frontMatter.description
				});
			} else {

				const { default: Page } = (await vite.ssrLoadModule(pagePath)) as {
					default: React.FC<{}>;
				};
				App = Page;
				__REACT_MARK_PATH = pagePath;
			}
			const appHtml = await render({
				App,
				props: __REACT_MARK_PROPS,
				options: {
					bootstrapData: {
						__REACT_MARK_COMPONENTS_PATH,
						__REACT_MARK_PATH,
						__REACT_MARK_PROPS: __REACT_MARK_PROPS as unknown as string
					}
				}
			});
			ctx.type = 'text/html';
			const passThrough = new PassThrough();

			template = await vite.transformIndexHtml(url, template);
			const [before, after] = template.split('<!--ssr-outlet-->');
			passThrough.write(before);
			const writable = new PassThrough({
				write(chunk, _encoding, callback) {
					passThrough.write(chunk);
					callback();
				},
				final(callback) {
					passThrough.write(after);
					passThrough.end();
					callback();
				}
			});

			appHtml.pipe(writable);
			ctx.body = passThrough;
		} catch (error) {
			if (error instanceof Error) {
				vite.ssrFixStacktrace(error);
			}
			console.error('Error in SSR rendering:', error);
			ctx.status = 500;
			ctx.body = 'Internal Server Error';
		}
	});
	app.use(router.routes()).use(router.allowedMethods());
	const port = 3000;
	const server = app.listen(port, () => console.log(`Server running at http://localhost:${port}`));
	server.on('error', (err) => {
		if (
			err &&
			typeof err == 'object' &&
			'code' in err &&
			typeof err.code == 'string' &&
			err.code === 'EADDRINUSE'
		) {
			console.log(`Port ${port} is in use, trying another port...`);
			server.close();
			app.listen(port + 1, () => console.log(`Server running at http://localhost:${port + 1}`));
		} else {
			console.error(err);
		}
	});
}
