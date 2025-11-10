import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';

export default defineConfig({
	plugins: [
		sveltekit(),
		SvelteKitPWA({
			strategies: 'generateSW',
			registerType: 'autoUpdate',
			manifest: {
				short_name: 'Accounting',
				name: 'Accounting App',
				start_url: '/',
				scope: '/',
				display: 'standalone',
				theme_color: '#3b82f6',
				background_color: '#f3f4f6',
				description: 'Simple accounting app with offline support',
				icons: [
					{
						src: '/favicon.svg',
						sizes: '192x192',
						type: 'image/svg+xml'
					},
					{
						src: '/favicon.svg',
						sizes: '512x512',
						type: 'image/svg+xml'
					}
				]
			},
			workbox: {
				globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
				runtimeCaching: [
					{
						urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
						handler: 'CacheFirst',
						options: {
							cacheName: 'google-fonts-cache',
							expiration: {
								maxEntries: 10,
								maxAgeSeconds: 60 * 60 * 24 * 365
							}
						}
					}
				]
			},
			devOptions: {
				enabled: true
			}
		})
	]
});
