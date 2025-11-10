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
	import Summary from '$lib/components/Summary.svelte';
	import TransactionForm from '$lib/components/TransactionForm.svelte';
	import Controls from '$lib/components/Controls.svelte';
	import TransactionList from '$lib/components/TransactionList.svelte';

	let { data }: { data: PageData } = $props();

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

	let form: FormState = $state({
		postedOn: today(),
		type: 'expense',
		category: '',
		description: '',
		amount: ''
	});

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
				} else if (entry.type === 'expense') {
					acc.expense += entry.amount;
				} else if (entry.type === 'asset') {
					acc.asset += entry.amount;
				} else if (entry.type === 'liability') {
					acc.liability += entry.amount;
				}
				return acc;
			},
			{ income: 0, expense: 0, asset: 0, liability: 0 }
		)
	);

	const formatCurrency = (value: number) =>
		new Intl.NumberFormat(undefined, {
			style: 'currency',
			currency: 'USD'
		}).format(value);

	const sortTransactions = (list: ClientTransaction[]) =>
		[...list].sort((a, b) =>
			a.postedOn < b.postedOn ? 1 : a.postedOn > b.postedOn ? -1 : a.updatedAt < b.updatedAt ? 1 : -1
		);

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

		const header = [
			'id',
			'posted_on',
			'category',
			'description',
			'amount',
			'type',
			'created_at',
			'updated_at'
		];
		const csv = [
			header.join(','),
			...rows.map((row) =>
				header
					.map((column) => {
						const key = column
							.split('_')
							.map((part, index) =>
								index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)
							)
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

	const exportJson = () => {
		const rows = get(transactions);
		if (!rows.length) {
			setStatus('No data to export.');
			return;
		}

		const json = JSON.stringify(rows, null, 2);
		const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement('a');
		anchor.href = url;
		anchor.download = `ledgerlite-${today()}.json`;
		anchor.click();
		URL.revokeObjectURL(url);
		setStatus('JSON export generated.');
	};

	const importJson = () => {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = 'application/json';
		input.onchange = async (event) => {
			const file = (event.target as HTMLInputElement).files?.[0];
			if (!file) return;

			try {
				const text = await file.text();
				const data = JSON.parse(text);

				if (!Array.isArray(data)) {
					setStatus('Invalid JSON format. Expected an array of transactions.');
					return;
				}

				// Validate each transaction has required fields
				const validTransactions = data.filter((t) => {
					return (
						t.id &&
						t.postedOn &&
						t.description &&
						typeof t.amount === 'number' &&
						['income', 'expense', 'asset', 'liability'].includes(t.type)
					);
				});

				if (validTransactions.length === 0) {
					setStatus('No valid transactions found in file.');
					return;
				}

				// Mark all imported transactions as unsynced
				const importedTransactions = validTransactions.map((t) => ({
					...t,
					synced: false,
					category: t.category || 'General'
				}));

				await storeTransactions(importedTransactions);
				const local = await allTransactions();
				transactions.set(sortTransactions(local));
				setStatus(`Imported ${validTransactions.length} transactions.`);
			} catch (error) {
				console.error('Import error:', error);
				setStatus('Failed to import JSON. Please check the file format.');
			}
		};
		input.click();
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
				Track income and expenses offline with IndexedDB, then sync to SQLite when you are back
				online.
			</p>
			{#if $online === false}
				<p class="text-sm font-medium text-amber-600">
					Offline mode — your entries stay local until you sync.
				</p>
			{/if}
		</header>

		<Summary
			income={$totals.income}
			expense={$totals.expense}
			asset={$totals.asset}
			liability={$totals.liability}
			{formatCurrency}
		/>

		<section class="grid gap-6 lg:grid-cols-[360px,1fr]">
			<TransactionForm
				bind:form
				statusMessage={$statusMessage}
				onSubmit={handleSubmit}
				{today}
			/>

			<div class="flex flex-col gap-4">
				<Controls
					syncing={$syncing}
					onSync={syncWithServer}
					onExport={exportCsv}
					onExportJson={exportJson}
					onImportJson={importJson}
					onSearchInput={(value) => textFilter.set(value)}
					onTypeFilterChange={(value) => typeFilter.set(value)}
				/>

				<TransactionList
					transactions={$filteredTransactions}
					loading={$loading}
					{formatCurrency}
					onRemove={removeTransaction}
				/>
			</div>
		</section>
	</div>
</main>
