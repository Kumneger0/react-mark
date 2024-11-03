import React from 'react';
import Link from '@repo/fiker/link';

export default function About() {
	return (
		<div
			style={{
				minHeight: '100vh',
				background: '#fff',
				color: '#000',
				padding: '5rem 1rem'
			}}
		>
			<div
				style={{
					maxWidth: '56rem',
					margin: '0 auto'
				}}
			>
				<h1
					style={{
						fontSize: '3.75rem',
						fontWeight: 'bold',
						marginBottom: '2rem',
						textAlign: 'center'
					}}
				>
					Fiker
				</h1>

				<div style={{ marginTop: '2rem' }}>
					<p
						style={{
							fontSize: '1.25rem',
							lineHeight: '1.75',
							textAlign: 'center',
							marginBottom: '2rem'
						}}
					>
						A static site generator built on top of Vite, optimized for performance and simplicity.
					</p>

					<div
						style={{
							display: 'grid',
							gridTemplateColumns: '1fr',
							gap: '2rem',
							marginTop: '3rem',
							marginBottom: '3rem'
						}}
					>
						<div
							style={{
								background: '#f5f5f5',
								padding: '1.5rem',
								borderRadius: '4px',
								border: '1px solid #eee'
							}}
						>
							<h3
								style={{
									fontSize: '1.25rem',
									fontWeight: '600',
									marginBottom: '0.75rem'
								}}
							>
								📄 Static by Default
							</h3>
							<p>Generates optimized static HTML at build time for better performance</p>
						</div>
						<div
							style={{
								background: '#f5f5f5',
								padding: '1.5rem',
								borderRadius: '4px',
								border: '1px solid #eee'
							}}
						>
							<h3
								style={{
									fontSize: '1.25rem',
									fontWeight: '600',
									marginBottom: '0.75rem'
								}}
							>
								⚡️ Zero JavaScript
							</h3>
							<p>Ships minimal JavaScript for maximum performance</p>
						</div>
						<div
							style={{
								background: '#f5f5f5',
								padding: '1.5rem',
								borderRadius: '4px',
								border: '1px solid #eee'
							}}
						>
							<h3
								style={{
									fontSize: '1.25rem',
									fontWeight: '600',
									marginBottom: '0.75rem'
								}}
							>
								🚀 SEO Optimized
							</h3>
							<p>Perfect for content-focused sites with great SEO out of the box</p>
						</div>
					</div>

					<div
						style={{
							background: '#f5f5f5',
							padding: '2rem',
							borderRadius: '4px',
							marginTop: '3rem',
							border: '1px solid #eee'
						}}
					>
						<h2
							style={{
								fontSize: '1.5rem',
								fontWeight: '600',
								marginBottom: '1rem'
							}}
						>
							Why Fiker?
						</h2>
						<p style={{ fontSize: '1.125rem', lineHeight: '1.75' }}>
							Fiker focuses on generating static sites that are fast, secure, and SEO-friendly. By
							generating all pages at build time, we ensure optimal performance and reliability for
							your content-driven websites.
						</p>
					</div>

					<div style={{ textAlign: 'center', marginTop: '3rem' }}>
						<Link
							to="/"
							style={{
								display: 'inline-block',
								padding: '0.75rem 2rem',
								background: '#000',
								color: '#fff',
								borderRadius: '4px',
								textDecoration: 'none'
							}}
						>
							Back to Home
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}
