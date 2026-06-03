export interface User {
  id: string;
  username: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface Client {
  id: string;
  name: string;
  vendorNumber?: string;
  addressLine1?: string;
  addressLine2?: string;
  addressLine3?: string;
  addressLine4?: string;
  representativeName?: string;
  representativeNumber?: string;
}

export interface ClientCreateRequest {
  name: string;
  vendorNumber?: string;
  addressLine1?: string;
  addressLine2?: string;
  addressLine3?: string;
  addressLine4?: string;
  representativeName?: string;
  representativeNumber?: string;
}

export interface QuoteItem {
  id: string;
  itemNumber: number;
  quantity: number;
  code?: string;
  uom: string;
  description: string;
  unitPrice: number;
  totalPrice: number;
}

export interface QuoteItemCreateRequest {
  itemNumber: number;
  quantity: number;
  code?: string;
  uom: string;
  description: string;
  unitPrice: number;
  totalPrice: number;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  reference: string;
  date: string;
  validityDays: number;
  vendorNumber: string;
  clientId?: string;
  client?: {
    id: string;
    name: string;
    vendorNumber?: string;
    addressLine1?: string;
    addressLine2?: string;
    addressLine3?: string;
    addressLine4?: string;
    representativeName?: string;
    representativeNumber?: string;
  } | null;
  items: QuoteItem[];
  subTotal: number;
  vat: number;
  total: number;
}

export interface QuoteCreateRequest {
  clientId?: string;
  quoteNumber: string;
  reference: string;
  date: string;
  validityDays: number;
  items: QuoteItemCreateRequest[];
}

export interface QuoteUom {
  id: string;
  value: string;
}

export interface QuoteDescription {
  id: string;
  code: string;
  uom: string;
  description: string;
}

export interface UserCreateRequest {
  username: string;
  password: string;
  role: string;
}

export interface UserUpdateRequest {
  username: string;
  password?: string;
  role: string;
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

export interface InvoiceQuote {
  id: string;
  quoteNumber?: string;
  reference: string;
  date?: string;
  validityDays?: number;
  clientId?: string;
  client?: {
    id: string;
    name: string;
    vendorNumber?: string;
    addressLine1?: string;
    addressLine2?: string;
    addressLine3?: string;
    addressLine4?: string;
    representativeName?: string;
    representativeNumber?: string;
  } | null;
  items?: QuoteItem[];
  subTotal?: number;
  vat?: number;
  total?: number;
}

export interface Invoice {
  id: string;
  client?: { id: string; name: string } | null;
  invoiceNumber: string;
  amount: number;
  status: string;
  createdAt: string;
  dueDate: string;
  description?: string;
  isOverdue?: boolean;
  quote?: InvoiceQuote | null;
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
  quoteId: string;
  invoiceNumber: string;
  description?: string;
  status: string;
  date: string;
}

export interface StatementCreateRequest {
  clientId?: string;
  period: string;
  balance: number;
  status: string;
}
