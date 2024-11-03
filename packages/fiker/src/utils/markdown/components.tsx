import React, { useEffect, ReactNode } from 'react';
import Prism from 'prismjs';
import 'prismjs/themes/prism.css';
interface CodeBlockProps {
	children: string;
	language?: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ children, language = 'javascript' }) => {
	useEffect(() => {
		Prism.highlightAll();
	}, []);

	return (
		<pre className={`language-${language}`}>
			<code>{children}</code>
		</pre>
	);
};

interface QuoteProps {
	children: ReactNode;
}

const Quote: React.FC<QuoteProps> = ({ children }) => (
	<blockquote
		style={{
			padding: '1em',
			margin: '1em 0',
			borderLeft: '4px solid #ccc',
			fontStyle: 'italic',
			color: '#666'
		}}
	>
		{children}
	</blockquote>
);

interface HeadingProps {
	level: 1 | 2 | 3 | 4 | 5 | 6;
	children: ReactNode;
}

const Heading: React.FC<HeadingProps> = ({ level, children }) => {
	const Tag = `h${level}` as keyof JSX.IntrinsicElements;
	return (
		<Tag
			style={{
				marginTop: '1.5em',
				color: '#333'
			}}
		>
			{children}
		</Tag>
	);
};

interface ImageProps {
	src: string;
	alt: string;
	width?: number | string;
	height?: number | string;
}

const Image: React.FC<ImageProps> = ({ src, alt, width, height }) => (
	<img
		src={src}
		alt={alt}
		width={width}
		height={height}
		style={{
			maxWidth: '100%',
			height: 'auto',
			borderRadius: '8px',
			margin: '1em 0'
		}}
	/>
);

interface TableProps {
	children: ReactNode;
}

const Table: React.FC<TableProps> = ({ children }) => (
	<table
		style={{
			width: '100%',
			borderCollapse: 'collapse',
			margin: '1em 0'
		}}
	>
		<tbody>{children}</tbody>
	</table>
);

interface TableRowProps {
	children: ReactNode;
}

const TableRow: React.FC<TableRowProps> = ({ children }) => <tr>{children}</tr>;

interface TableCellProps {
	children: ReactNode;
	header?: boolean;
}

const TableCell: React.FC<TableCellProps> = ({ children, header }) =>
	header ? (
		<th
			style={{
				border: '1px solid #ccc',
				padding: '0.5em',
				background: '#f9f9f9'
			}}
		>
			{children}
		</th>
	) : (
		<td style={{ border: '1px solid #ccc', padding: '0.5em' }}>{children}</td>
	);

const MDXComponents = {
	code: CodeBlock,
	blockquote: Quote,
	h1: (props: Omit<HeadingProps, 'level'>) => <Heading level={1} {...props} />,
	h2: (props: Omit<HeadingProps, 'level'>) => <Heading level={2} {...props} />,
	h3: (props: Omit<HeadingProps, 'level'>) => <Heading level={3} {...props} />,
	h4: (props: Omit<HeadingProps, 'level'>) => <Heading level={4} {...props} />,
	h5: (props: Omit<HeadingProps, 'level'>) => <Heading level={5} {...props} />,
	h6: (props: Omit<HeadingProps, 'level'>) => <Heading level={6} {...props} />,
	img: Image,
	table: Table,
	tr: TableRow,
	td: TableCell,
	th: (props: Omit<TableCellProps, 'header'>) => <TableCell {...props} header />
};

export { MDXComponents };
