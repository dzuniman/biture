import axios from 'axios';
import type {
  Client,
  ClientCreateRequest,
  Quote,
  QuoteCreateRequest
} from './types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5227/api'
});

export async function getClients(): Promise<Client[]> {
  const response = await api.get<Client[]>('/clients');
  return response.data;
}

export async function createClient(payload: ClientCreateRequest): Promise<Client> {
  const response = await api.post<Client>('/clients', payload);
  return response.data;
}

export async function updateClient(id: string, payload: ClientCreateRequest): Promise<void> {
  await api.put(`/clients/${id}`, payload);
}

export async function deleteClient(id: string): Promise<void> {
  await api.delete(`/clients/${id}`);
}

export async function getQuotes(): Promise<Quote[]> {
  const response = await api.get<any[]>('/quotes');
  return response.data.map((quote) => ({
    id: quote.id,
    quoteNumber: quote.quoteNumber,
    reference: quote.reference,
    date: quote.date,
    validityDays: quote.validityDays,
    vendorNumber: quote.vendorNumber,
    clientId: quote.clientId,
    client: quote.client ? {
      id: quote.client.id,
      name: quote.client.name
    } : null,
    items: quote.items ?? [],
    subTotal: Number(quote.subTotal ?? 0),
    vat: Number(quote.vat ?? 0),
    total: Number(quote.total ?? 0)
  }));
}

export async function getQuote(id: string): Promise<Quote> {
  const response = await api.get<any>(`/quotes/${id}`);
  const quote = response.data;
  return {
    id: quote.id,
    quoteNumber: quote.quoteNumber,
    reference: quote.reference,
    date: quote.date,
    validityDays: quote.validityDays,
    vendorNumber: quote.vendorNumber,
    clientId: quote.clientId,
    client: quote.client ? {
      id: quote.client.id,
      name: quote.client.name,
      addressLine1: quote.client.addressLine1,
      addressLine2: quote.client.addressLine2,
      addressLine3: quote.client.addressLine3,
      addressLine4: quote.client.addressLine4,
      representativeName: quote.client.representativeName,
      representativeNumber: quote.client.representativeNumber
    } : null,
    items: (quote.items ?? []).map((item: any) => ({
      id: item.id,
      itemNumber: item.itemNumber,
      quantity: item.quantity,
      uom: item.uom,
      description: item.description,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice
    })),
    subTotal: Number(quote.subTotal ?? 0),
    vat: Number(quote.vat ?? 0),
    total: Number(quote.total ?? 0)
  };
}

export async function createQuote(payload: QuoteCreateRequest): Promise<Quote> {
  const response = await api.post<Quote>('/quotes', payload);
  return response.data;
}

export async function updateQuote(id: string, payload: QuoteCreateRequest): Promise<void> {
  await api.put(`/quotes/${id}`, payload);
}

export async function deleteQuote(id: string): Promise<void> {
  await api.delete(`/quotes/${id}`);
}
