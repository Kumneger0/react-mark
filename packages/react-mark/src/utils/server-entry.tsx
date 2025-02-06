import React, { StrictMode, ReactNode, JSXElementConstructor } from 'react';
import { renderToPipeableStream, RenderToPipeableStreamOptions } from 'react-dom/server';

export interface RenderOptions extends Partial<RenderToPipeableStreamOptions> {
	strict?: boolean;
	wrapper?: React.FC<{ children: ReactNode }>;
	bootstrapData?: Record<string, string>;
}

export type RenderArgs<T extends JSXElementConstructor<any>> = {
	App: T;
	props: React.ComponentProps<T>;
	options?: RenderOptions;
};

export async function render<T extends React.FC<any>>({ App, props, options = {} }: RenderArgs<T>) {
	const { strict = true, wrapper: Wrapper, bootstrapData = {}, ...streamOptions } = options;

	const bootstrapScript = Object.entries(bootstrapData)
		.map(([key, value]) => `window.${key} = "${value}";`)
		.join('\n');

	let component = <App {...props} />;

	if (Wrapper) {
		component = <Wrapper>{component}</Wrapper>;
	}

	if (strict) {
		component = <StrictMode>{component}</StrictMode>;
	}

	const html = renderToPipeableStream(component, {
		bootstrapScriptContent: bootstrapScript,
		...streamOptions
	});

	return html;
}
