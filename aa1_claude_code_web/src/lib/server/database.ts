import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type { TransactionDto } from '$lib/types';

const dbPath = resolve(process.cwd(), process.env.DB_PATH ?? 'sqlite/ledger.db');
mkdirSync(dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS transactions (
	id TEXT PRIMARY KEY,
	posted_on TEXT NOT NULL,
	category TEXT NOT NULL,
	description TEXT NOT NULL,
	amount REAL NOT NULL,
	type TEXT CHECK(type IN ('income','expense','asset','liability')) NOT NULL,
	created_at TEXT NOT NULL,
	updated_at TEXT NOT NULL
);
`);

const listStmt = db.prepare<[], TransactionDto>('SELECT id, posted_on as postedOn, category, description, amount, type, created_at as createdAt, updated_at as updatedAt FROM transactions ORDER BY datetime(posted_on) DESC, datetime(updated_at) DESC');
const upsertStmt = db.prepare(`
INSERT INTO transactions (id, posted_on, category, description, amount, type, created_at, updated_at)
VALUES (@id, @postedOn, @category, @description, @amount, @type, @createdAt, @updatedAt)
ON CONFLICT(id) DO UPDATE SET
	posted_on = excluded.posted_on,
	category = excluded.category,
	description = excluded.description,
	amount = excluded.amount,
	type = excluded.type,
	updated_at = excluded.updated_at;
`);
const deleteStmt = db.prepare('DELETE FROM transactions WHERE id = ?');

export const database = {
	all(): TransactionDto[] {
		return listStmt.all();
	},
	upsert(batch: TransactionDto[]): number {
		const txn = db.transaction((rows: TransactionDto[]) => {
			for (const row of rows) {
				upsertStmt.run(row);
			}
			return rows.length;
		});
		return txn(batch);
	},
	remove(id: string): number {
		const info = deleteStmt.run(id);
		return info.changes ?? 0;
	}
};
