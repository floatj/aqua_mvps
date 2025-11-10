<script lang="ts">
	import { onMount } from 'svelte';
	import { transactions } from '$lib/stores/transactions';
	import TransactionForm from '$lib/components/TransactionForm.svelte';
	import Summary from '$lib/components/Summary.svelte';
	import TransactionList from '$lib/components/TransactionList.svelte';
	import PWAInstallButton from '$lib/components/PWAInstallButton.svelte';

	onMount(async () => {
		await transactions.load();
	});
</script>

<div class="min-h-screen bg-gray-100">
	<div class="container mx-auto px-4 py-8">
		<header class="text-center mb-8">
			<h1 class="text-4xl font-bold text-gray-800 mb-2">Accounting App</h1>
			<p class="text-gray-600">Track your finances with ease</p>
		</header>

		<main class="max-w-6xl mx-auto">
			<TransactionForm />
			<Summary />
			<TransactionList />
		</main>
	</div>

	<PWAInstallButton />
</div>
