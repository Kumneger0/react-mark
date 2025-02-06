import ReactMarkdown from 'react-markdown';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeSlug from 'rehype-slug';

function MarkdownContent({ markdown }: { markdown: string }) {
	return (
		<ReactMarkdown
			children={markdown}
			rehypePlugins={[rehypeSlug, rehypeAutolinkHeadings]}
			components={{
				h1: ({ node, ...props }) => (
					<h1
						id={
							props.id ??
							//FIXME:fix this is issue later
							//@ts-ignore
							(props.children?.[0] as string)?.toString().toLowerCase().replace(/\s+/g, '-')
						}
					>
						{props.children}
					</h1>
				),
				h2: ({ node, ...props }) => (
					<h2
						id={
							props.id ??
							//@ts-ignore
							props.children[0].toString().toLowerCase().replace(/\s+/g, '-')
						}
					>
						{props.children}
					</h2>
				),
				h3: ({ node, ...props }) => (
					<h3
						id={
							props.id ??
							//@ts-ignore
							props.children[0].toString().toLowerCase().replace(/\s+/g, '-')
						}
					>
						{props.children}
					</h3>
				)
			}}
		/>
	);
}

export { MarkdownContent };
