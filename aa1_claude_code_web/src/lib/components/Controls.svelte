<script lang="ts">
	import type { TransactionType } from '$lib/types';

	type Props = {
		syncing: boolean;
		onSync: () => void;
		onExport: () => void;
		onExportJson: () => void;
		onImportJson: () => void;
		onSearchInput: (value: string) => void;
		onTypeFilterChange: (value: 'all' | TransactionType) => void;
	};

	let {
		syncing,
		onSync,
		onExport,
		onExportJson,
		onImportJson,
		onSearchInput,
		onTypeFilterChange
	}: Props = $props();
</script>

<div
	class="flex flex-col gap-3 rounded-xl bg-white p-4 shadow md:flex-row md:items-center md:justify-between"
>
	<div class="flex flex-1 flex-col gap-2 md:flex-row md:items-center">
		<input
			class="w-full rounded border border-slate-200 px-3 py-2 focus:border-primary focus:outline-none md:w-64"
			type="search"
			placeholder="Search description or category"
			oninput={(event) => onSearchInput(event.currentTarget.value)}
		/>
		<select
			class="w-full rounded border border-slate-200 px-3 py-2 focus:border-primary focus:outline-none md:w-40"
			onchange={(event) => onTypeFilterChange(event.currentTarget.value as 'all' | TransactionType)}
		>
			<option value="all">All types</option>
			<option value="income">Income</option>
			<option value="expense">Expense</option>
			<option value="asset">Asset</option>
			<option value="liability">Liability</option>
		</select>
	</div>
	<div class="flex flex-wrap items-center gap-2">
		<button
			class="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-slate-700 transition hover:bg-slate-50"
			onclick={onExport}
		>
			<span>CSV</span>
		</button>
		<button
			class="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-slate-700 transition hover:bg-slate-50"
			onclick={onExportJson}
		>
			<span>Export JSON</span>
		</button>
		<button
			class="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-slate-700 transition hover:bg-slate-50"
			onclick={onImportJson}
		>
			<span>Import JSON</span>
		</button>
		<button
			class="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-semibold text-white transition hover:bg-primary-dark disabled:opacity-60"
			onclick={onSync}
			disabled={syncing}
		>
			{#if syncing}
				<svg
					class="h-4 w-4 animate-spin text-white"
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					><circle
						class="opacity-25"
						cx="12"
						cy="12"
						r="10"
						stroke="currentColor"
						stroke-width="4"
					/><path
						class="opacity-75"
						fill="currentColor"
						d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
					/></svg
				>
				<span>Syncing...</span>
			{:else}
				<span>Sync to SQLite</span>
			{/if}
		</button>
	</div>
</div>
