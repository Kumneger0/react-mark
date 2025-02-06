import { createFilter } from '@rollup/pluginutils';
import matter from 'gray-matter';
import { compileToJsx } from '../utils/utils.js';
import { Plugin } from 'vite';

export function mdxToTsx(): Plugin {
	return {
		name: 'mdx-to-tsx',
		async transform(code: string, id: string) {
			if (!createFilter(['**/*.mdx'])(id)) return null;
			const { data, content } = matter(code);
			const tsxCode = await compileToJsx(content);
			return {
				code: tsxCode,
				map: null
			};
		}
	};
}
