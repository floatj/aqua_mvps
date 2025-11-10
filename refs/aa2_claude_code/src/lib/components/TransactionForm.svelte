<script lang="ts">
	import { transactions } from '$lib/stores/transactions';

	let date = new Date().toISOString().split('T')[0];
	let description = '';
	let category: 'income' | 'expense' | 'asset' | 'liability' = 'expense';
	let amount = '';

	async function handleSubmit() {
		if (!description || !amount || !date) return;

		await transactions.add({
			date,
			description,
			category,
			amount: parseFloat(amount)
		});

		// Reset form
		description = '';
		amount = '';
		date = new Date().toISOString().split('T')[0];
		category = 'expense';
	}
</script>

<div class="bg-white rounded-lg shadow-md p-6 mb-6">
	<h2 class="text-2xl font-bold text-gray-800 mb-4">Add Transaction</h2>

	<form on:submit|preventDefault={handleSubmit} class="space-y-4">
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<div>
				<label for="date" class="block text-sm font-medium text-gray-700 mb-1">Date</label>
				<input
					id="date"
					type="date"
					bind:value={date}
					required
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>

			<div>
				<label for="description" class="block text-sm font-medium text-gray-700 mb-1">Description</label>
				<input
					id="description"
					type="text"
					bind:value={description}
					placeholder="Transaction description"
					required
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<div>
				<label for="category" class="block text-sm font-medium text-gray-700 mb-1">Category</label>
				<select
					id="category"
					bind:value={category}
					required
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					<option value="income">Income</option>
					<option value="expense">Expense</option>
					<option value="asset">Asset</option>
					<option value="liability">Liability</option>
				</select>
			</div>

			<div>
				<label for="amount" class="block text-sm font-medium text-gray-700 mb-1">Amount</label>
				<input
					id="amount"
					type="number"
					bind:value={amount}
					placeholder="0.00"
					step="0.01"
					required
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>
		</div>

		<button
			type="submit"
			class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200"
		>
			Add Transaction
		</button>
	</form>
</div>