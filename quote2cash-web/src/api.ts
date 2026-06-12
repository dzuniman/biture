import axios from 'axios';
import type {
  Client,
  ClientCreateRequest,
  Quote,
  QuoteCreateRequest,
  QuoteUom,
  QuoteDescription,
  User,
  UserCreateRequest,
  UserUpdateRequest,
  JobCard,
  JobCardCreateRequest,
  Cost,
  CostCreateRequest,
  Invoice,
  InvoiceCreateRequest,
  Statement,
  StatementCreateRequest,
  LoginRequest,
  AuthResponse
} from './types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:5227'
});

// Add a request interceptor to include the JWT token in the header
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Add a request interceptor for debugging
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error.response?.status, error.message);
    if (error.code === 'ERR_NETWORK') {
      console.error('Network Error: This is likely a CORS issue or the API is unreachable.');
    }
    // Auto-logout if token is expired or invalid (401 Unauthorized)
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

export async function login(payload: LoginRequest): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/auth/login', payload);
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
  }
  return response.data;
}

export function logout(): void {
  localStorage.removeItem('token');
}

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
      vendorNumber: quote.client.vendorNumber,
      addressLine1: quote.client.addressLine1,
      addressLine2: quote.client.addressLine2,
      addressLine3: quote.client.addressLine3,
      addressLine4: quote.client.addressLine4,
      vatNumber: quote.client.vatNumber,
      email: quote.client.email,
      representativeName: quote.client.representativeName,
      representativeNumber: quote.client.representativeNumber
    } : null,
    items: (quote.items ?? []).map((item: any) => ({
      id: item.id,
      itemNumber: item.itemNumber,
      quantity: item.quantity,
      code: item.code,
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

export async function getQuoteNextNumber(): Promise<string> {
  const response = await api.get<{ nextQuoteNumber: string }>('/quotes/next-number');
  return response.data.nextQuoteNumber;
}

export async function getQuoteUoms(): Promise<QuoteUom[]> {
  const response = await api.get<QuoteUom[]>('/quoteuoms');
  return response.data;
}

export async function createQuoteUom(payload: QuoteUom): Promise<QuoteUom> {
  const response = await api.post<QuoteUom>('/quoteuoms', payload);
  return response.data;
}

export async function updateQuoteUom(id: string, payload: QuoteUom): Promise<void> {
  await api.put(`/quoteuoms/${id}`, payload);
}

export async function deleteQuoteUom(id: string): Promise<void> {
  await api.delete(`/quoteuoms/${id}`);
}

export async function getQuoteDescriptions(): Promise<QuoteDescription[]> {
  const response = await api.get<QuoteDescription[]>('/quotedescriptions');
  return response.data;
}

export async function createQuoteDescription(payload: QuoteDescription): Promise<QuoteDescription> {
  const response = await api.post<QuoteDescription>('/quotedescriptions', payload);
  return response.data;
}

export async function updateQuoteDescription(id: string, payload: QuoteDescription): Promise<void> {
  await api.put(`/quotedescriptions/${id}`, payload);
}

export async function deleteQuoteDescription(id: string): Promise<void> {
  await api.delete(`/quotedescriptions/${id}`);
}

export async function getUsers(): Promise<User[]> {
  const response = await api.get<any[]>('/users');
  return response.data.map((user) => ({
    id: user.id,
    username: user.username,
    role: user.role
  }));
}

export async function createUser(payload: UserCreateRequest): Promise<User> {
  const response = await api.post<User>('/users', payload);
  return response.data;
}

export async function updateUser(id: string, payload: UserUpdateRequest): Promise<void> {
  await api.put(`/users/${id}`, payload);
}

export async function deleteUser(id: string): Promise<void> {
  await api.delete(`/users/${id}`);
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

export async function getJobCards(): Promise<JobCard[]> {
  const response = await api.get<any[]>('/jobcards');
  return response.data.map(jc => ({
    ...jc,
    totalCost: Number(jc.totalCost ?? 0),
    costTotal: jc.costTotal ? Number(jc.costTotal) : undefined,
    client: jc.client ? { id: jc.client.id, name: jc.client.name } : null
  }));
}

export async function createJobCard(payload: JobCardCreateRequest): Promise<JobCard> {
  const response = await api.post<JobCard>('/jobcards', payload);
  return response.data;
}

export async function updateJobCard(id: string, payload: JobCardCreateRequest): Promise<void> {
  await api.put(`/jobcards/${id}`, payload);
}

export async function deleteJobCard(id: string): Promise<void> {
  await api.delete(`/jobcards/${id}`);
}

export async function getCosts(): Promise<Cost[]> {
  const response = await api.get<any[]>('/costs');
  return response.data.map(cost => ({
    ...cost,
    amount: Number(cost.amount ?? 0),
    client: cost.client ? { id: cost.client.id, name: cost.client.name } : null,
    jobCard: cost.jobCard ? { id: cost.jobCard.id, jobNumber: cost.jobCard.jobNumber } : null
  }));
}

export async function createCost(payload: CostCreateRequest): Promise<Cost> {
  const response = await api.post<Cost>('/costs', payload);
  return response.data;
}

export async function getInvoices(): Promise<Invoice[]> {
  const response = await api.get<any[]>('/invoices');
  return response.data.map(inv => ({
    ...inv,
    amount: Number(inv.amount ?? 0),
    client: inv.client ? { 
      id: inv.client.id, 
      name: inv.client.name,
      addressLine1: inv.client.addressLine1,
      addressLine2: inv.client.addressLine2,
      addressLine3: inv.client.addressLine3,
      addressLine4: inv.client.addressLine4,
      representativeName: inv.client.representativeName,
      representativeNumber: inv.client.representativeNumber
    } : null,
    quote: inv.quote ? {
      id: inv.quote.id,
      quoteNumber: inv.quote.quoteNumber,
      reference: inv.quote.reference
    } : null
  }));
}

export async function getInvoice(id: string): Promise<Invoice> {
  const response = await api.get<any>(`/invoices/${id}`);
  const inv = response.data;
  return {
    id: inv.id,
    invoiceNumber: inv.invoiceNumber,
    amount: Number(inv.amount ?? 0),
    status: inv.status,
    createdAt: inv.createdAt,
    dueDate: inv.dueDate,
    description: inv.description,
    isOverdue: inv.isOverdue,
    client: inv.client ? { 
      id: inv.client.id, 
      name: inv.client.name,
      vendorNumber: inv.client.vendorNumber,
      addressLine1: inv.client.addressLine1,
      addressLine2: inv.client.addressLine2,
      addressLine3: inv.client.addressLine3,
      addressLine4: inv.client.addressLine4,
      representativeName: inv.client.representativeName,
      representativeNumber: inv.client.representativeNumber
    } : null,
    quote: inv.quote ? {
      id: inv.quote.id,
      quoteNumber: inv.quote.quoteNumber,
      reference: inv.quote.reference,
      date: inv.quote.date,
      validityDays: inv.quote.validityDays,
      items: (inv.quote.items ?? []).map((item: any) => ({
        id: item.id,
        itemNumber: item.itemNumber,
        quantity: item.quantity,
        code: item.code,
        uom: item.uom,
        description: item.description,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice
      })),
      subTotal: Number(inv.quote.subTotal ?? 0),
      vat: Number(inv.quote.vat ?? 0),
      total: Number(inv.quote.total ?? 0),
      client: inv.quote.client ? {
        id: inv.quote.client.id,
        name: inv.quote.client.name,
        vendorNumber: inv.quote.client.vendorNumber,
        addressLine1: inv.quote.client.addressLine1,
        addressLine2: inv.quote.client.addressLine2,
        addressLine3: inv.quote.client.addressLine3,
        addressLine4: inv.quote.client.addressLine4,
        representativeName: inv.quote.client.representativeName,
        representativeNumber: inv.quote.client.representativeNumber
      } : null
    } : null
  };
}

export async function getInvoiceNextNumber(): Promise<string> {
  const response = await api.get<{ nextInvoiceNumber: string }>('/invoices/next-number');
  return response.data.nextInvoiceNumber;
}

export async function createInvoice(payload: InvoiceCreateRequest): Promise<Invoice> {
  const response = await api.post<Invoice>('/invoices', payload);
  return response.data;
}

export async function updateInvoice(id: string, payload: InvoiceCreateRequest): Promise<void> {
  await api.put(`/invoices/${id}`, payload);
}

export async function deleteInvoice(id: string): Promise<void> {
  await api.delete(`/invoices/${id}`);
}

export async function updateInvoiceStatus(id: string, status: string): Promise<void> {
  await api.patch(`/invoices/${id}/status`, { status });
}

export async function getStatements(): Promise<Statement[]> {
  const response = await api.get<any[]>('/statements');
  return response.data.map(stmt => ({
    ...stmt,
    balance: Number(stmt.balance ?? 0),
    invoiceTotal: stmt.invoiceTotal ? Number(stmt.invoiceTotal) : undefined,
    unpaidAmount: stmt.unpaidAmount ? Number(stmt.unpaidAmount) : undefined,
    client: stmt.client ? { id: stmt.client.id, name: stmt.client.name } : null
  }));
}

export async function createStatement(payload: StatementCreateRequest): Promise<Statement> {
  const response = await api.post<Statement>('/statements', payload);
  return response.data;
}
