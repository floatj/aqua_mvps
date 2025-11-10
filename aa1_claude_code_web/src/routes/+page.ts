import type { PageLoad } from './$types';
import type { TransactionDto } from '$lib/types';

export const load: PageLoad = async ({ fetch }) => {
	try {
		const res = await fetch('/api/transactions');
		if (res.ok) {
			const body = (await res.json()) as { data?: TransactionDto[] };
			return { serverTransactions: body.data ?? [] };
		}
	} catch (err) {
		console.warn('Offline or API unavailable, falling back to IndexedDB', err);
	}

	return { serverTransactions: [] };
};