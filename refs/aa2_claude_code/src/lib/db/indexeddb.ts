import type { Transaction } from '../stores/transactions';

const DB_NAME = 'AccountingAppDB';
const DB_VERSION = 1;
const STORE_NAME = 'transactions';

export class IndexedDBManager {
	private db: IDBDatabase | null = null;

	async init(): Promise<void> {
		return new Promise((resolve, reject) => {
			const request = indexedDB.open(DB_NAME, DB_VERSION);

			request.onerror = () => reject(request.error);
			request.onsuccess = () => {
				this.db = request.result;
				resolve();
			};

			request.onupgradeneeded = (event) => {
				const db = (event.target as IDBOpenDBRequest).result;

				if (!db.objectStoreNames.contains(STORE_NAME)) {
					const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
					store.createIndex('date', 'date', { unique: false });
					store.createIndex('category', 'category', { unique: false });
				}
			};
		});
	}

	async getAllTransactions(): Promise<Transaction[]> {
		if (!this.db) await this.init();

		return new Promise((resolve, reject) => {
			const transaction = this.db!.transaction([STORE_NAME], 'readonly');
			const store = transaction.objectStore(STORE_NAME);
			const request = store.getAll();

			request.onerror = () => reject(request.error);
			request.onsuccess = () => resolve(request.result || []);
		});
	}

	async addTransaction(transaction: Transaction): Promise<void> {
		if (!this.db) await this.init();

		return new Promise((resolve, reject) => {
			const dbTransaction = this.db!.transaction([STORE_NAME], 'readwrite');
			const store = dbTransaction.objectStore(STORE_NAME);
			const request = store.add(transaction);

			request.onerror = () => reject(request.error);
			request.onsuccess = () => resolve();
		});
	}

	async updateTransaction(transaction: Transaction): Promise<void> {
		if (!this.db) await this.init();

		return new Promise((resolve, reject) => {
			const dbTransaction = this.db!.transaction([STORE_NAME], 'readwrite');
			const store = dbTransaction.objectStore(STORE_NAME);
			const request = store.put(transaction);

			request.onerror = () => reject(request.error);
			request.onsuccess = () => resolve();
		});
	}

	async deleteTransaction(id: string): Promise<void> {
		if (!this.db) await this.init();

		return new Promise((resolve, reject) => {
			const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
			const store = transaction.objectStore(STORE_NAME);
			const request = store.delete(id);

			request.onerror = () => reject(request.error);
			request.onsuccess = () => resolve();
		});
	}

	async clearAllTransactions(): Promise<void> {
		if (!this.db) await this.init();

		return new Promise((resolve, reject) => {
			const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
			const store = transaction.objectStore(STORE_NAME);
			const request = store.clear();

			request.onerror = () => reject(request.error);
			request.onsuccess = () => resolve();
		});
	}

	async getTransactionsByCategory(category: string): Promise<Transaction[]> {
		if (!this.db) await this.init();

		return new Promise((resolve, reject) => {
			const transaction = this.db!.transaction([STORE_NAME], 'readonly');
			const store = transaction.objectStore(STORE_NAME);
			const index = store.index('category');
			const request = index.getAll(category);

			request.onerror = () => reject(request.error);
			request.onsuccess = () => resolve(request.result || []);
		});
	}

	async exportData(): Promise<Transaction[]> {
		return this.getAllTransactions();
	}

	async importData(transactions: Transaction[]): Promise<void> {
		if (!this.db) await this.init();

		return new Promise((resolve, reject) => {
			const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
			const store = transaction.objectStore(STORE_NAME);

			// Clear existing data first
			store.clear();

			// Add all imported transactions
			let completed = 0;
			const total = transactions.length;

			if (total === 0) {
				resolve();
				return;
			}

			transactions.forEach((txn) => {
				const request = store.add(txn);
				request.onsuccess = () => {
					completed++;
					if (completed === total) resolve();
				};
				request.onerror = () => reject(request.error);
			});
		});
	}
}

export const dbManager = new IndexedDBManager();