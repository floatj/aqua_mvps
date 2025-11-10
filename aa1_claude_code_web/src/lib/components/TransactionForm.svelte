<script lang="ts">
	import type { TransactionType } from '$lib/types';

	type FormState = {
		postedOn: string;
		type: TransactionType;
		category: string;
		description: string;
		amount: string;
	};

	type Props = {
		form: FormState;
		statusMessage: string;
		onSubmit: () => void;
		today: () => string;
	};

	let { form = $bindable(), statusMessage, onSubmit, today }: Props = $props();
</script>

<div class="rounded-xl bg-white p-6 shadow">
	<h2 class="text-xl font-semibold text-slate-800">Add transaction</h2>
	<form class="mt-4 flex flex-col gap-4" onsubmit={(e) => { e.preventDefault(); onSubmit(); }}>
		<label class="flex flex-col gap-1">
			<span class="text-sm font-medium text-slate-600">Date</span>
			<input
				class="rounded border border-slate-200 px-3 py-2 focus:border-primary focus:outline-none"
				type="date"
				bind:value={form.postedOn}
				max={today()}
				required
			/>
		</label>
		<label class="flex flex-col gap-1">
			<span class="text-sm font-medium text-slate-600">Type</span>
			<select
				class="rounded border border-slate-200 px-3 py-2 focus:border-primary focus:outline-none"
				bind:value={form.type}
			>
				<option value="income">Income</option>
				<option value="expense">Expense</option>
				<option value="asset">Asset</option>
				<option value="liability">Liability</option>
			</select>
		</label>
		<label class="flex flex-col gap-1">
			<span class="text-sm font-medium text-slate-600">Category</span>
			<input
				class="rounded border border-slate-200 px-3 py-2 focus:border-primary focus:outline-none"
				type="text"
				placeholder="e.g. Payroll, Rent"
				bind:value={form.category}
			/>
		</label>
		<label class="flex flex-col gap-1">
			<span class="text-sm font-medium text-slate-600">Description</span>
			<input
				class="rounded border border-slate-200 px-3 py-2 focus:border-primary focus:outline-none"
				type="text"
				placeholder="What happened?"
				bind:value={form.description}
				required
			/>
		</label>
		<label class="flex flex-col gap-1">
			<span class="text-sm font-medium text-slate-600">Amount</span>
			<input
				class="rounded border border-slate-200 px-3 py-2 focus:border-primary focus:outline-none"
				type="number"
				min="0"
				step="0.01"
				bind:value={form.amount}
				required
			/>
		</label>
		<button
			class="rounded-lg bg-primary px-4 py-2 font-semibold text-white transition hover:bg-primary-dark"
			type="submit"
		>
			Save locally
		</button>
	</form>
	{#if statusMessage}
		<p class="mt-3 text-sm text-slate-500">{statusMessage}</p>
	{/if}
</div>
