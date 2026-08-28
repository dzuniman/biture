import { useEffect, useRef, useState } from 'react';
import { formatAmount } from '../formatters';
import {
  createClient,
  createInvoice,
  createQuote,
  deleteClient,
  deleteInvoice,
  deleteQuote,
  deleteStatement,
  getClients,
  getInvoice,
  getInvoiceNextNumber,
  getInvoices,
  getDocuments,
  getQuote,
  getProducts,
  getQuoteNextNumber,
  getQuotes,
  getStatements,
  getUsers,
  updateClient,
  updateInvoice,
  updateQuote,
  getJobCards,
  getJobCard,
  createJobCard,
  updateJobCard,
  deleteJobCard,
  getDeliveryNotes,
  getDeliveryNote,
  createDeliveryNote,
  updateDeliveryNote,
  deleteDeliveryNote,
  getCreditNotes,
  getCreditNote,
  createCreditNote,
  updateCreditNote,
  deleteCreditNote,
  getCosts,
  getCost,
  createCost,
  updateCost,
  deleteCost,
  duplicateCost,
  getTools
} from './api';
import type {
  Client,
  ClientCreateRequest,
  Invoice,
  InvoiceCreateRequest,
  Quote,
  QuoteCreateRequest,
  Product,
  User,
  Statement,
  DocumentResponse,
  JobCard,
  JobCardCreateRequest,
  DeliveryNote,
  DeliveryNoteCreateRequest,
  CreditNote,
  CreditNoteCreateRequest,
  Cost,
  CostCreateRequest,
  Tool
} from './types';
import { useAuth } from './AuthContext';
import { Login } from './components/Login';
import ClientsListPage from './components/ClientsListPage';
import ClientManagementPage from './components/ClientManagementPage';
import ClientViewPage from './components/ClientViewPage';
import InvoiceForm from './components/InvoiceForm';
import DocumentManagementPage from './components/DocumentManagementPage';
import InvoiceListPage from './components/InvoiceListPage';
import InvoiceViewPage from './components/InvoiceViewPage';
import QuotesListPage from './components/QuotesListPage';
import QuoteManagementPage from './components/QuoteManagementPage';
import QuoteViewPage from './components/QuoteViewPage';
import AdminHomePage from './components/AdminHomePage';
import ProductManagementPage from './components/ProductManagementPage';
import ProductViewPage from './components/ProductViewPage';
import UserManagementPage from './components/UserManagementPage';
import ToolManagementPage from './components/ToolManagementPage';
import ToolViewPage from './components/ToolViewPage';
import { Statements } from './components/Statements';
import JobCardListPage from './components/JobCardListPage';
import JobCardForm from './components/JobCardForm';
import JobCardViewPage from './components/JobCardViewPage';
import DeliveryNoteListPage from './components/DeliveryNoteListPage';
import DeliveryNoteForm from './components/DeliveryNoteForm';
import DeliveryNoteViewPage from './components/DeliveryNoteViewPage';
import CreditNoteListPage from './components/CreditNoteListPage';
import CreditNoteForm from './components/CreditNoteForm';
import CreditNoteViewPage from './components/CreditNoteViewPage';
import CostsListPage from './components/CostsListPage';
import CostForm from './components/CostForm';
import ReportsPage from './components/ReportsPage';
import DashboardPage from './components/DashboardPage';
import logo from './assets/logo.png';


type Section = 'dashboard' | 'clients' | 'quotes' | 'invoices' | 'admin' | 'statements' | 'jobcards' | 'deliverynotes' | 'creditnotes' | 'costs' | 'reports';
type ClientView = 'list' | 'manage' | 'view';
type QuoteView = 'list' | 'manage' | 'view';
type InvoiceView = 'list' | 'manage' | 'view';
type StatementView = 'list' | 'manage' | 'view';
type JobCardView = 'list' | 'manage' | 'view';
type DeliveryNoteView = 'list' | 'manage' | 'view';
type CreditNoteView = 'list' | 'manage' | 'view';
type AdminView = 'home' | 'products' | 'users' | 'documents' | 'tools';
type ProductView = 'list' | 'view';

