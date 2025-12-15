export enum UserRole {
  PATRON = 'PATRON',
  RESPONSABLE = 'RESPONSABLE'
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
}

export interface Comment {
  id: string;
  authorId: string;
  content: string;
  date: string;
}

export interface Recap {
  id: string;
  title: string;
  type: 'DAILY' | 'WEEKLY';
  description: string;
  date: string; // ISO date
  authorId: string;
  mediaUrls: string[];
  comments: Comment[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: string; // ISO datetime
  authorId: string;
}

export interface DocumentItem {
  id: string;
  name: string;
  type: 'CONTRACT' | 'INVOICE' | 'QUOTE' | 'OTHER';
  date: string;
  authorId: string;
  size: string;
}

export enum TransactionType {
  BUDGET_ADD = 'BUDGET_ADD', // Patron sends money
  EXPENSE = 'EXPENSE'        // Manager spends money
}

export type CurrencyCode = 'EUR' | 'USD' | 'XOF';

export interface Transaction {
  id: string;
  amount: number;
  reason: string;
  date: string;
  type: TransactionType;
  currency: CurrencyCode;
  authorId: string;
}

export interface AppData {
  recaps: Recap[];
  events: CalendarEvent[];
  documents: DocumentItem[];
  transactions: Transaction[];
}