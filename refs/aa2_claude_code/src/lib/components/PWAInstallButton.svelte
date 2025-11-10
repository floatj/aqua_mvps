<script lang="ts">
	import { pwaInstallPrompt, isPWAInstalled, installPWA } from '$lib/stores/pwa';

	let canInstall = false;
	let isInstalled = false;

	pwaInstallPrompt.subscribe(prompt => {
		canInstall = !!prompt;
	});

	isPWAInstalled.subscribe(installed => {
		isInstalled = installed;
	});

	const handleInstall = () => {
		installPWA();
	};
</script>

{#if canInstall && !isInstalled}
	<button
		on:click={handleInstall}
		class="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 flex items-center gap-2 z-50"
	>
		<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
		</svg>
		Install App
	</button>
{/if}