export interface User {
  id: string;
  username: string;
  role: string;
}

export interface LoginResponse {
  token: string;
  user: User;
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
  vendorNumber?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  addressLine3?: string | null;
  addressLine4?: string | null;
  representativeName?: string | null;
  representativeNumber?: string | null;
  // New properties
  vatNumber?: string | null;
  email?: string | null;
  createdAt?: string;
  updatedAt?: string | null;
}

export interface ClientCreateRequest {
  name: string;
  vendorNumber?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  addressLine3?: string | null;
  addressLine4?: string | null;
  representativeName?: string | null;
  representativeNumber?: string | null;
  // New properties
  vatNumber?: string | null;
  email?: string | null;
}

export interface QuoteItem {
  id: string;
  itemNumber: number;
  quantity: number;
  code?: string | null;
  uom: string;
  description: string;
  unitPrice: number;
  totalPrice: number;
}

export interface QuoteItemCreateRequest {
  itemNumber: number;
  quantity: number;
  code?: string | null;
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
  clientId?: string | null;
  client?: Client | null;
  items: QuoteItem[];
  subTotal: number;
  vat: number;
  total: number;
  poNumber?: string | null;
}

export interface QuoteCreateRequest {
  clientId?: string | null;
  quoteNumber: string;
  reference: string;
  date: string;
  validityDays: number;
  items: QuoteItemCreateRequest[];
  poNumber?: string | null;
}

export interface QuoteUom {
  id: string;
  value: string;
}

export interface QuoteUomCreateRequest {
  value: string;
}

export interface QuoteUomUpdateRequest {
  value: string;
}

export interface QuoteDescription {
  id: string;
  code: string;
  uom: string;
  description: string;
}

export interface QuoteDescriptionCreateRequest {
  code: string;
  uom: string;
  description: string;
}

export interface QuoteDescriptionUpdateRequest {
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
  jobCardNumber: string;
  reference: string;
  quoteNumber: string;
  description: string;
  createdAt: string;
  client?: { id: string; name: string } | null; // From list endpoint
  quote?: {
    id: string;
    quoteNumber: string;
    reference: string;
    date?: string;
    validityDays?: number;
    subTotal?: number;
    vat?: number;
    total?: number;
    client?: Client | null;
    poNumber?: string;
    items?: QuoteItem[];
  } | null; // From detail endpoint
}

export interface Cost {
  id: string;
  client?: Client | null;
  jobCard?: { id: string; jobCardNumber: string } | null;
  category: string;
  description: string;
  amount: number;
  status: string;
  incurredAt: string;
}

export interface InvoiceQuote {
  id: string;
  quoteNumber?: string | null;
  reference: string;
  date?: string;
  validityDays?: number;
  clientId?: string | null;
  client?: Client | null;
  items?: QuoteItem[];
  subTotal?: number;
  vat?: number;
  total?: number;
  poNumber?: string | null;
}

export interface Invoice {
  id: string;
  clientId?: string | null;
  client?: Client | null;
  quoteId?: string | null;
  invoiceNumber: string;
  amount: number;
  status: string;
  createdAt: string;
  dueDate: string;
  description?: string | null;
  isOverdue?: boolean;
  quote?: InvoiceQuote | null;
}

export interface StatementItem {
  id: string;
  invoiceId: string;
  paymentAmount: number;
  description: string;
  paymentDate: string;
}

export interface Statement {
  id: string;
  statementNumber: string;
  client?: Client | null;
  createdAt: string; 
  items: StatementItem[];
}

export interface JobCardCreateRequest {
  jobCardNumber?: string;
  quoteNumber: string;
  reference: string;
  description: string;
}

export interface CostCreateRequest {
  clientId?: string | null;
  jobCardId?: string | null;
  category: string;
  description: string;
  amount: number;
  status: string;
  incurredAt: string;
}

export interface InvoiceCreateRequest {
  quoteId: string; // Assuming this is mandatory for creating an invoice from a quote
  clientId?: string | null;
  invoiceNumber: string;
  description?: string | null;
  status: string;
  dueDate: string; // Add dueDate if it's part of the create request
  amount?: number; // Add amount if it's part of the create request
}

export interface StatementItemCreateRequest {
  invoiceId: string;
  paymentAmount: number;
  description: string;
  paymentDate: string;
}

export interface StatementCreateRequest {
  clientId?: string | null;
  statementNumber: string;
  items: StatementItemCreateRequest[];
}

export interface DocumentResponse {
  id: string;
  documentName: string;
  description?: string;
  fileName: string;
  contentType: string;
  uploadedAt: string;
}
