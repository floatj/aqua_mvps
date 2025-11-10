<script lang="ts">
	type Props = {
		income: number;
		expense: number;
		formatCurrency: (value: number) => string;
	};

	let { income, expense, formatCurrency }: Props = $props();

	let balance = $derived(income - expense);
	let balanceColor = $derived(balance >= 0 ? 'text-slate-900' : 'text-rose-700');
</script>

<section class="grid gap-4 sm:grid-cols-3">
	<div class="rounded-xl bg-white p-4 shadow">
		<p class="text-sm text-slate-500">Total Income</p>
		<p class="text-2xl font-semibold text-emerald-600">{formatCurrency(income)}</p>
	</div>
	<div class="rounded-xl bg-white p-4 shadow">
		<p class="text-sm text-slate-500">Total Expense</p>
		<p class="text-2xl font-semibold text-rose-600">{formatCurrency(expense)}</p>
	</div>
	<div class="rounded-xl bg-white p-4 shadow">
		<p class="text-sm text-slate-500">Balance</p>
		<p class={`text-2xl font-semibold ${balanceColor}`}>
			{formatCurrency(balance)}
		</p>
	</div>
</section>
