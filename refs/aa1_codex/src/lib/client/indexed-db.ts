import type { TransactionDto } from '$lib/types';
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

export interface ClientTransaction extends TransactionDto {
	synced: boolean;
	pendingDelete?: boolean;
}

interface LedgerDB extends DBSchema {
	transactions: {
		key: string;
		value: ClientTransaction;
		indexes: {
			'by-postedOn': 'postedOn';
		};
	};
}

let dbPromise: Promise<IDBPDatabase<LedgerDB>> | undefined;

const getDb = () => {
	if (!dbPromise) {
		dbPromise = openDB<LedgerDB>('ledgerlite', 1, {
			upgrade(db) {
				const store = db.createObjectStore('transactions', { keyPath: 'id' });
				store.createIndex('by-postedOn', 'postedOn');
			}
		});
	}
	return dbPromise;
};

export const storeTransactions = async (rows: ClientTransaction[]) => {
	const db = await getDb();
	const tx = db.transaction('transactions', 'readwrite');
	for (const row of rows) {
		tx.store.put(row);
	}
	await tx.done;
};

export const allTransactions = async () => {
	const db = await getDb();
	return db.getAll('transactions');
};

export const unsyncedTransactions = async () => {
	const db = await getDb();
	const rows = await db.getAll('transactions');
	return rows.filter((record) => !record.synced);
};

export const deleteTransaction = async (id: string) => {
	const db = await getDb();
	return db.delete('transactions', id);
};

export const markSynced = async (ids: string[]) => {
	const db = await getDb();
	const tx = db.transaction('transactions', 'readwrite');
	for (const id of ids) {
		const record = await tx.store.get(id);
		if (record) {
			record.synced = true;
			record.updatedAt = new Date().toISOString();
			tx.store.put(record);
		}
	}
	await tx.done;
};

export const replaceFromServer = async (rows: TransactionDto[]) => {
	const db = await getDb();
	const tx = db.transaction('transactions', 'readwrite');
	await tx.store.clear();
	for (const row of rows) {
		tx.store.put({ ...row, synced: true });
	}
	await tx.done;
};

export const updateTransaction = async (row: ClientTransaction) => {
	const db = await getDb();
	await db.put('transactions', row);
};

export const clearAll = async () => {
	const db = await getDb();
	await db.clear('transactions');
};
