<script lang="ts">
	import { transactions, type Transaction } from '$lib/stores/transactions';

	let transactionList: Transaction[] = [];
	let filteredTransactions: Transaction[] = [];
	let filterCategory = '';

	transactions.subscribe(value => {
		transactionList = value;
		filterTransactions();
	});

	function filterTransactions() {
		if (!filterCategory) {
			filteredTransactions = [...transactionList].sort((a, b) =>
				new Date(b.date).getTime() - new Date(a.date).getTime()
			);
		} else {
			filteredTransactions = transactionList
				.filter(t => t.category === filterCategory)
				.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
		}
	}

	function handleFilterChange() {
		filterTransactions();
	}

	async function deleteTransaction(id: string) {
		if (confirm('Are you sure you want to delete this transaction?')) {
			await transactions.remove(id);
		}
	}

	async function clearAllTransactions() {
		if (confirm('Are you sure you want to clear all transactions? This cannot be undone.')) {
			await transactions.clear();
		}
	}

	function exportToCSV() {
		transactions.exportCSV(filteredTransactions);
	}

	async function exportToJSON() {
		await transactions.exportJSON();
	}

	async function importFromJSON() {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = '.json';
		input.onchange = async (event) => {
			const file = (event.target as HTMLInputElement)?.files?.[0];
			if (file) {
				const text = await file.text();
				try {
					const data = JSON.parse(text);
					if (Array.isArray(data) && data.every(item =>
						typeof item === 'object' &&
						'id' in item &&
						'date' in item &&
						'description' in item &&
						'category' in item &&
						'amount' in item
					)) {
						await transactions.importJSON(data);
					} else {
						alert('Invalid JSON format. Please select a valid transactions backup file.');
					}
				} catch (error) {
					alert('Error reading file. Please select a valid JSON file.');
				}
			}
		};
		input.click();
	}

	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD'
		}).format(amount);
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function getCategoryColor(category: string): string {
		switch (category) {
			case 'income': return 'bg-green-100 text-green-800';
			case 'expense': return 'bg-red-100 text-red-800';
			case 'asset': return 'bg-blue-100 text-blue-800';
			case 'liability': return 'bg-purple-100 text-purple-800';
			default: return 'bg-gray-100 text-gray-800';
		}
	}
</script>

<div class="bg-white rounded-lg shadow-md p-6">
	<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
		<h2 class="text-2xl font-bold text-gray-800">Transactions</h2>

		<div class="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
			<select
				bind:value={filterCategory}
				on:change={handleFilterChange}
				class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
			>
				<option value="">All Categories</option>
				<option value="income">Income</option>
				<option value="expense">Expense</option>
				<option value="asset">Asset</option>
				<option value="liability">Liability</option>
			</select>

			<button
				on:click={exportToCSV}
				disabled={filteredTransactions.length === 0}
				class="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200 text-sm"
			>
				CSV
			</button>

			<button
				on:click={exportToJSON}
				disabled={transactionList.length === 0}
				class="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200 text-sm"
			>
				Backup
			</button>

			<button
				on:click={importFromJSON}
				class="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition duration-200 text-sm"
			>
				Import
			</button>

			<button
				on:click={clearAllTransactions}
				disabled={transactionList.length === 0}
				class="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200 text-sm"
			>
				Clear
			</button>
		</div>
	</div>

	{#if filteredTransactions.length === 0}
		<p class="text-gray-500 text-center py-8">
			{transactionList.length === 0 ? 'No transactions yet. Add your first transaction above.' : 'No transactions match the current filter.'}
		</p>
	{:else}
		<div class="overflow-x-auto">
			<table class="min-w-full">
				<thead>
					<tr class="border-b border-gray-200">
						<th class="text-left py-3 px-2 font-medium text-gray-700">Date</th>
						<th class="text-left py-3 px-2 font-medium text-gray-700">Description</th>
						<th class="text-left py-3 px-2 font-medium text-gray-700">Category</th>
						<th class="text-right py-3 px-2 font-medium text-gray-700">Amount</th>
						<th class="text-center py-3 px-2 font-medium text-gray-700">Action</th>
					</tr>
				</thead>
				<tbody>
					{#each filteredTransactions as transaction (transaction.id)}
						<tr class="border-b border-gray-100 hover:bg-gray-50">
							<td class="py-3 px-2 text-sm text-gray-600">{formatDate(transaction.date)}</td>
							<td class="py-3 px-2 text-sm text-gray-800">{transaction.description}</td>
							<td class="py-3 px-2">
								<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize {getCategoryColor(transaction.category)}">
									{transaction.category}
								</span>
							</td>
							<td class="py-3 px-2 text-sm text-right font-medium {transaction.category === 'income' || transaction.category === 'asset' ? 'text-green-600' : 'text-red-600'}">
								{formatCurrency(transaction.amount)}
							</td>
							<td class="py-3 px-2 text-center">
								<button
									on:click={() => deleteTransaction(transaction.id)}
									class="text-red-600 hover:text-red-800 focus:outline-none"
									aria-label="Delete transaction"
									title="Delete transaction"
								>
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
									</svg>
								</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>