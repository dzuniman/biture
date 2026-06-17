import axios from 'axios';
import type {
  Client,
  ClientCreateRequest,
  Invoice,
  InvoiceCreateRequest,
  Quote,
  QuoteCreateRequest,
  QuoteDescription,
  User,
  UserCreateRequest,
  UserUpdateRequest,
  LoginRequest,
  LoginResponse,
  QuoteDescriptionCreateRequest,
  QuoteDescriptionUpdateRequest,
  Statement,
  StatementCreateRequest,
  QuoteUom,
  QuoteUomCreateRequest,
  QuoteUomUpdateRequest,
  JobCard,
  JobCardCreateRequest,
  Cost,
  CostCreateRequest,
  DocumentResponse
} from './types';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:5227';

const getToken = () => localStorage.getItem('token');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth
export const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
  const response = await axios.post(`${API_BASE_URL}/auth/login`, credentials);
  return response.data;
};

export const logout = () => {
  // In a real app, you might invalidate the token on the server
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// Clients
export const getClients = async (): Promise<Client[]> => {
  const response = await api.get('/clients');
  return response.data;
};

export const getClient = async (id: string): Promise<Client> => {
  const response = await api.get(`/clients/${id}`);
  return response.data;
};

export const createClient = async (client: ClientCreateRequest): Promise<Client> => {
  const response = await api.post('/clients', client);
  return response.data;
};

export const updateClient = async (id: string, client: ClientCreateRequest): Promise<Client> => {
  const response = await api.put(`/clients/${id}`, client);
  return response.data;
};

export const deleteClient = async (id: string): Promise<void> => {
  await api.delete(`/clients/${id}`);
};

// Quotes
export const getQuotes = async (): Promise<Quote[]> => {
  const response = await api.get('/quotes');
  return response.data;
};

export const getQuote = async (id: string): Promise<Quote> => {
  const response = await api.get(`/quotes/${id}`);
  return response.data;
};

export const createQuote = async (quote: QuoteCreateRequest): Promise<Quote> => {
  const response = await api.post('/quotes', quote);
  return response.data;
};

export const updateQuote = async (id: string, quote: QuoteCreateRequest): Promise<Quote> => {
  const response = await api.put(`/quotes/${id}`, quote);
  return response.data;
};

export const deleteQuote = async (id: string): Promise<void> => {
  await api.delete(`/quotes/${id}`);
};

export const getQuoteNextNumber = async (): Promise<string> => {
  const response = await api.get('/quotes/nextNumber');
  return response.data;
};

// Invoices
export const getInvoices = async (): Promise<Invoice[]> => {
  const response = await api.get('/invoices');
  return response.data;
};

export const getInvoice = async (id: string): Promise<Invoice> => {
  const response = await api.get(`/invoices/${id}`);
  return response.data;
};

export const createInvoice = async (invoice: InvoiceCreateRequest): Promise<Invoice> => {
  const response = await api.post('/invoices', invoice);
  return response.data;
};

export const updateInvoice = async (id: string, invoice: InvoiceCreateRequest): Promise<Invoice> => {
  const response = await api.put(`/invoices/${id}`, invoice);
  return response.data;
};

export const deleteInvoice = async (id: string): Promise<void> => {
  await api.delete(`/invoices/${id}`);
};

export const getInvoiceNextNumber = async (prefix: string): Promise<string> => {
  const response = await api.get(`/invoices/nextNumber?prefix=${prefix}`);
  return response.data;
};

// Quote Descriptions
export const getQuoteDescriptions = async (): Promise<QuoteDescription[]> => {
  const response = await api.get('/quotedescriptions');
  return response.data;
};

export const createQuoteDescription = async (description: QuoteDescriptionCreateRequest): Promise<QuoteDescription> => {
  const response = await api.post('/quotedescriptions', description);
  return response.data;
};

export const updateQuoteDescription = async (id: string, description: QuoteDescriptionUpdateRequest): Promise<QuoteDescription> => {
  const response = await api.put(`/quotedescriptions/${id}`, description);
  return response.data;
};

export const deleteQuoteDescription = async (id: string): Promise<void> => {
  await api.delete(`/quotedescriptions/${id}`);
};

// Quote UoMs
export const getQuoteUoms = async (): Promise<QuoteUom[]> => {
  const response = await api.get('/quoteuoms');
  return response.data;
};

export const createQuoteUom = async (uom: QuoteUomCreateRequest): Promise<QuoteUom> => {
  const response = await api.post('/quoteuoms', uom);
  return response.data;
};

export const updateQuoteUom = async (id: string, uom: QuoteUomUpdateRequest): Promise<QuoteUom> => {
  const response = await api.put(`/quoteuoms/${id}`, uom);
  return response.data;
};

export const deleteQuoteUom = async (id: string): Promise<void> => {
  await api.delete(`/quoteuoms/${id}`);
};

// Users
export const getUsers = async (): Promise<User[]> => {
  const response = await api.get('/users');
  return response.data;
};

export const createUser = async (user: UserCreateRequest): Promise<User> => {
  const response = await api.post('/users', user);
  return response.data;
};

export const updateUser = async (id: string, user: UserUpdateRequest): Promise<User> => {
  const response = await api.put(`/users/${id}`, user);
  return response.data;
};

export const deleteUser = async (id: string): Promise<void> => {
  await api.delete(`/users/${id}`);
};

// Documents
// Add these to c:\Staff\Documents\Other\Vutivi\Quote2Cash\Code\Quote2Cash\quote2cash-web\src\api.ts

export const getDocuments = async () => {
  const response = await api.get<DocumentResponse[]>('/documents');
  return response.data;
};

export const deleteDocument = async (id: string) => {
  await api.delete(`/documents/${id}`);
};

export const downloadDocument = async (id: string) => {
  const response = await api.get(`/documents/${id}/download`, { responseType: 'blob' });
  return response.data;
};

export const createDocument = async (formData: FormData) => {
  const response = await api.post<DocumentResponse>('/documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const updateDocument = async (id: string, payload: { documentName: string; description?: string }) => {
  await api.put(`/documents/${id}`, payload);
};

// Statements
export const getStatementNextNumber = async (): Promise<string> => {
  const response = await api.get('/statements/nextNumber');
  return response.data;
};

export const getStatement = async (id: string): Promise<Statement> => {
  const response = await api.get(`/statements/${id}`);
  return response.data;
};

export const createStatement = async (statement: StatementCreateRequest): Promise<Statement> => {
  const response = await api.post('/statements', statement);
  return response.data;
};

export const updateStatement = async (id: string, statement: StatementCreateRequest): Promise<void> => {
  await api.put(`/statements/${id}`, statement);
};

export const deleteStatement = async (id: string): Promise<void> => {
  await api.delete(`/statements/${id}`);
};

// Job Cards
export const getJobCards = async (): Promise<JobCard[]> => {
  const response = await api.get('/jobcards');
  return response.data;
};

export const getJobCard = async (id: string): Promise<JobCard> => {
  const response = await api.get(`/jobcards/${id}`);
  return response.data;
};

export const createJobCard = async (jobCard: JobCardCreateRequest): Promise<JobCard> => {
  const response = await api.post('/jobcards', jobCard);
  return response.data;
};

export const updateJobCard = async (id: string, jobCard: JobCardCreateRequest): Promise<JobCard> => {
  const response = await api.put(`/jobcards/${id}`, jobCard);
  return response.data;
};

export const deleteJobCard = async (id: string): Promise<void> => {
  await api.delete(`/jobcards/${id}`);
};

// Costs
export const getCosts = async (): Promise<Cost[]> => {
  const response = await api.get('/costs');
  return response.data;
};

export const getCost = async (id: string): Promise<Cost> => {
  const response = await api.get(`/costs/${id}`);
  return response.data;
};

export const createCost = async (cost: CostCreateRequest): Promise<Cost> => {
  const response = await api.post('/costs', cost);
  return response.data;
};

export const updateCost = async (id: string, cost: CostCreateRequest): Promise<Cost> => {
  const response = await api.put(`/costs/${id}`, cost);
  return response.data;
};

export const deleteCost = async (id: string): Promise<void> => {
  await api.delete(`/costs/${id}`);
};
