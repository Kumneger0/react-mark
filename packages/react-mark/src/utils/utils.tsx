import fs from 'node:fs';
import path from 'node:path';
import React from 'react';

import { compile } from '@mdx-js/mdx';
import matter from 'gray-matter';

import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import { ViteDevServer } from 'vite';

export const compileToJsx = async (content: string) => {
	const compiled = await compile(content, {
		rehypePlugins: [rehypeSlug, rehypeAutolinkHeadings]
	});
	return String(compiled);
};

export function buildRoutesMap(dir: string, basePath = '') {
	const routesMap = new Map<string, string>();

	const processFile = (fullPath: string, currentRoute: string, file: string) => {
		if (file === 'page.tsx') {
			routesMap.set(currentRoute || '/', fullPath);
			return;
		}

		if (file.endsWith('.mdx')) {
			const routePath = `${currentRoute}/${file.replace('.mdx', '')}`;
			routesMap.set(routePath, fullPath);
		}
	};

	const traverseDirectory = (currentDir: string, currentRoute: string) => {
		const files = fs.readdirSync(currentDir);

		files.forEach((file) => {
			const fullPath = path.join(currentDir, file);
			const fileStat = fs.statSync(fullPath);

			if (fileStat.isDirectory()) {
				traverseDirectory(fullPath, `${currentRoute}/${file}`);
				return;
			}

			processFile(fullPath, currentRoute, file);
		});
	};

	traverseDirectory(dir, basePath);
	return routesMap;
}

export function getFilePathFromRoute(pathname: string, rootDir: string) {
	const normalizedPath = pathname === '/' ? 'page.tsx' : `${pathname}/page.tsx`;
	const filePath = path.join(rootDir, normalizedPath);
	const mdxPath = path.join(rootDir, `${pathname}.mdx`);
	const isReactComponenetExists = fs.existsSync(filePath);
	const isMdxExists = fs.existsSync(mdxPath);
	if (isReactComponenetExists)
		return {
			isMdx: false,
			path: filePath
		};
	if (isMdxExists)
		return {
			isMdx: true,
			path: mdxPath
		};
	if (!isReactComponenetExists && !isMdxExists) return null;
}

export const processMdxFile = async ({
	reactMarkDir,
	pagePath,
	pathname,
	vite
}: {
	pagePath: string;
	reactMarkDir: string;
	pathname: string;
	vite: ViteDevServer;
}) => {
	const mdxString = fs.readFileSync(pagePath, 'utf-8');
	const { content, data: frontMatter } = matter(mdxString);
	const compiledJsxContent = await compileToJsx(content);
	const dirToSaveCompiledMdx = path.join(reactMarkDir, 'dev');

	if (!fs.existsSync(dirToSaveCompiledMdx)) {
		fs.mkdirSync(dirToSaveCompiledMdx, { recursive: true });
	}

	const fileNameToWrite = pagePath.split('/').at(-1)?.replace('mdx', 'tsx')!;
	const filePath = path.join(dirToSaveCompiledMdx, fileNameToWrite);
	fs.writeFileSync(filePath, compiledJsxContent);
	// const { default: Page } = (await viteRuntime.executeEntrypoint(filePath)) as {
	// 	default: React.FC<{}>;
	// };
	const { default: Page } = (await vite.ssrLoadModule(filePath)) as {
		default: React.FC<{}>;
	};

	return { Page, frontMatter, filePath };
};

export const ContextProvider = <T,>({
	contexts,
	children
}: {
	contexts: Array<{
		Context: React.Context<T>;
		value: T;
	}>;
	children: React.ReactNode;
}) => {
	const WrappedComponent = () => {
		return contexts.reduce((acc, { Context, value }) => {
			return <Context.Provider value={value}>{acc}</Context.Provider>;
		}, children);
	};

	return WrappedComponent;
};