function App() {
  const [section, setSection] = useState<Section>('dashboard');
  const [clientView, setClientView] = useState<ClientView>('list');
  const [quoteView, setQuoteView] = useState<QuoteView>('list');
  const [invoiceView, setInvoiceView] = useState<InvoiceView>('list');
  const [statementView, setStatementView] = useState<StatementView>('list');
  const [jobCardView, setJobCardView] = useState<JobCardView>('list');
  const [deliveryNoteView, setDeliveryNoteView] = useState<DeliveryNoteView>('list');
  const [creditNoteView, setCreditNoteView] = useState<CreditNoteView>('list');
  const [clients, setClients] = useState<Client[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [statements, setStatements] = useState<Statement[]>([]);
  const [jobCards, setJobCards] = useState<JobCard[]>([]);
  const [deliveryNotes, setDeliveryNotes] = useState<DeliveryNote[]>([]);
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);
  const [costs, setCosts] = useState<Cost[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [editingCost, setEditingCost] = useState<Cost | null>(null);
  const [costView, setCostView] = useState<'list' | 'manage'>('list');
  const [toolView, setToolView] = useState<'list' | 'view'>('list');
  const [productView, setProductView] = useState<ProductView>('list');
  const [documents, setDocuments] = useState<DocumentResponse[]>([]);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [editingJobCard, setEditingJobCard] = useState<JobCard | null>(null);
  const [editingDeliveryNote, setEditingDeliveryNote] = useState<DeliveryNote | null>(null);
  const [editingCreditNote, setEditingCreditNote] = useState<CreditNote | null>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [viewingQuote, setViewingQuote] = useState<Quote | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [viewingStatement, setViewingStatement] = useState<Statement | null>(null);
  const [viewingJobCard, setViewingJobCard] = useState<JobCard | null>(null);
  const [viewingDeliveryNote, setViewingDeliveryNote] = useState<DeliveryNote | null>(null);
  const [viewingCreditNote, setViewingCreditNote] = useState<CreditNote | null>(null);

  const [viewingProduct, setViewingProduct] = useState<Product & { imagePreviewUrl?: string } | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [adminView, setAdminView] = useState<AdminView>('home');
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const quickActionsRef = useRef<HTMLDivElement | null>(null);
  const [businessOpen, setBusinessOpen] = useState(false);
  const businessRef = useRef<HTMLDivElement | null>(null);
  const [managementOpen, setManagementOpen] = useState(false);
  const managementRef = useRef<HTMLDivElement | null>(null);
  const [adminDropOpen, setAdminDropOpen] = useState(false);
  const adminDropRef = useRef<HTMLDivElement | null>(null);
  const [viewingTool, setViewingTool] = useState<{ id: string; code: string; description: string; quantity: number; location?: string | null; imagePath?: string | null; value: number; inspectionDate?: string | null; imagePreviewUrl?: string } | null>(null);
  const [isDuplicatingClient, setIsDuplicatingClient] = useState(false);
  const [isDuplicatingQuote, setIsDuplicatingQuote] = useState(false);
  const [quoteClientId, setQuoteClientId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, user, logout } = useAuth();

  const getErrorMessage = (err: any, fallback: string) => {
    console.error('API Error details:', err);
    if (err.message === 'Network Error' || !err.response) {
      return 'API Error: Connection failed. This is often caused by a 500 error on the backend masking itself as a CORS issue. Please check your backend logs on Render.';
    }
    const data = err.response.data;
    if (typeof data === 'string' && (data.includes('<!DOCTYPE html>') || data.includes('<html'))) {
      return 'Internal Server Error (500). Check the API console for the stack trace.';
    }
    const detail = data?.detail || data?.message || data?.title;
    const validationErrors = data?.errors ? Object.values(data.errors).flat().join(' ') : null;
    return validationErrors || detail || fallback;
  };

  const loadAll = async () => {
    try {
      setError(null);
      setIsLoading(true);
      const [clientsData, quotesData, productsData, usersData, invoicesData, statementsData, documentsData, jobCardsData, deliveryNotesData, creditNotesData, costsData, toolsData] = await Promise.all([
        getClients(),
        getQuotes(),
        getProducts(),
        getUsers(),
        getInvoices(),
        getStatements(),
        getDocuments(),
        getJobCards(),
        getDeliveryNotes(),
        getCreditNotes(),
        getCosts(),
        getTools()
      ]);
      setClients(clientsData);
      setQuotes(quotesData);
      setProducts(productsData);
      setUsers(usersData);
      setInvoices(invoicesData);
      setStatements(statementsData);
      setDocuments(documentsData);
      setJobCards(jobCardsData);
      setDeliveryNotes(deliveryNotesData);
      setCreditNotes(creditNotesData);
      setCosts(costsData);
      setTools(toolsData);
    } catch (err: any) {
      setError(getErrorMessage(err, 'Unable to load data. Confirm the API is running.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    loadAll();
  }, [isAuthenticated]);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (quickActionsRef.current && !quickActionsRef.current.contains(event.target as Node)) {
        setQuickActionsOpen(false);
      }
      if (businessRef.current && !businessRef.current.contains(event.target as Node)) {
        setBusinessOpen(false);
      }
      if (managementRef.current && !managementRef.current.contains(event.target as Node)) {
        setManagementOpen(false);
      }
      if (adminDropRef.current && !adminDropRef.current.contains(event.target as Node)) {
        setAdminDropOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleCreateClient = async (payload: ClientCreateRequest) => {
    try {
      setError(null);
      setIsLoading(true);
      await createClient(payload);
      clearClientState();
      await loadAll();
      setSection('clients');
      setClientView('list');
    } catch (err: any) {
      setError(getErrorMessage(err, 'Unable to save client.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateClient = async (id: string, payload: ClientCreateRequest) => {
    try {
      setError(null);
      setIsLoading(true);
      await updateClient(id, payload);
      clearClientState();
      await loadAll();
      setClientView('list');
    } catch (err: any) {
      setError(getErrorMessage(err, 'Unable to update client.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      try {
        setError(null);
        setIsLoading(true);
        await deleteClient(id);
        await loadAll();
      } catch (err: any) {
        setError(getErrorMessage(err, 'Unable to delete client.'));
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleCreateQuote = async (payload: QuoteCreateRequest) => {
    try {
      setError(null);
      setIsLoading(true);
      await createQuote(payload);
      clearQuoteState();
      await loadAll();
      setSection('quotes');
      setQuoteView('list');
    } catch (err: any) {
      setError(getErrorMessage(err, 'Unable to save quote.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateQuote = async (id: string, payload: QuoteCreateRequest) => {
    try {
      setError(null);
      setIsLoading(true);
      await updateQuote(id, payload);
      clearQuoteState();
      await loadAll();
      setQuoteView('list');
    } catch (err: any) {
      setError(getErrorMessage(err, 'Unable to update quote.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteQuote = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this quote?')) {
      try {
        setError(null);
        setIsLoading(true);
        await deleteQuote(id);
        await loadAll();
      } catch (err: any) {
        setError(getErrorMessage(err, 'Unable to delete quote.'));
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleCreateInvoice = async (payload: InvoiceCreateRequest) => {
    try {
      setError(null);
      setIsLoading(true);
      await createInvoice(payload);
      clearInvoiceState();
      await loadAll();
      setSection('invoices');
      setInvoiceView('list');
    } catch (err: any) {
      setError(getErrorMessage(err, 'Unable to save invoice.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateInvoice = async (id: string, payload: InvoiceCreateRequest) => {
    try {
      setError(null);
      setIsLoading(true);
      await updateInvoice(id, payload);
      clearInvoiceState();
      await loadAll();
      setInvoiceView('list');
    } catch (err: any) {
      setError(getErrorMessage(err, 'Unable to update invoice.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        setError(null);
        setIsLoading(true);
        await deleteInvoice(id);
        await loadAll();
      } catch (err: any) {
        setError(getErrorMessage(err, 'Unable to delete invoice.'));
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleDeleteStatement = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this statement?')) {
      try {
        setError(null);
        setIsLoading(true);
        await deleteStatement(id);
        await loadAll();
      } catch (err: any) {
        setError(getErrorMessage(err, 'Unable to delete statement.'));
      } finally {
        setIsLoading(false);
      }
    }
  };

  const resolveInvoiceRelationships = (invoice: Invoice) => {
    const resolved = { ...invoice } as any;

    // Reconstruct quote relationship - Don't overwrite if current quote already has items
    const invoiceQuoteId = resolved.quoteId || (typeof resolved.quote === 'string' ? resolved.quote : resolved.quote?.id);

    if (invoiceQuoteId) {
      const quoteFromState = quotes.find(q => q.id === invoiceQuoteId);
      const currentHasItems = resolved.quote && typeof resolved.quote !== 'string' && resolved.quote.items && resolved.quote.items.length > 0;

      if (!currentHasItems && quoteFromState) {
        resolved.quote = { ...quoteFromState };
      } else if (!resolved.quote || typeof resolved.quote === 'string') {
        resolved.quote = { id: invoiceQuoteId } as Quote; // Object wrapper for fallback logic
      }
    }

    // Reconstruct client relationship - Priority on maintaining address data
    const invoiceClientId = resolved.clientId || resolved.ClientId || (typeof resolved.client === 'string' ? resolved.client : resolved.client?.id);
    const quoteClientId = resolved.quote?.clientId || resolved.quote?.client?.id;
    const finalClientId = invoiceClientId || quoteClientId;

    if (finalClientId) {
      const stateClient = clients.find(c => c.id === finalClientId);
      const currentClientIsDeep = resolved.client && typeof resolved.client !== 'string' && resolved.client.addressLine1;

      if (!currentClientIsDeep && stateClient) {
        resolved.client = { ...stateClient };
      } else if (!resolved.client || typeof resolved.client === 'string') {
        resolved.client = { id: finalClientId } as Client;
      }

      // Sync quote's client as well
      if (resolved.quote) {
        const quoteClientIsDeep = resolved.quote.client && typeof resolved.quote.client !== 'string' && resolved.quote.client.addressLine1;
        if (!quoteClientIsDeep && stateClient) {
          resolved.quote.client = { ...stateClient };
        } else if (!resolved.quote.client || typeof resolved.quote.client === 'string') {
          resolved.quote.client = { id: finalClientId } as Client;
        }
      }
    }

    return resolved;
  };

  const handleEditInvoice = async (invoice: Invoice) => {
    try {
      setIsLoading(true);
      if (!invoice || !invoice.id) {
        setError('Cannot edit invoice: Invoice data or ID is missing.');
        return;
      }
      try {
        const apiInvoice = await getInvoice(invoice.id);
        let resolvedInvoice = apiInvoice || { ...invoice };

        // First pass resolution
        resolvedInvoice = resolveInvoiceRelationships(resolvedInvoice);

        // Enhanced Fallback: Fetch full quote details if items are missing for editing
        const qId = resolvedInvoice.quote?.id;
        if (qId && (!resolvedInvoice.quote?.items || resolvedInvoice.quote.items.length === 0)) {
          try {
            const fullQuote = await getQuote(qId);
            resolvedInvoice.quote = {
              ...resolvedInvoice.quote,
              ...(fullQuote || {}),
              items: fullQuote?.items || [],
              client: resolvedInvoice.quote?.client || fullQuote.client
            };
            // Second pass resolution to link new quote's client details
            resolvedInvoice = resolveInvoiceRelationships(resolvedInvoice);
          } catch (qErr) {
            console.warn('Fallback quote fetch failed for invoice view:', qErr);
          }
        }
        setEditingInvoice(resolvedInvoice);
      } catch (err) {
        console.warn('Failed to fetch full invoice details, falling back to summary data:', err);
        setEditingInvoice(invoice);
      }
      setViewingInvoice(null);
      setInvoiceView('manage');
      setSection('invoices');
    } catch (err: any) {
      setError(getErrorMessage(err, 'Unable to load invoice for editing.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewInvoice = async (invoice: Invoice) => {
    try {
      setIsLoading(true);
      if (!invoice || !invoice.id) {
        setError('Cannot view invoice: Invoice data or ID is missing.');
        return;
      }
      try {
        const apiInvoice = await getInvoice(invoice.id); // Refresh from DB
        let resolvedInvoice = apiInvoice || { ...invoice };

        // First pass resolution
        resolvedInvoice = resolveInvoiceRelationships(resolvedInvoice);

        // Enhanced Fallback: If quote items are missing or the quote itself isn't resolved locally
        const qId = resolvedInvoice.quote?.id || resolvedInvoice.quoteId;
        if (qId && (!resolvedInvoice.quote?.items || resolvedInvoice.quote?.items?.length === 0)) {
          try {
            const fullQuote = await getQuote(qId);
            if (fullQuote) {
              resolvedInvoice.quote = {
                ...(resolvedInvoice.quote || {}),
                ...(fullQuote || {}),
                items: fullQuote?.items || [],
                client: resolvedInvoice.quote?.client || fullQuote.client || resolvedInvoice.client
              };
            }
            // Second pass resolution to link new quote's client details
            resolvedInvoice = resolveInvoiceRelationships(resolvedInvoice);
          } catch (qErr) {
            console.warn('Fallback quote fetch failed for invoice view:', qErr);
          }
        }
        setViewingInvoice(resolvedInvoice);
      } catch (err) {
        console.warn('Failed to fetch full invoice details, falling back to summary data:', err);
        setViewingInvoice(invoice);
      }
      setInvoiceView('view');
      setSection('invoices');
    } catch (err: any) {
      setError(getErrorMessage(err, 'Unable to load invoice.'));
    } finally {
      setIsLoading(false);
    }
  };

  const clearInvoiceState = () => {
    setEditingInvoice(null);
    setViewingInvoice(null);
    setInvoiceView('list');
  };

  const clearStatementState = () => {
    setStatementView('list');
  };

  const clearJobCardState = () => {
    setEditingJobCard(null);
    setViewingJobCard(null);
    setJobCardView('list');
  };

  const clearDeliveryNoteState = () => {
    setEditingDeliveryNote(null);
    setViewingDeliveryNote(null);
    setDeliveryNoteView('list');
  };

  const clearCreditNoteState = () => {
    setEditingCreditNote(null);
    setViewingCreditNote(null);
    setCreditNoteView('list');
  };

  const clearClientState = () => {
    setEditingClient(null);
    setViewingClient(null);
    setIsDuplicatingClient(false);
  };

  const clearQuoteState = () => {
    setEditingQuote(null);
    setViewingQuote(null);
    setIsDuplicatingQuote(false);
    setQuoteClientId('');
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setIsDuplicatingClient(false);
    setClientView('manage');
  };

  const handleViewClient = (client: Client) => {
    setViewingClient(client);
    setClientView('view');
  };

  const handleDuplicateClient = async (client: Client) => {
    try {
      setEditingClient(client);
      setIsDuplicatingClient(true);
      setClientView('manage');
    } catch (err: any) {
      setError(getErrorMessage(err, 'Unable to load client for duplication.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditQuote = async (quote: Quote) => {
    try {
      setIsLoading(true);
      const fullQuote = await getQuote(quote.id);
      setEditingQuote(fullQuote);
      setIsDuplicatingQuote(false);
      setQuoteClientId(fullQuote.clientId ?? '');
      setQuoteView('manage');
    } catch (err: any) {
      setError(getErrorMessage(err, 'Unable to load quote for editing.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewQuote = async (quote: Quote) => {
    try {
      setIsLoading(true);
      const fullQuote = await getQuote(quote.id);
      setViewingQuote(fullQuote);
      setQuoteView('view');
      setSection('quotes');
    } catch (err: any) {
      setError(getErrorMessage(err, 'Unable to load quote.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDuplicateQuote = async (quote: Quote) => {
    try {
      setIsLoading(true);
      const fullQuote = await getQuote(quote.id);
      setEditingQuote(fullQuote);
      setIsDuplicatingQuote(true);
      setQuoteClientId(fullQuote.clientId ?? '');
      setQuoteView('manage');
    } catch (err: any) {
      setError(getErrorMessage(err, 'Unable to load quote for duplication.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewStatement = async (statement: Statement) => {
    try {
      setIsLoading(true);
      setViewingStatement(statement);
      setStatementView('view');
      setSection('statements');
    } catch (err: any) {
      setError(getErrorMessage(err, 'Unable to load statement.'));
    } finally {
      setIsLoading(false);
    }
  };

  // --- Job Card Handlers ---
  const handleCreateJobCard = async (payload: JobCardCreateRequest) => {
    try {
      setError(null);
      setIsLoading(true);
      await createJobCard(payload);
      clearJobCardState();
      await loadAll();
      setSection('jobcards');
      setJobCardView('list');
    } catch (err: any) {
      setError(getErrorMessage(err, 'Unable to save job card.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateJobCard = async (id: string, payload: JobCardCreateRequest) => {
    try {
      setError(null);
      setIsLoading(true);
      await updateJobCard(id, payload);
      clearJobCardState();
      await loadAll();
      setJobCardView('list');
    } catch (err: any) {
      setError(getErrorMessage(err, 'Unable to update job card.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteJobCard = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this job card?')) {
      try {
        setError(null);
        setIsLoading(true);
        await deleteJobCard(id);
        await loadAll();
      } catch (err: any) {
        setError(getErrorMessage(err, 'Unable to delete job card.'));
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleEditJobCard = async (jobCard: JobCard) => {
    try {
      setIsLoading(true);
      const fullJobCard = await getJobCard(jobCard.id);
      setEditingJobCard(fullJobCard);
      setJobCardView('manage');
      setSection('jobcards');
    } catch (err: any) {
      setError(getErrorMessage(err, 'Unable to load job card for editing.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewJobCard = async (jobCard: JobCard) => {
    try {
      setIsLoading(true);
      const fullJobCard = await getJobCard(jobCard.id);
      setViewingJobCard(fullJobCard);
      setJobCardView('view');
      setSection('jobcards');
    } catch (err: any) {
      setError(getErrorMessage(err, 'Unable to load job card.'));
    } finally {
      setIsLoading(false);
    }
  };

  // --- Delivery Note Handlers ---
  const handleCreateDeliveryNote = async (payload: DeliveryNoteCreateRequest) => {
    try {
      setError(null); setIsLoading(true);
      await createDeliveryNote(payload);
      clearDeliveryNoteState();
      await loadAll();
      setSection('deliverynotes'); setDeliveryNoteView('list');
    } catch (err: any) { setError(getErrorMessage(err, 'Unable to save delivery note.')); }
    finally { setIsLoading(false); }
  };

  const handleUpdateDeliveryNote = async (id: string, payload: DeliveryNoteCreateRequest) => {
    try {
      setError(null); setIsLoading(true);
      await updateDeliveryNote(id, payload);
      clearDeliveryNoteState();
      await loadAll();
      setDeliveryNoteView('list');
    } catch (err: any) { setError(getErrorMessage(err, 'Unable to update delivery note.')); }
    finally { setIsLoading(false); }
  };

  const handleDeleteDeliveryNote = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this delivery note?')) {
      try {
        setError(null); setIsLoading(true);
        await deleteDeliveryNote(id);
        await loadAll();
      } catch (err: any) { setError(getErrorMessage(err, 'Unable to delete delivery note.')); }
      finally { setIsLoading(false); }
    }
  };

  const handleEditDeliveryNote = async (dn: DeliveryNote) => {
    try {
      setIsLoading(true);
      const full = await getDeliveryNote(dn.id);
      setEditingDeliveryNote(full);
      setDeliveryNoteView('manage');
      setSection('deliverynotes');
    } catch (err: any) { setError(getErrorMessage(err, 'Unable to load delivery note for editing.')); }
    finally { setIsLoading(false); }
  };

  const handleViewDeliveryNote = async (dn: DeliveryNote) => {
    try {
      setIsLoading(true);
      const full = await getDeliveryNote(dn.id);
      setViewingDeliveryNote(full);
      setDeliveryNoteView('view');
      setSection('deliverynotes');
    } catch (err: any) { setError(getErrorMessage(err, 'Unable to load delivery note.')); }
    finally { setIsLoading(false); }
  };

  // --- Credit Note Handlers ---
  const handleCreateCreditNote = async (payload: CreditNoteCreateRequest) => {
    try {
      setError(null); setIsLoading(true);
      await createCreditNote(payload);
      clearCreditNoteState();
      await loadAll();
      setSection('creditnotes'); setCreditNoteView('list');
    } catch (err: any) { setError(getErrorMessage(err, 'Unable to save credit note.')); }
    finally { setIsLoading(false); }
  };

  const handleUpdateCreditNote = async (id: string, payload: CreditNoteCreateRequest) => {
    try {
      setError(null); setIsLoading(true);
      await updateCreditNote(id, payload);
      clearCreditNoteState();
      await loadAll();
      setCreditNoteView('list');
    } catch (err: any) { setError(getErrorMessage(err, 'Unable to update credit note.')); }
    finally { setIsLoading(false); }
  };

  const handleDeleteCreditNote = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this credit note?')) {
      try {
        setError(null); setIsLoading(true);
        await deleteCreditNote(id);
        await loadAll();
      } catch (err: any) { setError(getErrorMessage(err, 'Unable to delete credit note.')); }
      finally { setIsLoading(false); }
    }
  };

  const handleEditCreditNote = async (cn: CreditNote) => {
    try {
      setIsLoading(true);
      const full = await getCreditNote(cn.id);
      setEditingCreditNote(full);
      setCreditNoteView('manage');
      setSection('creditnotes');
    } catch (err: any) { setError(getErrorMessage(err, 'Unable to load credit note for editing.')); }
    finally { setIsLoading(false); }
  };

  const handleViewCreditNote = async (cn: CreditNote) => {
    try {
      setIsLoading(true);
      const full = await getCreditNote(cn.id);
      setViewingCreditNote(full);
      setCreditNoteView('view');
      setSection('creditnotes');
    } catch (err: any) { setError(getErrorMessage(err, 'Unable to load credit note.')); }
    finally { setIsLoading(false); }
  };

  // --- Cost Handlers ---
  const handleCreateCost = async (payload: CostCreateRequest) => {
    try {
      setError(null);
      setIsLoading(true);
      await createCost(payload);
      clearCostState();
      await loadAll();
      setSection('costs');
      setCostView('list');
    } catch (err: any) {
      setError(getErrorMessage(err, 'Unable to save cost.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateCost = async (id: string, payload: CostCreateRequest) => {
    try {
      setError(null);
      setIsLoading(true);
      await updateCost(id, payload);
      clearCostState();
      await loadAll();
      setCostView('list');
    } catch (err: any) {
      setError(getErrorMessage(err, 'Unable to update cost.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCost = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this cost sheet?')) {
      try {
        setError(null);
        setIsLoading(true);
        await deleteCost(id);
        await loadAll();
      } catch (err: any) {
        setError(getErrorMessage(err, 'Unable to delete cost.'));
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleEditCost = async (cost: Cost) => {
    try {
      setIsLoading(true);
      const fullCost = await getCost(cost.id);
      setEditingCost(fullCost);
      setCostView('manage');
      setSection('costs');
    } catch (err: any) {
      setError(getErrorMessage(err, 'Unable to load cost for editing.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDuplicateCost = async (cost: Cost) => {
    try {
      setError(null);
      setIsLoading(true);
      await duplicateCost(cost.id);
      await loadAll();
      setSection('costs');
      setCostView('list');
    } catch (err: any) {
      setError(getErrorMessage(err, 'Unable to duplicate cost.'));
    } finally {
      setIsLoading(false);
    }
  };

  const clearCostState = () => {
    setEditingCost(null);
    setCostView('list');
  };

  // --- Product Handlers ---
  const handleViewProduct = async (product: any) => {
    try {
      setIsLoading(true);
      let imagePreviewUrl: string | undefined;
      if (product.imagePath) {
        const token = localStorage.getItem('token');
        const url = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:12345'}/api/products/images/${product.imagePath}`;
        try {
          const res = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const blob = await res.blob();
            imagePreviewUrl = URL.createObjectURL(blob);
          }
        } catch (err) {
          console.error('Failed to load product image', err);
        }
      }
      setViewingProduct({ ...product, imagePreviewUrl });
      setProductView('view');
    } catch (err: any) {
      setError(getErrorMessage(err, 'Unable to load product.'));
    } finally {
      setIsLoading(false);
    }
  };


  // --- Tool Handlers ---
  const handleViewTool = async (tool: any) => {
    try {
      setIsLoading(true);
      let imagePreviewUrl: string | undefined;
      if (tool.imagePath) {
        const token = localStorage.getItem('token');
        const url = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:12345'}/api/tools/images/${tool.imagePath}`;
        try {
          const res = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const blob = await res.blob();
            imagePreviewUrl = URL.createObjectURL(blob);
          }
        } catch (err) {
          console.error('Failed to load tool image', err);
        }
      }
      setViewingTool({ ...tool, imagePreviewUrl });
      setToolView('view');
    } catch (err: any) {
      setError(getErrorMessage(err, 'Unable to load tool.'));
    } finally {
      setIsLoading(false);
    }
  };

  // Dashboard Calculations
  const totalQuoteValue = quotes.reduce((sum, q) => sum + (Number(q.total) || 0), 0);
  const totalInvoiceValue = invoices.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);

  const totalPaymentsRecorded = statements.reduce((sum, statement) => {
    const items = (statement as any).items || (statement as any).Items || [];
    return sum + items.reduce((itemSum: number, item: any) => itemSum + (item.paymentAmount || item.PaymentAmount || 0), 0);
  }, 0);

  const totalOutstanding = Math.max(0, totalInvoiceValue - totalPaymentsRecorded);
  const collectionRate = totalInvoiceValue > 0 ? (totalPaymentsRecorded / totalInvoiceValue) * 100 : 0;

  const recentQuotes = [...quotes].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
  const recentInvoices = [...invoices].sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()).slice(0, 5);
  const recentStatements = [...statements].sort((a, b) => {
    const dateA = (a as any).createdAt || (a as any).CreatedAt;
    const dateB = (b as any).createdAt || (b as any).CreatedAt;
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  }).slice(0, 5);

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className="app-shell">
      <header className="site-header no-print" style={{ background: `${import.meta.env.VITE_ENV_COLOR}` }}>
        <div className="header-left">
          <div
            className="brand-block"
            onClick={() => {
              setSection('dashboard');
              setStatementView('list');
              clearClientState();
              clearQuoteState();
              clearInvoiceState();
              clearStatementState();
              clearJobCardState();
              clearDeliveryNoteState();
              clearCreditNoteState();
              clearCostState();
            }}
            style={{ cursor: 'pointer' }}
          >
            <img
              src={logo}
              alt="Logo"
              className="brand-logo"
              style={{ display: 'block', height: '80px', width: 'auto', flexShrink: 0, marginRight: '12px' }}
            />
          </div>

          <div className="site-toolbar">
            {/* Reports DataGrid Button */}
            <button
              type="button"
              className={`nav-item ${section === 'reports' ? 'active' : ''}`}
              onClick={() => setSection('reports')}
              style={{
                background: section === 'reports' ? '#237735ff' : '#237735ff',
                color: section === 'reports' ? '#ffffffff' : '#f8fafc',
                fontWeight: 700,
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              📊 Reports
            </button>

            {/* QuickActions dropdown */}
            <div className="dropdown" ref={quickActionsRef}>
              <button
                type="button"
                className={`dropdown-toggle ${quickActionsOpen ? 'active' : ''}`}
                onClick={() => setQuickActionsOpen((o) => !o)}
              >
                QuickActions ▾
              </button>
              {quickActionsOpen && (
                <div className="dropdown-menu">
                  <button type="button" onClick={() => { setSection('quotes'); clearQuoteState(); setQuoteView('manage'); setQuickActionsOpen(false); }}>Create Quote</button>
                  <button type="button" onClick={() => { setSection('invoices'); clearInvoiceState(); setInvoiceView('manage'); setQuickActionsOpen(false); }}>Create Invoice</button>
                  <button type="button" onClick={() => { setSection('statements'); setStatementView('manage'); clearStatementState(); setQuickActionsOpen(false); }}>Create Statement</button>
                  <button type="button" onClick={() => { setSection('clients'); clearClientState(); setClientView('manage'); setQuickActionsOpen(false); }}>Create Client</button>
                  <button type="button" onClick={() => { setSection('jobcards'); clearJobCardState(); setJobCardView('manage'); setQuickActionsOpen(false); }}>Create Job Card</button>
                </div>
              )}
            </div>

            {/* Business dropdown */}
            <div className="dropdown" ref={businessRef}>
              <button
                type="button"
                className={`dropdown-toggle ${businessOpen ? 'active' : ''}`}
                onClick={() => setBusinessOpen((o) => !o)}
              >
                Business ▾
              </button>
              {businessOpen && (
                <div className="dropdown-menu">
                  <button type="button" onClick={() => { setSection('quotes'); setQuoteView('list'); clearQuoteState(); setBusinessOpen(false); }}>Quotes</button>
                  <button type="button" onClick={() => { setSection('invoices'); setInvoiceView('list'); clearInvoiceState(); setBusinessOpen(false); }}>Invoices</button>
                  <button type="button" onClick={() => { setSection('statements'); setStatementView('list'); clearStatementState(); setBusinessOpen(false); }}>Statements</button>
                  <button type="button" onClick={() => { setSection('clients'); setClientView('list'); clearClientState(); setBusinessOpen(false); }}>Clients</button>
                  <button type="button" onClick={() => { setSection('jobcards'); setJobCardView('list'); clearJobCardState(); setBusinessOpen(false); }}>Job Cards</button>
                  <button type="button" onClick={() => { setSection('deliverynotes'); setDeliveryNoteView('list'); clearDeliveryNoteState(); setBusinessOpen(false); }}>Delivery Notes</button>
                  <button type="button" onClick={() => { setSection('creditnotes'); setCreditNoteView('list'); clearCreditNoteState(); setBusinessOpen(false); }}>Credit Notes</button>
                </div>
              )}
            </div>

            {/* Management dropdown */}
            <div className="dropdown" ref={managementRef}>
              <button
                type="button"
                className={`dropdown-toggle ${managementOpen ? 'active' : ''}`}
                onClick={() => setManagementOpen((o) => !o)}
              >
                Management ▾
              </button>
              {managementOpen && (
                <div className="dropdown-menu">
                  <button type="button" onClick={() => { setSection('admin'); setAdminView('tools'); setManagementOpen(false); }}>Tools</button>
                  <button type="button" onClick={() => { setSection('admin'); setAdminView('products'); setProductView('list'); setManagementOpen(false); }}>Products</button>
                  <button type="button" onClick={() => { setSection('admin'); setAdminView('documents'); setManagementOpen(false); }}>Documents</button>
                  <button type="button" onClick={() => { setSection('costs'); setCostView('list'); clearCostState(); setManagementOpen(false); }}>Costs</button>
                </div>
              )}
            </div>

            {/* Admin dropdown */}
            <div className="dropdown" ref={adminDropRef}>
              <button
                type="button"
                className={`dropdown-toggle ${adminDropOpen ? 'active' : ''}`}
                onClick={() => setAdminDropOpen((o) => !o)}
              >
                Admin ▾
              </button>
              {adminDropOpen && (
                <div className="dropdown-menu">
                  <button type="button" onClick={() => { setSection('admin'); setAdminView('users'); setAdminDropOpen(false); }}>Users</button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="user-block">
          <div className="user-copy">
            <strong>{user?.username} | {user?.role}</strong>
            <button className="btn-logout" onClick={logout}>
              Logout
            </button>
          </div>
        </div>
      </header >

      {
        error && (
          <div
            style={{
              background: '#fee2e2',
              color: '#991b1b',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '24px',
              border: '1px solid #fecaca'
            }}
          >
            {error}
            <button
              onClick={() => setError(null)}
              style={{
                marginLeft: '12px',
                background: 'none',
                border: 'none',
                color: '#991b1b',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              ✕
            </button>
          </div>
        )
      }

      {
        !isLoading && section === 'statements' && (
          <Statements invoices={invoices} clients={clients} creditNotes={creditNotes} statements={statements} onRefresh={loadAll} onDelete={handleDeleteStatement} />
        )
      }

      {
        !isLoading && section === 'deliverynotes' && deliveryNoteView === 'list' && (
          <DeliveryNoteListPage
            deliveryNotes={deliveryNotes}
            onView={handleViewDeliveryNote}
            onEdit={handleEditDeliveryNote}
            onDelete={handleDeleteDeliveryNote}
            onCreateNew={() => { clearDeliveryNoteState(); setDeliveryNoteView('manage'); }}
          />
        )
      }

      {
        !isLoading && section === 'deliverynotes' && deliveryNoteView === 'manage' && (
          <DeliveryNoteForm
            quotes={quotes}
            clients={clients}
            initialData={editingDeliveryNote ?? undefined}
            isNew={!editingDeliveryNote}
            onSubmit={editingDeliveryNote
              ? (p) => handleUpdateDeliveryNote(editingDeliveryNote.id, p)
              : handleCreateDeliveryNote
            }
            onCancel={() => setDeliveryNoteView('list')}
          />
        )
      }

      {
        !isLoading && section === 'deliverynotes' && deliveryNoteView === 'view' && viewingDeliveryNote && (
          <DeliveryNoteViewPage
            deliveryNote={viewingDeliveryNote}
            onEdit={() => handleEditDeliveryNote(viewingDeliveryNote)}
            onBack={() => setDeliveryNoteView('list')}
          />
        )
      }

      {
        !isLoading && section === 'creditnotes' && creditNoteView === 'list' && (
          <CreditNoteListPage
            creditNotes={creditNotes}
            onView={handleViewCreditNote}
            onEdit={handleEditCreditNote}
            onDelete={handleDeleteCreditNote}
            onCreateNew={() => { clearCreditNoteState(); setCreditNoteView('manage'); }}
          />
        )
      }

      {
        !isLoading && section === 'creditnotes' && creditNoteView === 'manage' && (
          <CreditNoteForm
            clients={clients}
            initialData={editingCreditNote || undefined}
            isNew={!editingCreditNote}
            onSubmit={editingCreditNote
              ? (p) => handleUpdateCreditNote(editingCreditNote.id, p)
              : handleCreateCreditNote
            }
            onCancel={() => setCreditNoteView('list')}
          />
        )
      }

      {
        !isLoading && section === 'creditnotes' && creditNoteView === 'view' && viewingCreditNote && (
          <CreditNoteViewPage
            creditNote={viewingCreditNote}
            onEdit={() => handleEditCreditNote(viewingCreditNote)}
            onBack={() => setCreditNoteView('list')}
          />
        )
      }

      {
        !isLoading && section === 'costs' && costView === 'list' && (
          <CostsListPage
            costs={costs}
            onEdit={handleEditCost}
            onDelete={handleDeleteCost}
            onDuplicate={handleDuplicateCost}
            onCreateNew={() => {
              clearCostState();
              setCostView('manage');
            }}
          />
        )
      }

      {
        !isLoading && section === 'costs' && costView === 'manage' && (
          <CostForm
            initialData={editingCost ?? undefined}
            onSubmit={editingCost
              ? (payload) => handleUpdateCost(editingCost.id, payload)
              : handleCreateCost
            }
            onCancel={() => setCostView('list')}
          />
        )
      }

      {
        isLoading && section !== 'dashboard' && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            Loading…
          </div>
        )
      }

      {
        !isLoading && section === 'dashboard' && (
          <DashboardPage
            clients={clients}
            quotes={quotes}
            invoices={invoices}
            statements={statements}
            jobCards={jobCards}
            deliveryNotes={deliveryNotes}
            creditNotes={creditNotes}
            products={products}
            tools={tools}
            costs={costs}
            onNavigate={(sec, view, item) => {
              setSection(sec as Section);
              if (sec === 'quotes' && view === 'view' && item) handleViewQuote(item);
              if (sec === 'invoices' && view === 'view' && item) handleViewInvoice(item);
              if (sec === 'statements' && view === 'view' && item) handleViewStatement(item);
              if (sec === 'clients' && view === 'view' && item) handleViewClient(item);
              if (sec === 'jobcards' && view === 'view' && item) handleViewJobCard(item);
              if (sec === 'deliverynotes' && view === 'view' && item) handleViewDeliveryNote(item);
              if (sec === 'creditnotes' && view === 'view' && item) handleViewCreditNote(item);
            }}
          />
        )
      }

      {
        !isLoading && section === 'reports' && (
          <ReportsPage
            clients={clients}
            quotes={quotes}
            invoices={invoices}
            statements={statements}
            jobCards={jobCards}
            deliveryNotes={deliveryNotes}
            creditNotes={creditNotes}
            products={products}
            tools={tools}
            costs={costs}
            documents={documents}
            onBack={() => setSection('dashboard')}
          />
        )
      }

      {
        !isLoading && section === 'clients' && clientView === 'list' && (
          <ClientsListPage
            clients={clients}
            onEdit={handleEditClient}
            onView={handleViewClient}
            onDelete={handleDeleteClient}
            onCreateNew={() => {
              clearClientState();
              setClientView('manage');
            }}
          />
        )
      }

      {
        !isLoading && section === 'clients' && clientView === 'manage' && (
          <ClientManagementPage
            client={editingClient ?? undefined}
            isNew={!editingClient}
            isDuplicate={isDuplicatingClient}
            onSubmit={
              editingClient && !isDuplicatingClient
                ? (payload) => handleUpdateClient(editingClient.id, payload)
                : handleCreateClient
            }
            onCancel={() => {
              clearClientState();
              setClientView('list');
            }}
          />
        )
      }

      {
        !isLoading && section === 'clients' && clientView === 'view' && viewingClient && (
          <ClientViewPage
            client={viewingClient}
            onEdit={() => handleEditClient(viewingClient)}
            onDuplicate={() => handleDuplicateClient(viewingClient)}
            onBack={() => {
              clearClientState();
              setClientView('list');
            }}
          />
        )
      }

      {
        !isLoading && section === 'quotes' && quoteView === 'list' && (
          <QuotesListPage
            quotes={quotes}
            onEdit={handleEditQuote}
            onView={handleViewQuote}
            onDelete={handleDeleteQuote}
            onDuplicate={handleDuplicateQuote}
            onCreateNew={() => {
              clearQuoteState();
              setQuoteView('manage');
            }}
          />
        )
      }

      {
        !isLoading && section === 'quotes' && quoteView === 'manage' && (
          <QuoteManagementPage
            quote={editingQuote ?? undefined}
            clients={clients}
            selectedClientId={quoteClientId}
            productOptions={products}
            onSelectClientId={setQuoteClientId}
            isNew={!editingQuote?.id}
            isDuplicate={isDuplicatingQuote}
            onSubmit={
              editingQuote?.id && !isDuplicatingQuote
                ? (payload) => handleUpdateQuote(editingQuote.id, payload)
                : handleCreateQuote
            }
            onCancel={() => {
              clearQuoteState();
              setQuoteView('list');
            }}
            onRequestNewClient={() => {
              setSection('clients');
              clearClientState();
              setClientView('manage');
            }}
          />
        )
      }

      {
        !isLoading && section === 'quotes' && quoteView === 'view' && viewingQuote && (
          <QuoteViewPage
            quote={viewingQuote}
            onEdit={() => handleEditQuote(viewingQuote)}
            onDuplicate={() => handleDuplicateQuote(viewingQuote)}
            onBack={() => {
              clearQuoteState();
              setQuoteView('list');
            }}
          />
        )
      }

      {
        !isLoading && section === 'invoices' && invoiceView === 'list' && (
          <InvoiceListPage
            invoices={invoices}
            onView={handleViewInvoice}
            onEdit={handleEditInvoice}
            onDelete={handleDeleteInvoice}
            onCreateNew={() => {
              clearInvoiceState();
              setInvoiceView('manage');
            }}
          />
        )
      }

      {
        !isLoading && section === 'invoices' && invoiceView === 'manage' && (
          <InvoiceForm
            quotes={quotes}
            initialData={editingInvoice ?? undefined}
            onSubmit={
              editingInvoice?.id
                ? (payload) => handleUpdateInvoice(editingInvoice.id, payload)
                : handleCreateInvoice
            }
            onCancel={() => {
              clearInvoiceState();
              setInvoiceView('list');
            }}
          />
        )
      }

      {
        !isLoading && section === 'invoices' && invoiceView === 'view' && viewingInvoice && (
          <InvoiceViewPage
            invoice={viewingInvoice}
            onEdit={() => viewingInvoice && handleEditInvoice(viewingInvoice)}
            onBack={() => {
              clearInvoiceState();
              setInvoiceView('list');
            }}
          />
        )
      }

      {
        !isLoading && section === 'admin' && adminView === 'home' && (
          <AdminHomePage
            onViewProducts={() => setAdminView('products')}
            onViewUsers={() => setAdminView('users')}
            onViewDocuments={() => setAdminView('documents')}
            onViewTools={() => setAdminView('tools')}
          />
        )
      }

      {
        !isLoading && section === 'admin' && adminView === 'products' && productView === 'list' && (
          <ProductManagementPage onBack={() => setAdminView('home')} onRefreshApp={loadAll} onView={handleViewProduct} />
        )
      }

      {
        !isLoading && section === 'admin' && adminView === 'products' && productView === 'view' && viewingProduct && (
          <ProductViewPage
            product={viewingProduct}
            imagePreviewUrl={viewingProduct.imagePreviewUrl}
            onBack={() => setProductView('list')}
          />
        )
      }

      {
        !isLoading && section === 'admin' && adminView === 'users' && (
          <UserManagementPage users={users} onBack={() => setAdminView('home')} onRefresh={loadAll} />
        )
      }

      {
        !isLoading && section === 'admin' && adminView === 'documents' && (
          <DocumentManagementPage onBack={() => setAdminView('home')} onRefreshApp={loadAll} />
        )
      }

      {
        !isLoading && section === 'admin' && adminView === 'tools' && toolView === 'list' && (
          <ToolManagementPage onBack={() => setAdminView('home')} onRefreshApp={loadAll} onView={handleViewTool} />
        )
      }

      {
        !isLoading && section === 'admin' && adminView === 'tools' && toolView === 'view' && viewingTool && (
          <ToolViewPage
            tool={viewingTool}
            imagePreviewUrl={viewingTool.imagePreviewUrl}
            onBack={() => setToolView('list')}
          />
        )
      }

      {
        !isLoading && section === 'jobcards' && jobCardView === 'list' && (
          <JobCardListPage
            jobCards={jobCards}
            onView={handleViewJobCard}
            onEdit={handleEditJobCard}
            onDelete={handleDeleteJobCard}
            onCreateNew={() => {
              clearJobCardState();
              setJobCardView('manage');
            }}
          />
        )
      }

      {
        !isLoading && section === 'jobcards' && jobCardView === 'manage' && (
          <JobCardForm
            quotes={quotes}
            initialData={editingJobCard ?? undefined}
            isNew={!editingJobCard?.id}
            onSubmit={
              editingJobCard?.id
                ? (payload) => handleUpdateJobCard(editingJobCard.id, payload)
                : handleCreateJobCard
            }
            onCancel={() => {
              clearJobCardState();
              setJobCardView('list');
            }}
          />
        )
      }

      {
        !isLoading && section === 'jobcards' && jobCardView === 'view' && viewingJobCard && (
          <JobCardViewPage
            jobCard={viewingJobCard}
            onEdit={() => viewingJobCard && handleEditJobCard(viewingJobCard)}
            onBack={() => {
              clearJobCardState();
              setJobCardView('list');
            }}
          />
        )
      }
    </div >
  );
}
export default App;
