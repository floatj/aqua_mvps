<script lang="ts">
	import { browser } from '$app/environment';
	import type { PageData } from './$types';
	import { onMount } from 'svelte';
	import { derived, get, writable } from 'svelte/store';
	import type { ClientTransaction } from '$lib/client/indexed-db';
	import {
		allTransactions,
		deleteTransaction as deleteLocal,
		markSynced,
		replaceFromServer,
		storeTransactions,
		unsyncedTransactions
	} from '$lib/client/indexed-db';
	import type { TransactionDto, TransactionType } from '$lib/types';

	export let data: PageData;

	type FormState = {
		postedOn: string;
		type: TransactionType;
		category: string;
		description: string;
		amount: string;
	};

	const today = () => new Date().toISOString().slice(0, 10);

	const transactions = writable<ClientTransaction[]>([]);
	const textFilter = writable('');
	const typeFilter = writable<'all' | TransactionType>('all');
	const loading = writable(true);
	const syncing = writable(false);
	const statusMessage = writable('');
	const online = writable(true);

	let form: FormState = {
		postedOn: today(),
		type: 'expense',
		category: '',
		description: '',
		amount: ''
	};

	onMount(() => {
		if (!browser) {
			loading.set(false);
			return;
		}

		online.set(navigator.onLine);
		const setOnline = () => online.set(navigator.onLine);
		window.addEventListener('online', setOnline);
		window.addEventListener('offline', setOnline);

		void (async () => {
			try {
				const unsynced = await unsyncedTransactions();
				if (data.serverTransactions?.length) {
					await replaceFromServer(data.serverTransactions);
					if (unsynced.length) {
						await storeTransactions(unsynced);
					}
				} else {
					const existing = await allTransactions();
					if (!existing.length && !unsynced.length) {
						await storeTransactions([
							{
								id: crypto.randomUUID(),
								postedOn: today(),
								category: 'Sample',
								description: 'Add transactions to get started',
								amount: 0,
								type: 'income',
								createdAt: new Date().toISOString(),
								updatedAt: new Date().toISOString(),
								synced: true
							}
						]);
					}
				}

				const local = await allTransactions();
				transactions.set(sortTransactions(local));
			} finally {
				loading.set(false);
			}
		})();

		return () => {
			window.removeEventListener('online', setOnline);
			window.removeEventListener('offline', setOnline);
		};
	});

	const filteredTransactions = derived(
		[transactions, textFilter, typeFilter],
		([$transactions, $textFilter, $typeFilter]) => {
			const normalized = $textFilter.trim().toLowerCase();
			return $transactions.filter((transaction) => {
				const matchesType =
					$typeFilter === 'all' ? true : transaction.type === $typeFilter;
				const matchesSearch =
					!normalized ||
					[transaction.category, transaction.description]
						.join(' ')
						.toLowerCase()
						.includes(normalized);
				return matchesType && matchesSearch;
			});
		}
	);

	const totals = derived(transactions, ($transactions) =>
		$transactions.reduce(
			(acc, entry) => {
				if (entry.type === 'income') {
					acc.income += entry.amount;
				} else {
					acc.expense += entry.amount;
				}
				return acc;
			},
			{ income: 0, expense: 0 }
		)
	);

	const formatCurrency = (value: number) =>
		new Intl.NumberFormat(undefined, {
			style: 'currency',
			currency: 'USD'
		}).format(value);

	const sortTransactions = (list: ClientTransaction[]) =>
		[...list].sort((a, b) => (a.postedOn < b.postedOn ? 1 : a.postedOn > b.postedOn ? -1 : a.updatedAt < b.updatedAt ? 1 : -1));

	const resetForm = () => {
		form = {
			postedOn: today(),
			type: 'expense',
			category: '',
			description: '',
			amount: ''
		};
	};

	const setStatus = (message: string) => {
		statusMessage.set(message);
		setTimeout(() => statusMessage.set(''), 4000);
	};

	const handleSubmit = async () => {
		if (!browser) return;
		const amount = Number.parseFloat(form.amount);
		if (!form.description.trim() || Number.isNaN(amount) || amount <= 0) {
			setStatus('Enter a description and a positive amount.');
			return;
		}

		const entry: ClientTransaction = {
			id: crypto.randomUUID(),
			postedOn: form.postedOn,
			category: form.category.trim() || 'General',
			description: form.description.trim(),
			amount,
			type: form.type,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			synced: false
		};

		await storeTransactions([entry]);
		transactions.update(($transactions) => sortTransactions([...$transactions, entry]));
		resetForm();
		setStatus('Saved locally. Sync when you are ready.');
	};

	const removeTransaction = async (id: string) => {
		await deleteLocal(id);
		transactions.update(($transactions) => $transactions.filter((item) => item.id !== id));
		try {
			await fetch(`/api/transactions?id=${id}`, { method: 'DELETE' });
			setStatus('Removed from server.');
		} catch (error) {
			console.warn('Offline while deleting, will stay removed locally', error);
		}
	};

	const syncWithServer = async () => {
		if (!browser) return;
		syncing.set(true);
		try {
			const pending = await unsyncedTransactions();
			if (!pending.length) {
				setStatus('Everything is already synced.');
				return;
			}

			const payload: TransactionDto[] = pending.map(({ synced: _synced, ...rest }) => rest);
			const response = await fetch('/api/transactions', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(payload)
			});

			if (!response.ok) {
				throw new Error(`Sync failed with ${response.status}`);
			}

			const ids = pending.map((item) => item.id);
			await markSynced(ids);
			transactions.update(($transactions) =>
				sortTransactions(
					$transactions.map((entry) =>
						ids.includes(entry.id)
							? { ...entry, synced: true, updatedAt: new Date().toISOString() }
							: entry
					)
				)
			);
			setStatus('Synced with SQLite database.');
		} catch (error) {
			console.error(error);
			setStatus('Sync failed. Check the server logs or your connection.');
		} finally {
			syncing.set(false);
		}
	};

	const exportCsv = () => {
		const rows = get(transactions);
		if (!rows.length) {
			setStatus('No data to export.');
			return;
		}

		const header = ['id', 'posted_on', 'category', 'description', 'amount', 'type', 'created_at', 'updated_at'];
		const csv = [
			header.join(','),
			...rows.map((row) =>
				header
					.map((column) => {
						const key = column
							.split('_')
							.map((part, index) => (index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)))
							.join('');
						const value = row[key as keyof ClientTransaction];
						const text = typeof value === 'number' ? value.toString() : (value as string) ?? '';
						return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
					})
					.join(',')
			)
		].join('\n');

		const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement('a');
		anchor.href = url;
		anchor.download = `ledgerlite-${today()}.csv`;
		anchor.click();
		URL.revokeObjectURL(url);
		setStatus('Export generated.');
	};
