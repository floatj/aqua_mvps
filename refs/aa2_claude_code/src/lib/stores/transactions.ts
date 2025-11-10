import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { dbManager } from '../db/indexeddb';

export interface Transaction {
	id: string;
	date: string;
	description: string;
	category: 'income' | 'expense' | 'asset' | 'liability';
	amount: number;
}

function createTransactionStore() {
	const { subscribe, set, update } = writable<Transaction[]>([]);

	return {
		subscribe,
		add: async (transaction: Omit<Transaction, 'id'>) => {
			const newTransaction: Transaction = {
				...transaction,
				id: Date.now().toString()
			};

			if (browser) {
				try {
					await dbManager.addTransaction(newTransaction);
					update(transactions => [...transactions, newTransaction]);
				} catch (error) {
					console.error('Failed to add transaction:', error);
				}
			} else {
				update(transactions => [...transactions, newTransaction]);
			}
		},
		remove: async (id: string) => {
			if (browser) {
				try {
					await dbManager.deleteTransaction(id);
					update(transactions => transactions.filter(t => t.id !== id));
				} catch (error) {
					console.error('Failed to remove transaction:', error);
				}
			} else {
				update(transactions => transactions.filter(t => t.id !== id));
			}
		},
		load: async () => {
			if (browser) {
				try {
					const transactions = await dbManager.getAllTransactions();
					set(transactions);
				} catch (error) {
					console.error('Failed to load transactions:', error);
					// Fallback to localStorage for migration
					const stored = localStorage.getItem('transactions');
					if (stored) {
						const oldTransactions = JSON.parse(stored);
						set(oldTransactions);
						// Migrate to IndexedDB
						for (const txn of oldTransactions) {
							try {
								await dbManager.addTransaction(txn);
							} catch (e) {
								console.error('Migration failed for transaction:', txn, e);
							}
						}
						localStorage.removeItem('transactions');
					}
				}
			}
		},
		clear: async () => {
			if (browser) {
				try {
					await dbManager.clearAllTransactions();
					set([]);
				} catch (error) {
					console.error('Failed to clear transactions:', error);
				}
			} else {
				set([]);
			}
		},
		exportCSV: (transactions: Transaction[]) => {
			const headers = ['Date', 'Description', 'Category', 'Amount'];
			const csvContent = [
				headers.join(','),
				...transactions.map(t =>
					`${t.date},"${t.description}",${t.category},${t.amount}`
				)
			].join('\n');

			const blob = new Blob([csvContent], { type: 'text/csv' });
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.setAttribute('hidden', '');
			a.setAttribute('href', url);
			a.setAttribute('download', 'transactions.csv');
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
		},
		exportJSON: async (): Promise<void> => {
			if (browser) {
				try {
					const transactions = await dbManager.getAllTransactions();
					const jsonContent = JSON.stringify(transactions, null, 2);
					const blob = new Blob([jsonContent], { type: 'application/json' });
					const url = window.URL.createObjectURL(blob);
					const a = document.createElement('a');
					a.setAttribute('hidden', '');
					a.setAttribute('href', url);
					a.setAttribute('download', 'transactions-backup.json');
					document.body.appendChild(a);
					a.click();
					document.body.removeChild(a);
				} catch (error) {
					console.error('Failed to export JSON:', error);
				}
			}
		},
		importJSON: async (jsonData: Transaction[]): Promise<void> => {
			if (browser) {
				try {
					await dbManager.importData(jsonData);
					set(jsonData);
				} catch (error) {
					console.error('Failed to import JSON:', error);
				}
			}
		}
	};
}

export const transactions = createTransactionStore();