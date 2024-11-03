import fs from 'node:fs';
import path from 'node:path';
import React from 'react';

import { compile } from '@mdx-js/mdx';
import matter from 'gray-matter';
import { ViteRuntime } from 'vite/runtime';

import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';

const compileToJsx = async (content: string) => {
	const compiled = await compile(content, {
		rehypePlugins: [rehypeSlug, rehypeAutolinkHeadings]
	});
	return String(compiled);
};

export function buildRoutesMap(dir: string, basePath = '') {
	const routesMap = new Map<string, string>();

	function traverse(currentDir: string, currentRoute: string) {
		const files = fs.readdirSync(currentDir);

		for (const file of files) {
			const fullPath = path.join(currentDir, file);
			const fileStat = fs.statSync(fullPath);

			if (fileStat.isDirectory()) {
				traverse(fullPath, `${currentRoute}/${file}`);
			} else if (file.endsWith('.tsx') || file.endsWith('.mdx')) {
				const routePath =
					file === 'page.tsx'
						? currentRoute || '/'
						: `${currentRoute}/${file.replace(/\.(tsx|mdx)$/, '')}`;

				routesMap.set(routePath, fullPath);
			}
		}
	}

	traverse(dir, basePath);
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
	fikerDir,
	pagePath,
	pathname,
	viteRuntime
}: {
	pagePath: string;
	fikerDir: string;
	pathname: string;
	viteRuntime: ViteRuntime;
}) => {
	const mdxString = fs.readFileSync(pagePath, 'utf-8');
	const { content, data: frontMatter } = matter(mdxString);
	const compiledJsxContent = await compileToJsx(content);
	const dirToSaveCompiledMdx = path.join(fikerDir, 'dev');

	if (!fs.existsSync(dirToSaveCompiledMdx)) {
		fs.mkdirSync(dirToSaveCompiledMdx, { recursive: true });
	}

	const fileNameToWrite =
		pagePath.split('/').at(-1)?.replace('mdx', 'tsx') ?? path.join(pathname, '.mdx');
	const filePath = path.join(dirToSaveCompiledMdx, fileNameToWrite);
	fs.writeFileSync(filePath, compiledJsxContent);
	const { default: Page } = (await viteRuntime.executeEntrypoint(filePath)) as {
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
