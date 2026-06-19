﻿import { useEffect, useRef, useState } from 'react';
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
  getDocuments, // Added for document management
  getQuote,
  getQuoteDescriptions,
  getQuoteNextNumber,
  getQuotes,
  getStatements,
  getUsers,
  updateClient,
  updateInvoice,
  updateQuote
} from './api';
import type {
  Client,
  ClientCreateRequest,
  Invoice,
  InvoiceCreateRequest,
  Quote,
  QuoteCreateRequest,
  QuoteDescription,
  User,
  Statement,
  DocumentResponse // Added for document management
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
import QuoteDescriptionManagementPage from './components/QuoteDescriptionManagementPage';
import UserManagementPage from './components/UserManagementPage';
import { Statements } from './components/Statements';
import logo from './assets/logo.png';


type Section = 'dashboard' | 'clients' | 'quotes' | 'invoices' | 'admin' | 'statements';
type ClientView = 'list' | 'manage' | 'view';
type QuoteView = 'list' | 'manage' | 'view';
type InvoiceView = 'list' | 'manage' | 'view';
type StatementView = 'list' | 'manage' | 'view';
type AdminView = 'home' | 'descriptions' | 'users' | 'documents';

function App() {
  const [section, setSection] = useState<Section>('dashboard');
  const [clientView, setClientView] = useState<ClientView>('list');
  const [quoteView, setQuoteView] = useState<QuoteView>('list');
  const [invoiceView, setInvoiceView] = useState<InvoiceView>('list');
  const [statementView, setStatementView] = useState<StatementView>('list');
  const [clients, setClients] = useState<Client[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [statements, setStatements] = useState<Statement[]>([]);
  const [documents, setDocuments] = useState<DocumentResponse[]>([]); // Added for document management
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [viewingQuote, setViewingQuote] = useState<Quote | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [viewingStatement, setViewingStatement] = useState<Statement | null>(null);
  const [quoteDescriptions, setQuoteDescriptions] = useState<QuoteDescription[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [adminView, setAdminView] = useState<AdminView>('home');
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const quickActionsRef = useRef<HTMLDivElement | null>(null);
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
      const [clientsData, quotesData, descriptionsData, usersData, invoicesData, statementsData, documentsData] = await Promise.all([ // Modified for documents
        getClients(),
        getQuotes(),
        getQuoteDescriptions(),
        getUsers(),
        getInvoices(),
        getStatements(),
        getDocuments() // Fetch documents
      ]); // Closing the Promise.all array
      setClients(clientsData);
      setQuotes(quotesData);
      setQuoteDescriptions(descriptionsData);
      setUsers(usersData);
      setInvoices(invoicesData);
      setStatements(statementsData);
      setDocuments(documentsData); // Set documents state
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
    const handleClickOutside = (event: MouseEvent) => {
      if (quickActionsRef.current && !quickActionsRef.current.contains(event.target as Node)) {
        setQuickActionsOpen(false);
      }
    };

    if (quickActionsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [quickActionsOpen]);

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
      // Assuming StatementViewPage can handle the statement object directly
      // If full details are needed, a getStatement(statement.id) call would be here
      setViewingStatement(statement); // Assuming a state for viewingStatement exists or is added
      setStatementView('view');
      setSection('statements');
    } catch (err: any) {
      setError(getErrorMessage(err, 'Unable to load statement.'));
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
      <header className="site-header no-print">
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
            }}
            style={{ cursor: 'pointer' }}
          >
            <img
              src={logo}
              alt="Logo"
              className="brand-logo"
              style={{ display: 'block', height: '80px', width: 'auto', flexShrink: 0, marginRight: '12px' }}
            />
            {/*<div>
              <div className="brand-title">EPEC Solution</div>
              <div className="brand-tagline">EXPLORE THE POSIBILITY</div>
            </div>*/}
          </div>

          <div className="site-toolbar">
            <div className="dropdown" ref={quickActionsRef}>
              <button
                type="button"
                className={`dropdown-toggle ${quickActionsOpen ? 'active' : ''}`}
                onClick={() => setQuickActionsOpen((open) => !open)}
              >
                QuickActions ▾
              </button>
              {quickActionsOpen && (
                <div className="dropdown-menu">
                  <button
                    type="button"
                    onClick={() => {
                      setSection('quotes');
                      setQuoteView('list');
                      clearClientState();
                      clearQuoteState();
                      setQuickActionsOpen(false);
                    }}
                  >
                    View Quotes
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSection('invoices');
                      setInvoiceView('list');
                      clearClientState();
                      clearQuoteState();
                      clearInvoiceState();
                      setQuickActionsOpen(false);
                    }}
                  >
                    View Invoices
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSection('statements');
                      setStatementView('list');
                      clearClientState();
                      clearQuoteState();
                      clearInvoiceState();
                      clearStatementState();
                      setQuickActionsOpen(false);
                    }}
                  >
                    View Statements
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSection('clients');
                      setClientView('list');
                      clearClientState();
                      clearQuoteState();
                      setQuickActionsOpen(false);
                    }}
                  >
                    View Clients
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSection('quotes');
                      clearQuoteState();
                      setQuoteView('manage');
                      setQuickActionsOpen(false);
                    }}
                  >
                    Create Quote
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSection('invoices');
                      clearInvoiceState();
                      setInvoiceView('manage');
                      setQuickActionsOpen(false);
                    }}
                  >
                    Create Invoice
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSection('statements');
                      setStatementView('manage');
                      clearClientState();
                      clearQuoteState();
                      clearInvoiceState();
                      clearStatementState();
                      setQuickActionsOpen(false);
                    }}
                  >
                    Create Statement
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSection('clients');
                      clearClientState();
                      setClientView('manage');
                      setQuickActionsOpen(false);
                    }}
                  >
                    Create Client
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              className={`nav-button ${section === 'statements' ? 'active' : ''}`}
              onClick={() => {
                setSection('statements');
                setStatementView('list');
                clearClientState();
                clearQuoteState();
                clearInvoiceState();
                clearStatementState();
              }}
            >
              Statements
            </button>
            <button
              type="button"
              className={`nav-button ${section === 'clients' ? 'active' : ''}`}
              onClick={() => {
                setSection('clients');
                setClientView('list');
                clearClientState();
                clearQuoteState();
              }}
            >
              Clients
            </button>
            <button
              type="button"
              className={`nav-button ${section === 'quotes' ? 'active' : ''}`}
              onClick={() => {
                setSection('quotes');
                setQuoteView('list');
                clearClientState();
                clearQuoteState();
              }}
            >
              Quotes
            </button>
            <button
              type="button"
              className={`nav-button ${section === 'invoices' ? 'active' : ''}`}
              onClick={() => {
                setSection('invoices');
                setInvoiceView('list');
                clearClientState();
                clearQuoteState();
                clearInvoiceState();
                clearStatementState();
              }}
            >
              Invoices
            </button>
            <button
              type="button"
              className={`nav-button ${section === 'admin' ? 'active' : ''}`}
              onClick={() => {
                setSection('admin');
                setAdminView('home');
                clearClientState();
                clearQuoteState();
              }}
            >
              Admin
            </button>
          </div>
        </div>

        <div className="user-block">
          <div className="user-copy">
            <span>Signed in as</span>
            <strong>{user?.username}</strong>
            <span className="user-role">{user?.role}</span>
          </div>
          <button className="btn-logout" onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      {error && (
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
      )}

      {!isLoading && section === 'statements' && (
        <Statements invoices={invoices} clients={clients} statements={statements} onRefresh={loadAll} onDelete={handleDeleteStatement} />
      )}

      {isLoading && section !== 'dashboard' && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
          Loading…
        </div>
      )}

      {!isLoading && section === 'dashboard' && (
        <div className="page-section dashboard-new">
          <style dangerouslySetInnerHTML={{
            __html: `
            .dashboard-new { max-width: 1400px; margin: 0 auto; padding: 20px; }
            .dash-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
            .dash-header h2 { margin: 0; font-size: 1.8rem; color: #e6e6e6; }
            .dash-header p { margin: 4px 0 0; color: #ffffff; font-size: 0.95rem; }
            
            .metrics-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-bottom: 40px; }
            .metric-card { background: white; padding: 24px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); transition: transform 0.2s; }
            .metric-card:hover { transform: translateY(-2px); }
            .metric-card .m-label { display: block; font-size: 0.8rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
            .metric-card .m-value { display: block; font-size: 1.75rem; font-weight: 800; color: #0f172a; margin-top: 10px; }
            .metric-card .m-sub { display: block; font-size: 0.75rem; color: #94a3b8; margin-top: 6px; font-weight: 500; }
            
            .m-card-quotes { border-top: 5px solid #3b82f6; }
            .m-card-invoices { border-top: 5px solid #10b981; }
            .m-card-payments { border-top: 5px solid #8b5cf6; }
            .m-card-outstanding { border-top: 5px solid #ef4444; }

            .activity-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 24px; }
            .activity-block { background: white; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
            .block-header { padding: 18px 24px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
            .block-header h3 { margin: 0; font-size: 1.05rem; font-weight: 700; color: #334155; }
            .block-header button { font-size: 0.8rem; font-weight: 700; color: #3b82f6; background: white; border: 1px solid #e2e8f0; cursor: pointer; padding: 6px 12px; border-radius: 8px; transition: all 0.2s; }
            .block-header button:hover { background: #eff6ff; border-color: #3b82f6; }
            
            .list-scroll { flex: 1; max-height: 400px; overflow-y: auto; }
            .dash-item { display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; border-bottom: 1px solid #f1f5f9; cursor: pointer; transition: background 0.2s; }
            .dash-item:hover { background: #f8fafc; }
            .dash-item:last-child { border-bottom: none; }
            .item-main { display: flex; flex-direction: column; gap: 4px; }
            .item-main .title { font-size: 0.95rem; font-weight: 700; color: #1e293b; }
            .item-main .subtitle { font-size: 0.8rem; color: #64748b; }
            .item-side { text-align: right; }
            .item-side .amount { font-size: 1rem; font-weight: 700; color: #0f172a; display: block; }
            .item-side .date { font-size: 0.75rem; color: #94a3b8; }
            
            .status-tag { font-size: 0.65rem; font-weight: 800; padding: 4px 8px; border-radius: 6px; text-transform: uppercase; margin-right: 10px; display: inline-block; vertical-align: middle; }
            .status-tag.paid { background: #dcfce7; color: #166534; }
            .status-tag.draft { background: #f1f5f9; color: #475569; }
            .status-tag.sent { background: #dbeafe; color: #1e40af; }
            .status-tag.overdue { background: #fee2e2; color: #991b1b; }
            
            .empty-msg { padding: 60px; text-align: center; color: #94a3b8; font-style: italic; font-size: 0.95rem; }
          ` }} />

          <div className="dash-header">
            <div>
              <h2>Dashboard</h2>
              <p>Hello, {user?.username}. Here's the current health of your operations and activities.</p>
            </div>
            <div className="dash-summary-pills">
              <span className="badge accent-blue" style={{ padding: '10px 20px', borderRadius: '25px', fontWeight: 'bold' }}>{clients.length} Active Clients</span>
            </div>
          </div>

          <div className="metrics-row">
            <div className="metric-card m-card-quotes">
              <span className="m-label">Quoted Pipeline</span>
              <span className="m-value">{formatAmount(totalQuoteValue)}</span>
              <span className="m-sub">Value of {quotes.length} total quotes</span>
            </div>
            <div className="metric-card m-card-invoices">
              <span className="m-label">Billed Revenue</span>
              <span className="m-value">{formatAmount(totalInvoiceValue)}</span>
              <span className="m-sub">{invoices.length} invoices generated</span>
            </div>
            <div className="metric-card m-card-payments">
              <span className="m-label">Cash Collected</span>
              <span className="m-value" style={{ color: '#10b981' }}>{formatAmount(totalPaymentsRecorded)}</span>
              <span className="m-sub">{collectionRate.toFixed(1)}% collection efficiency</span>
            </div>
            <div className="metric-card m-card-outstanding">
              <span className="m-label">Pending Receivables</span>
              <span className="m-value" style={{ color: totalOutstanding > 0 ? '#ef4444' : '#10b981' }}>
                {formatAmount(totalOutstanding)}
              </span>
              <span className="m-sub">Balance from issued invoices</span>
            </div>
          </div>

          <div className="activity-grid">
            {/* Recent Payments */}
            <div className="activity-block">
              <div className="block-header">
                <h3>Recent Collection Activity</h3>
                <button onClick={() => setSection('statements')}>Statement Logs</button>
              </div>
              <div className="list-scroll" style={{ maxHeight: '300px' }}>
                {recentStatements.length === 0 ? (
                  <div className="empty-msg">No payment history recorded</div>
                ) : (
                  recentStatements.map(s => {
                    const sItems = (s as any).items || (s as any).Items || [];
                    const sTotal = sItems.reduce((sum: number, i: any) => sum + (i.paymentAmount || i.PaymentAmount || 0), 0);
                    const clientName = (s as any).client?.name || (s as any).Client?.Name || 'Unknown Client';
                    const sNum = (s as any).statementNumber || (s as any).StatementNumber;
                    return (
                      <div key={s.id} className="dash-item" onClick={() => handleViewStatement(s)}>
                        <div className="item-main">
                          <span className="title">Payment Advice #{sNum}</span>
                          <span className="subtitle">{clientName}</span>
                        </div>
                        <div className="item-side">
                          <span className="amount" style={{ color: '#10b981' }}>+{formatAmount(sTotal)}</span>
                          <span className="date">{new Date((s as any).createdAt || (s as any).CreatedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Recent Invoices */}
            <div className="activity-block">
              <div className="block-header">
                <h3>Latest Invoices</h3>
                <button onClick={() => setSection('invoices')}>Manage Invoices</button>
              </div>
              <div className="list-scroll" style={{ maxHeight: '300px' }}>
                {recentInvoices.length === 0 ? (
                  <div className="empty-msg">No invoicing activity found</div>
                ) : (
                  recentInvoices.map(inv => (
                    <div key={inv.id} className="dash-item" onClick={() => handleViewInvoice(inv)}>
                      <div className="item-main">
                        <span className="title">
                          <span className={`status-tag ${inv.status.toLowerCase()}`}>{inv.status}</span>
                          #{inv.invoiceNumber}
                        </span>
                        <span className="subtitle">{inv.client?.name || inv.quote?.client?.name || 'Unknown Client'}</span>
                      </div>
                      <div className="item-side">
                        <span className="amount">{formatAmount(inv.amount)}</span>
                        <span className="date">{inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : ''}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Quotes */}
            <div className="activity-block">
              <div className="block-header">
                <h3>Active Quotes</h3>
                <button onClick={() => setSection('quotes')}>Manage Quotes</button>
              </div>
              <div className="list-scroll">
                {recentQuotes.length === 0 ? (
                  <div className="empty-msg">No quotations created yet</div>
                ) : (
                  recentQuotes.map(q => (
                    <div key={q.id} className="dash-item" onClick={() => handleViewQuote(q)}>
                      <div className="item-main">
                        <span className="title">#{q.quoteNumber}</span>
                        <span className="subtitle">{q.client?.name || 'Private Client'} — {q.reference}</span>
                      </div>
                      <div className="item-side">
                        <span className="amount">{formatAmount(q.total)}</span>
                        <span className="date">{new Date(q.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {!isLoading && section === 'clients' && clientView === 'list' && (
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
      )}

      {!isLoading && section === 'clients' && clientView === 'manage' && (
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
      )}

      {!isLoading && section === 'clients' && clientView === 'view' && viewingClient && (
        <ClientViewPage
          client={viewingClient}
          onEdit={() => handleEditClient(viewingClient)}
          onDuplicate={() => handleDuplicateClient(viewingClient)}
          onBack={() => {
            clearClientState();
            setClientView('list');
          }}
        />
      )}

      {!isLoading && section === 'quotes' && quoteView === 'list' && (
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
      )}

      {!isLoading && section === 'quotes' && quoteView === 'manage' && (
        <QuoteManagementPage
          quote={editingQuote ?? undefined}
          clients={clients}
          selectedClientId={quoteClientId}
          descriptionOptions={quoteDescriptions}
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
      )}

      {!isLoading && section === 'quotes' && quoteView === 'view' && viewingQuote && (
        <QuoteViewPage
          quote={viewingQuote}
          onEdit={() => handleEditQuote(viewingQuote)}
          onDuplicate={() => handleDuplicateQuote(viewingQuote)}
          onBack={() => {
            clearQuoteState();
            setQuoteView('list');
          }}
        />
      )}

      {!isLoading && section === 'invoices' && invoiceView === 'list' && (
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
      )}

      {!isLoading && section === 'invoices' && invoiceView === 'manage' && (
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
      )}

      {!isLoading && section === 'invoices' && invoiceView === 'view' && viewingInvoice && (
        <InvoiceViewPage
          invoice={viewingInvoice}
          onEdit={() => viewingInvoice && handleEditInvoice(viewingInvoice)}
          onBack={() => {
            clearInvoiceState();
            setInvoiceView('list');
          }}
        />
      )}

      {!isLoading && section === 'admin' && adminView === 'home' && (
        <AdminHomePage
          onViewDescriptions={() => setAdminView('descriptions')}
          onViewUsers={() => setAdminView('users')}
          onViewDocuments={() => setAdminView('documents')}
        />
      )}

      {!isLoading && section === 'admin' && adminView === 'descriptions' && (
        <QuoteDescriptionManagementPage descriptions={quoteDescriptions} onBack={() => setAdminView('home')} onRefresh={loadAll} />
      )}

      {!isLoading && section === 'admin' && adminView === 'users' && (
        <UserManagementPage users={users} onBack={() => setAdminView('home')} onRefresh={loadAll} />
      )}

      {!isLoading && section === 'admin' && adminView === 'documents' && (
        <DocumentManagementPage onBack={() => setAdminView('home')} onRefreshApp={loadAll} />
      )}
    </div>
  );
}
export default App;
