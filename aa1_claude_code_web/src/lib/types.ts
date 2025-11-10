export type TransactionType = 'income' | 'expense' | 'asset' | 'liability';

export interface TransactionDto {
	id: string;
	postedOn: string;
	category: string;
	description: string;
	amount: number;
	type: TransactionType;
	createdAt: string;
	updatedAt: string;
}