import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export const pwaInstallPrompt = writable<any>(null);
export const isPWAInstalled = writable<boolean>(false);

if (browser) {
	// Check if app is already installed
	if (window.matchMedia('(display-mode: standalone)').matches ||
		(window.navigator as any).standalone === true) {
		isPWAInstalled.set(true);
	}

	// Listen for install prompt
	window.addEventListener('beforeinstallprompt', (e) => {
		e.preventDefault();
		pwaInstallPrompt.set(e);
	});

	// Listen for app installed
	window.addEventListener('appinstalled', () => {
		isPWAInstalled.set(true);
		pwaInstallPrompt.set(null);
	});
}

export const installPWA = () => {
	pwaInstallPrompt.subscribe(async (prompt) => {
		if (prompt) {
			prompt.prompt();
			const { outcome } = await prompt.userChoice;
			if (outcome === 'accepted') {
				pwaInstallPrompt.set(null);
			}
		}
	})();
};