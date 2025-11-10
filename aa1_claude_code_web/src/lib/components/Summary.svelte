<script lang="ts">
	type Props = {
		income: number;
		expense: number;
		asset: number;
		liability: number;
		formatCurrency: (value: number) => string;
	};

	let { income, expense, asset, liability, formatCurrency }: Props = $props();

	let netWorth = $derived(asset - liability);
	let netIncome = $derived(income - expense);
	let netWorthColor = $derived(netWorth >= 0 ? 'text-slate-900' : 'text-rose-700');
	let netIncomeColor = $derived(netIncome >= 0 ? 'text-slate-900' : 'text-rose-700');
</script>

<section class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
	<div class="rounded-xl bg-white p-4 shadow">
		<p class="text-sm text-slate-500">Total Income</p>
		<p class="text-2xl font-semibold text-emerald-600">{formatCurrency(income)}</p>
	</div>
	<div class="rounded-xl bg-white p-4 shadow">
		<p class="text-sm text-slate-500">Total Expense</p>
		<p class="text-2xl font-semibold text-rose-600">{formatCurrency(expense)}</p>
	</div>
	<div class="rounded-xl bg-white p-4 shadow">
		<p class="text-sm text-slate-500">Total Assets</p>
		<p class="text-2xl font-semibold text-blue-600">{formatCurrency(asset)}</p>
	</div>
	<div class="rounded-xl bg-white p-4 shadow">
		<p class="text-sm text-slate-500">Total Liabilities</p>
		<p class="text-2xl font-semibold text-purple-600">{formatCurrency(liability)}</p>
	</div>
</section>

<section class="grid gap-4 sm:grid-cols-2">
	<div class="rounded-xl bg-white p-4 shadow">
		<p class="text-sm text-slate-500">Net Income (Income - Expense)</p>
		<p class={`text-2xl font-semibold ${netIncomeColor}`}>
			{formatCurrency(netIncome)}
		</p>
	</div>
	<div class="rounded-xl bg-white p-4 shadow">
		<p class="text-sm text-slate-500">Net Worth (Assets - Liabilities)</p>
		<p class={`text-2xl font-semibold ${netWorthColor}`}>
			{formatCurrency(netWorth)}
		</p>
	</div>
</section>
