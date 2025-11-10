import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { database } from '$lib/server/database';
import type { TransactionDto } from '$lib/types';
import type { RequestHandler } from './$types';

const transactionSchema = z.object({
	id: z.string().min(1),
	postedOn: z.string().min(1),
	category: z.string().min(1),
	description: z.string().min(1),
	amount: z.number(),
	type: z.enum(['income', 'expense']),
	createdAt: z.string().min(1),
	updatedAt: z.string().min(1)
});

const arraySchema = transactionSchema.array();

export const GET: RequestHandler = async () => {
	return json({ data: database.all() });
};

export const POST: RequestHandler = async ({ request }) => {
	const payload = await request.json();
	const parsed = arraySchema.safeParse(Array.isArray(payload) ? payload : [payload]);
	if (!parsed.success) {
		return json(
			{ message: 'Invalid payload', issues: parsed.error.flatten() },
			{ status: 400 }
		);
	}

	const count = database.upsert(parsed.data as TransactionDto[]);
	return json({ count });
};

const removeSchema = z.object({ id: z.string().min(1) });

export const DELETE: RequestHandler = async ({ request, url }) => {
	const idParam = url.searchParams.get('id');
	const payload = idParam ? { id: idParam } : await request.json().catch(() => ({}));
	const parsed = removeSchema.safeParse(payload);
	if (!parsed.success) {
		return json({ message: 'Missing transaction id' }, { status: 400 });
	}

	const removed = database.remove(parsed.data.id);
	if (!removed) {
		return json({ message: 'Transaction not found' }, { status: 404 });
	}
	return json({ removed });
};
