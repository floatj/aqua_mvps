import { database } from '$lib/server/database';
import type { RequestHandler } from './$types';

const escapeCsv = (value: string | number) => {
	const text = typeof value === 'number' ? value.toString() : value ?? '';
	return /[",\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
};

export const GET: RequestHandler = async () => {
	const rows = database.all();
	const header = ['id', 'posted_on', 'category', 'description', 'amount', 'type', 'created_at', 'updated_at'];
	const lines = rows.map((row) =>
		header
			.map((column) => {
				const key = column
					.split('_')
					.map((part, index) => (index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)))
					.join('');
				const typedKey = key as keyof typeof row;
				return escapeCsv(row[typedKey]);
			})
			.join(',')
	);

	const csv = [header.join(','), ...lines].join('\n');
	return new Response(csv, {
		headers: {
			'Content-Type': 'text/csv; charset=utf-8',
			'Content-Disposition': 'attachment; filename="ledgerlite-transactions.csv"'
		}
	});
};