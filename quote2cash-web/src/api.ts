import axios from 'axios';
import type {
  Client,
  ClientCreateRequest,
  Quote,
  QuoteCreateRequest,
  JobCard,
  JobCardCreateRequest,
  Cost,
  CostCreateRequest,
  Invoice,
  InvoiceCreateRequest,
  Statement,
  StatementCreateRequest
} from './types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'https://localhost:5001/api'
});

export async function getClients(): Promise<Client[]> {
  const response = await api.get<Client[]>('/clients');
  return response.data;
}

export async function createClient(payload: ClientCreateRequest): Promise<Client> {
  const response = await api.post<Client>('/clients', payload);
  return response.data;
}

export async function getQuotes(): Promise<Quote[]> {
  const response = await api.get<Quote[]>('/quotes');
  return response.data;
}

export async function createQuote(payload: QuoteCreateRequest): Promise<Quote> {
  const response = await api.post<Quote>('/quotes', payload);
  return response.data;
}

export async function getJobCards(): Promise<JobCard[]> {
  const response = await api.get<JobCard[]>('/jobcards');
  return response.data;
}

export async function createJobCard(payload: JobCardCreateRequest): Promise<JobCard> {
  const response = await api.post<JobCard>('/jobcards', payload);
  return response.data;
}

export async function getCosts(): Promise<Cost[]> {
  const response = await api.get<Cost[]>('/costs');
  return response.data;
}

export async function createCost(payload: CostCreateRequest): Promise<Cost> {
  const response = await api.post<Cost>('/costs', payload);
  return response.data;
}

export async function getInvoices(): Promise<Invoice[]> {
  const response = await api.get<Invoice[]>('/invoices');
  return response.data;
}

export async function createInvoice(payload: InvoiceCreateRequest): Promise<Invoice> {
  const response = await api.post<Invoice>('/invoices', payload);
  return response.data;
}

export async function getStatements(): Promise<Statement[]> {
  const response = await api.get<Statement[]>('/statements');
  return response.data;
}

export async function createStatement(payload: StatementCreateRequest): Promise<Statement> {
  const response = await api.post<Statement>('/statements', payload);
  return response.data;
}
