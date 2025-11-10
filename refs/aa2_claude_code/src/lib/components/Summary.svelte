<script lang="ts">
	import { transactions, type Transaction } from '$lib/stores/transactions';

	let transactionList: Transaction[] = [];
	transactions.subscribe(value => {
		transactionList = value;
	});

	$: totalIncome = transactionList
		.filter(t => t.category === 'income')
		.reduce((sum, t) => sum + t.amount, 0);

	$: totalExpenses = transactionList
		.filter(t => t.category === 'expense')
		.reduce((sum, t) => sum + t.amount, 0);

	$: totalAssets = transactionList
		.filter(t => t.category === 'asset')
		.reduce((sum, t) => sum + t.amount, 0);

	$: totalLiabilities = transactionList
		.filter(t => t.category === 'liability')
		.reduce((sum, t) => sum + t.amount, 0);

	$: netBalance = totalIncome - totalExpenses + totalAssets - totalLiabilities;

	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD'
		}).format(amount);
	}
</script>

<div class="bg-white rounded-lg shadow-md p-6 mb-6">
	<h2 class="text-2xl font-bold text-gray-800 mb-4">Summary</h2>

	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
		<div class="bg-green-50 border border-green-200 rounded-lg p-4">
			<h3 class="text-sm font-medium text-green-800 mb-1">Total Income</h3>
			<p class="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</p>
		</div>

		<div class="bg-red-50 border border-red-200 rounded-lg p-4">
			<h3 class="text-sm font-medium text-red-800 mb-1">Total Expenses</h3>
			<p class="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
		</div>

		<div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
			<h3 class="text-sm font-medium text-blue-800 mb-1">Total Assets</h3>
			<p class="text-2xl font-bold text-blue-600">{formatCurrency(totalAssets)}</p>
		</div>

		<div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
			<h3 class="text-sm font-medium text-purple-800 mb-1">Net Balance</h3>
			<p class="text-2xl font-bold {netBalance >= 0 ? 'text-green-600' : 'text-red-600'}">
				{formatCurrency(netBalance)}
			</p>
		</div>
	</div>
</div>