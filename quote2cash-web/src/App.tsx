﻿﻿﻿﻿import { useEffect, useRef, useState } from 'react';
import { formatAmount } from '../formatters';
import {
  createClient,
  createInvoice,
  createQuote,
  deleteClient,
  deleteInvoice,
  deleteQuote,
  getClients,
  getInvoice,
  getInvoiceNextNumber,
  getInvoices,
  getQuote,
  getQuoteDescriptions,
  getQuotes,
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
  User
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
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [viewingQuote, setViewingQuote] = useState<Quote | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
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
      const [clientsData, quotesData, descriptionsData, usersData, invoicesData] = await Promise.all([
        getClients(),
        getQuotes(),
        getQuoteDescriptions(),
        getUsers(),
        getInvoices()
      ]);
      setClients(clientsData);
      setQuotes(quotesData);
      setQuoteDescriptions(descriptionsData);
      setUsers(usersData);
      setInvoices(invoicesData);
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

  const totalQuoteValue = quotes.reduce((sum, quote) => sum + (Number(quote.total) || 0), 0);
  const averageQuoteValue = quotes.length ? totalQuoteValue / quotes.length : 0;
  const largestQuoteValue = quotes.length ? Math.max(...quotes.map((quote) => Number(quote.total) || 0)) : 0;
  const topClients = clients
    .map((client) => ({
      name: client.name || 'Unknown Client',
      total: quotes.filter((quote) => quote.clientId === client.id).reduce((sum, quote) => sum + (Number(quote.total) || 0), 0)
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);
  const chartMax = Math.max(...topClients.map((client) => client.total), 1);

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

      {!isLoading && section === 'statements' && <Statements invoices={invoices} clients={clients} />}

      {isLoading && section !== 'dashboard' && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
          Loading…
        </div>
      )}

      {!isLoading && section === 'dashboard' && (
        <div className="page-section">
          <div className="section-header">
            <div>
              <h2>Dashboard</h2>
              <p>Live quote insights and client performance.</p>
            </div>
          </div>

          <div className="stats-row">
            <div className="stat-box">
              <span className="stat-label">Total Clients</span>
              <span className="stat-value">{clients.length}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Total Quotes</span>
              <span className="stat-value">{quotes.length}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Total Quote Value</span>
              <span className="stat-value">{formatAmount(totalQuoteValue)}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Avg. Quote Value</span>
              <span className="stat-value">{formatAmount(averageQuoteValue)}</span>
            </div>
          </div>

          <div className="chart-grid">
            <div className="dashboard-card chart-card">
              <div className="card-heading">
                <h3>Top Clients by Quote Value</h3>
                <span className="badge accent-red">Live</span>
              </div>
              {topClients.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📊</div>
                  <p>No client quote totals available yet.</p>
                </div>
              ) : (
                <div className="bar-chart">
                  {topClients.map((client) => (
                    <div className="chart-row" key={client.name}>
                      <div className="chart-row-label">{client.name}</div>
                      <div className="chart-bar-wrap">
                        <div
                          className="chart-bar-fill"
                          style={{ width: `${(client.total / chartMax) * 100}%` }}
                        />
                      </div>
                      <div className="chart-row-value">{formatAmount(client.total)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="dashboard-card metrics-card">
              <div className="card-heading">
                <h3>Quote Performance</h3>
                <span className="badge accent-yellow">Trend</span>
              </div>
              <div className="metric-grid">
                <div className="metric-tile metric-blue">
                  <span>Total Value</span>
                  <strong>{formatAmount(totalQuoteValue)}</strong>
                </div>
                <div className="metric-tile metric-white">
                  <span>Average Quote</span>
                  <strong>{formatAmount(averageQuoteValue)}</strong>
                </div>
                <div className="metric-tile metric-red">
                  <span>Largest Quote</span>
                  <strong>{formatAmount(largestQuoteValue)}</strong>
                </div>
                <div className="metric-tile metric-dark">
                  <span>Clients with Quotes</span>
                  <strong>{topClients.filter((client) => client.total > 0).length}</strong>
                </div>
              </div>
            </div>
          </div>

          {quotes.length > 0 && (
            <div className="dashboard-card quote-list-card">
              <div className="card-heading">
                <h3>Recent Quotes</h3>
              </div>
              <div className="quote-list">
                {quotes.slice(0, 5).map((quote) => (
                  <button
                    type="button"
                    key={quote.id}
                    className="quote-list-item"
                    onClick={() => handleViewQuote(quote)}
                  >
                    <div>
                      <strong>#{quote.quoteNumber}</strong> {quote.reference}
                      <div className="quote-list-meta">{quote.client?.name ?? 'No client'}</div>
                    </div>
                    <span>{formatAmount(quote.total)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
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
          isNew={!editingQuote}
          isDuplicate={isDuplicatingQuote}
          onSubmit={
            editingQuote && !isDuplicatingQuote
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
            editingInvoice
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
        <DocumentManagementPage />
      )}
    </div>
  );
}
export default App;
