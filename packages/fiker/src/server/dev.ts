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
import { createViteRuntime, createServer as createViteServer } from 'vite';
import { getFilePathFromRoute, processMdxFile } from '../utils/utils.js';
import { RenderArgs } from '../utils/server-entry.js';

const req = createRequire(import.meta.url);
const koaConnect = req('koa-connect');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const staticDir = path.join(__dirname, '__static__');
const isProduction = process.env.NODE_ENV == 'production';
const clientEntry = path.resolve(__dirname, `../utils/client-entry.js`);

export async function createServer() {
	const vite = await createViteServer({
		server: { middlewareMode: true },
		appType: 'custom',
		plugins: [react()],
		build: {
			ssrManifest: true,
			ssr: true,
			rollupOptions: {
				input: path.resolve(__dirname, '../utils/server-entry.js')
			}
		}
	});

	const viteRuntime = await createViteRuntime(vite);
	const app = new Koa();
	app.use(koaConnect(vite.middlewares));
	app.use(mount('/__static__', serve(staticDir)));
	const root = process.cwd();
	const basePath = path.join(root, 'src/app');
	const fikerDir = path.join(root, '.fiker');

	const router = new Router();

	let template = isProduction
		? await fs.promises.readFile(path.resolve(root, 'dist/client/index.html'), 'utf-8')
		: fs.readFileSync(path.resolve(root, 'index.html'), 'utf-8');

	const script = `<script type="module" src="${clientEntry}"></script>`;
	template = template.replace('</body>', `${script}\n</body>`);
	const ssrManifest = isProduction
		? await fs.promises.readFile(path.resolve(root, 'dist/client/.vite/ssr-manifest.json'), 'utf-8')
		: undefined;

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
		ctx.body = path;
	});

	router.get(/.*/, async (ctx) => {
		try {
			const url = ctx.req.url;
			let __FIKER_PAGE_PATH = '';

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

			let __FIKER_PAGE_PROPS: Record<string, unknown> = {};

			const __FIKER_MDX_COMPONENTS_PATH = path.resolve(
				__dirname,
				'../utils/markdown/components.js'
			);

			let App: React.FC;
			const { render } = (await viteRuntime.executeEntrypoint(
				path.resolve(__dirname, '../utils/server-entry.js')
			)) as {
				render: (arg: RenderArgs<typeof App>) => Promise<PipeableStream>;
			};
			if (isMdx) {
				const { MDXComponents } = await viteRuntime.executeEntrypoint(__FIKER_MDX_COMPONENTS_PATH);
				__FIKER_PAGE_PROPS = { components: MDXComponents } as any;
				const { Page, frontMatter, filePath } = await processMdxFile({
					fikerDir,
					pagePath,
					pathname,
					viteRuntime
				});
				App = Page;
				__FIKER_PAGE_PATH = filePath;

				const comipledTemplate = Handlebars.compile(template);
				template = comipledTemplate({
					title: frontMatter.title,
					description: frontMatter.description
				});
			} else {
				const { default: Page } = (await viteRuntime.executeEntrypoint(pagePath)) as {
					default: React.FC<{}>;
				};
				App = Page;
				__FIKER_PAGE_PATH = pagePath;
			}
			const appHtml = await render({
				App,
				props: __FIKER_PAGE_PROPS,
				options: {
					bootstrapData: {
						__FIKER_MDX_COMPONENTS_PATH,
						__FIKER_PAGE_PATH,
						__FIKER_PAGE_PROPS: __FIKER_PAGE_PROPS as any
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
