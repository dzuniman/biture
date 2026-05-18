export interface Client {
  id: string;
  name: string;
  accountNumber?: string;
  industry?: string;
  contactName?: string;
  email?: string;
}

export interface Quote {
  id: string;
  clientId?: string;
  reference?: string;
  customerName: string;
  description?: string;
  amount: number;
  status: string;
  createdAt: string;
  dueDate?: string;
  invoiceCount?: number;
  invoiceTotal?: number;
  client?: { id: string; name: string } | null;
}

export interface JobCard {
  id: string;
  client?: { id: string; name: string } | null;
  jobNumber: string;
  description: string;
  status: string;
  createdAt: string;
  startDate?: string;
  endDate?: string;
  totalCost: number;
  costCount?: number;
  costTotal?: number;
}

export interface Cost {
  id: string;
  client?: { id: string; name: string } | null;
  jobCard?: { id: string; jobNumber: string } | null;
  category: string;
  description: string;
  amount: number;
  status: string;
  incurredAt: string;
}

export interface Invoice {
  id: string;
  client?: { id: string; name: string } | null;
  invoiceNumber: string;
  amount: number;
  status: string;
  createdAt: string;
  dueDate: string;
  isOverdue?: boolean;
  quote?: { id: string; reference: string } | null;
}

export interface Statement {
  id: string;
  client?: { id: string; name: string } | null;
  period: string;
  balance: number;
  status: string;
  createdAt: string;
  invoiceTotal?: number;
  unpaidAmount?: number;
}

export interface ClientCreateRequest {
  name: string;
  accountNumber?: string;
  industry?: string;
  contactName?: string;
  email?: string;
}

export interface QuoteCreateRequest {
  clientId?: string;
  reference: string;
  customerName: string;
  description: string;
  amount: number;
  status: string;
  dueDate?: string;
}

export interface JobCardCreateRequest {
  clientId?: string;
  jobNumber: string;
  description: string;
  status: string;
  startDate?: string;
  endDate?: string;
  totalCost: number;
}

export interface CostCreateRequest {
  clientId?: string;
  jobCardId?: string;
  category: string;
  description: string;
  amount: number;
  status: string;
  incurredAt: string;
}

export interface InvoiceCreateRequest {
  clientId?: string;
  invoiceNumber: string;
  description?: string;
  amount: number;
  status: string;
  dueDate?: string;
}

export interface StatementCreateRequest {
  clientId?: string;
  period: string;
  balance: number;
  status: string;
}
