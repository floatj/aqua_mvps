<script lang="ts">
	import type { ClientTransaction } from '$lib/client/indexed-db';

	type Props = {
		transactions: ClientTransaction[];
		loading: boolean;
		formatCurrency: (value: number) => string;
		onRemove: (id: string) => void;
	};

	let { transactions, loading, formatCurrency, onRemove }: Props = $props();
</script>

<div class="rounded-xl bg-white shadow">
	{#if loading}
		<p class="p-6 text-sm text-slate-500">Loading transactions...</p>
	{:else if transactions.length === 0}
		<p class="p-6 text-sm text-slate-500">
			No transactions yet. Add your first entry on the left.
		</p>
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
					{#each transactions as entry}
						{@const typeColor = entry.type === 'income' ? 'text-emerald-600' : entry.type === 'expense' ? 'text-rose-600' : entry.type === 'asset' ? 'text-blue-600' : 'text-purple-600'}
						{@const amountColor = entry.type === 'income' ? 'text-emerald-700' : entry.type === 'expense' ? 'text-rose-700' : entry.type === 'asset' ? 'text-blue-700' : 'text-purple-700'}
						<tr class="hover:bg-slate-50">
							<td class="px-4 py-3 text-slate-600">{entry.postedOn}</td>
							<td class={`px-4 py-3 font-medium ${typeColor}`}>
								{entry.type}
							</td>
							<td class="px-4 py-3 text-slate-600">{entry.category}</td>
							<td class="px-4 py-3 text-slate-600">{entry.description}</td>
							<td class={`px-4 py-3 text-right ${amountColor}`}>
								{formatCurrency(entry.amount)}
							</td>
							<td class="px-4 py-3 text-right">
								<button
									class="rounded border border-slate-300 px-3 py-1 text-xs text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
									onclick={() => onRemove(entry.id)}
								>
									Remove
								</button>
								{#if !entry.synced}
									<span
										class="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[0.65rem] font-medium text-amber-700"
										>Pending sync</span
									>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