</script>

<svelte:head>
	<title>LedgerLite · Offline-ready Accounting Prototype</title>
</svelte:head>

<main class="min-h-screen bg-slate-100">
	<div class="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8">
		<header class="flex flex-col gap-2">
			<h1 class="text-3xl font-bold text-slate-900">LedgerLite</h1>
			<p class="text-slate-600">
				Track income and expenses offline with IndexedDB, then sync to SQLite when you are back online.
			</p>
			{#if $online === false}
				<p class="text-sm font-medium text-amber-600">Offline mode — your entries stay local until you sync.</p>
			{/if}
		</header>

		<section class="grid gap-4 sm:grid-cols-3">
			<div class="rounded-xl bg-white p-4 shadow">
				<p class="text-sm text-slate-500">Total Income</p>
				<p class="text-2xl font-semibold text-emerald-600">{formatCurrency($totals.income)}</p>
			</div>
			<div class="rounded-xl bg-white p-4 shadow">
				<p class="text-sm text-slate-500">Total Expense</p>
				<p class="text-2xl font-semibold text-rose-600">{formatCurrency($totals.expense)}</p>
			</div>
			<div class="rounded-xl bg-white p-4 shadow">
				<p class="text-sm text-slate-500">Balance</p>
				<p class={`text-2xl font-semibold ${$totals.income - $totals.expense >= 0 ? 'text-slate-900' : 'text-rose-700'}`}>
					{formatCurrency($totals.income - $totals.expense)}
				</p>
			</div>
		</section>

		<section class="grid gap-6 lg:grid-cols-[360px,1fr]">
			<div class="rounded-xl bg-white p-6 shadow">
				<h2 class="text-xl font-semibold text-slate-800">Add transaction</h2>
				<form class="mt-4 flex flex-col gap-4" on:submit|preventDefault={handleSubmit}>
					<label class="flex flex-col gap-1">
						<span class="text-sm font-medium text-slate-600">Date</span>
						<input class="rounded border border-slate-200 px-3 py-2 focus:border-primary focus:outline-none" type="date" bind:value={form.postedOn} max={today()} required />
					</label>
					<label class="flex flex-col gap-1">
						<span class="text-sm font-medium text-slate-600">Type</span>
						<select class="rounded border border-slate-200 px-3 py-2 focus:border-primary focus:outline-none" bind:value={form.type}>
							<option value="income">Income</option>
							<option value="expense">Expense</option>
						</select>
					</label>
					<label class="flex flex-col gap-1">
						<span class="text-sm font-medium text-slate-600">Category</span>
						<input class="rounded border border-slate-200 px-3 py-2 focus:border-primary focus:outline-none" type="text" placeholder="e.g. Payroll, Rent" bind:value={form.category} />
					</label>
					<label class="flex flex-col gap-1">
						<span class="text-sm font-medium text-slate-600">Description</span>
						<input class="rounded border border-slate-200 px-3 py-2 focus:border-primary focus:outline-none" type="text" placeholder="What happened?" bind:value={form.description} required />
					</label>
					<label class="flex flex-col gap-1">
						<span class="text-sm font-medium text-slate-600">Amount</span>
						<input class="rounded border border-slate-200 px-3 py-2 focus:border-primary focus:outline-none" type="number" min="0" step="0.01" bind:value={form.amount} required />
					</label>
					<button class="rounded-lg bg-primary px-4 py-2 font-semibold text-white transition hover:bg-primary-dark" type="submit">Save locally</button>
				</form>
				{#if $statusMessage}
					<p class="mt-3 text-sm text-slate-500">{$statusMessage}</p>
				{/if}
			</div>

			<div class="flex flex-col gap-4">
				<div class="flex flex-col gap-3 rounded-xl bg-white p-4 shadow md:flex-row md:items-center md:justify-between">
					<div class="flex flex-1 flex-col gap-2 md:flex-row md:items-center">
						<input class="w-full rounded border border-slate-200 px-3 py-2 focus:border-primary focus:outline-none md:w-64" type="search" placeholder="Search description or category" on:input={(event) => textFilter.set(event.currentTarget.value)} />
						<select class="w-full rounded border border-slate-200 px-3 py-2 focus:border-primary focus:outline-none md:w-40" on:change={(event) => typeFilter.set(event.currentTarget.value as 'all' | TransactionType)}>
							<option value="all">All types</option>
							<option value="income">Income</option>
							<option value="expense">Expense</option>
						</select>
					</div>
					<div class="flex items-center gap-2">
						<button class="inline-flex items-center gap-2 rounded-lg border border-primary px-3 py-2 text-primary transition hover:bg-primary/10" on:click={exportCsv}>
							<span>Export CSV</span>
						</button>
						<button class="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-semibold text-white transition hover:bg-primary-dark disabled:opacity-60" on:click={syncWithServer} disabled={$syncing}>
							{#if $syncing}
								<svg class="h-4 w-4 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" /><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>
								<span>Syncing...</span>
							{:else}
								<span>Sync to SQLite</span>
							{/if}
						</button>
					</div>
				</div>

				<div class="rounded-xl bg-white shadow">
					{#if $loading}
						<p class="p-6 text-sm text-slate-500">Loading transactions...</p>
					{:else if $filteredTransactions.length === 0}
						<p class="p-6 text-sm text-slate-500">No transactions yet. Add your first entry on the left.</p>
					{:else}
						<div class="overflow-x-auto">
							<table class="min-w-full divide-y divide-slate-200 text-sm">
								<thead class="bg-slate-50 text-left">
									<tr>
										<th class="px-4 py-3 font-medium text-slate-600">Date</th>
										<th class="px-4 py-3 font-medium text-slate-600">Type</th>
										<th class="px-4 py-3 font-medium text-slate-600">Category</th>
										<th class="px-4 py-3 font-medium text-slate-600">Description</th>
										<th class="px-4 py-3 font-medium text-slate-600 text-right">Amount</th>
										<th class="px-4 py-3"></th>
									</tr>
								</thead>
								<tbody class="divide-y divide-slate-100">
									{#each $filteredTransactions as entry}
										<tr class="hover:bg-slate-50">
											<td class="px-4 py-3 text-slate-600">{entry.postedOn}</td>
											<td class={`px-4 py-3 font-medium ${entry.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>{entry.type}</td>
											<td class="px-4 py-3 text-slate-600">{entry.category}</td>
											<td class="px-4 py-3 text-slate-600">{entry.description}</td>
											<td class={`px-4 py-3 text-right ${entry.type === 'income' ? 'text-emerald-700' : 'text-rose-700'}`}>{formatCurrency(entry.amount)}</td>
											<td class="px-4 py-3 text-right">
												<button class="rounded border border-slate-300 px-3 py-1 text-xs text-slate-500 transition hover:bg-rose-50 hover:text-rose-600" on:click={() => removeTransaction(entry.id)}>
													Remove
												</button>
												{#if !entry.synced}
													<span class="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[0.65rem] font-medium text-amber-700">Pending sync</span>
												{/if}
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{/if}
				</div>
			</div>
		</section>
	</div>
</main>
