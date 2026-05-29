﻿import { useEffect, useRef, useState } from 'react';
import { formatAmount } from '../formatters';
import {
  createClient,
  createQuote,
  deleteClient,
  deleteQuote,
  getClients,
  getQuote,
  getQuoteDescriptions,
  getQuoteUoms,
  getQuotes,
  getUsers,
  updateClient,
  updateQuote
} from './api';
import type {
  Client,
  ClientCreateRequest,
  Quote,
  QuoteCreateRequest,
  QuoteDescription,
  QuoteUom,
  User
} from './types';
import { useAuth } from './AuthContext';
import { Login } from './components/Login';
import ClientsListPage from './components/ClientsListPage';
import ClientManagementPage from './components/ClientManagementPage';
import ClientViewPage from './components/ClientViewPage';
import QuotesListPage from './components/QuotesListPage';
import QuoteManagementPage from './components/QuoteManagementPage';
import QuoteViewPage from './components/QuoteViewPage';
import AdminHomePage from './components/AdminHomePage';
import QuoteUomManagementPage from './components/QuoteUomManagementPage';
import QuoteDescriptionManagementPage from './components/QuoteDescriptionManagementPage';
import UserManagementPage from './components/UserManagementPage';
import logo from './assets/logo.png';


type Section = 'dashboard' | 'clients' | 'quotes' | 'admin';
type ClientView = 'list' | 'manage' | 'view';
type QuoteView = 'list' | 'manage' | 'view';
type AdminView = 'home' | 'uoms' | 'descriptions' | 'users';

function App() {
  const [section, setSection] = useState<Section>('dashboard');
  const [clientView, setClientView] = useState<ClientView>('list');
  const [quoteView, setQuoteView] = useState<QuoteView>('list');
  const [clients, setClients] = useState<Client[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [viewingQuote, setViewingQuote] = useState<Quote | null>(null);
  const [quoteUoms, setQuoteUoms] = useState<QuoteUom[]>([]);
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

  const loadAll = async () => {
    try {
      setError(null);
      setIsLoading(true);
      const [clientsData, quotesData, uomsData, descriptionsData, usersData] = await Promise.all([
        getClients(),
        getQuotes(),
        getQuoteUoms(),
        getQuoteDescriptions(),
        getUsers()
      ]);
      setClients(clientsData);
      setQuotes(quotesData);
      setQuoteUoms(uomsData);
      setQuoteDescriptions(descriptionsData);
      setUsers(usersData);
    } catch {
      setError('Unable to load data. Confirm the API is running.');
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
    } catch {
      setError('Unable to save client.');
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
    } catch {
      setError('Unable to update client.');
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
      } catch {
        setError('Unable to delete client.');
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
    } catch {
      setError('Unable to save quote.');
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
    } catch {
      setError('Unable to update quote.');
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
      } catch {
        setError('Unable to delete quote.');
      } finally {
        setIsLoading(false);
      }
    }
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
      setIsLoading(true);
      const fullClient = await getClients();
      const clientToDuplicate = fullClient.find((c) => c.id === client.id);
      if (clientToDuplicate) {
        setEditingClient(clientToDuplicate);
        setIsDuplicatingClient(true);
        setClientView('manage');
      }
    } catch {
      setError('Unable to load client for duplication.');
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
    } catch {
      setError('Unable to load quote for editing.');
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
    } catch {
      setError('Unable to load quote.');
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
    } catch {
      setError('Unable to load quote for duplication.');
    } finally {
      setIsLoading(false);
    }
  };

  const totalQuoteValue = quotes.reduce((sum, quote) => sum + quote.total, 0);
  const averageQuoteValue = quotes.length ? totalQuoteValue / quotes.length : 0;
  const largestQuoteValue = quotes.length ? Math.max(...quotes.map((quote) => quote.total)) : 0;
  const topClients = clients
    .map((client) => ({
      name: client.name,
      total: quotes.filter((quote) => quote.clientId === client.id).reduce((sum, quote) => sum + quote.total, 0)
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
          <div className="brand-block">
            <img 
              src={logo} 
              alt="Logo" 
              className="brand-logo" 
              style={{ display: 'block', height: '40px', width: 'auto', flexShrink: 0, marginRight: '12px' }} 
            />
            <div>
              <div className="brand-title">EPEC Solution</div>
              <div className="brand-tagline">EXPLORE THE POSIBILITY</div>
            </div>
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
              className={`nav-button ${section === 'dashboard' ? 'active' : ''}`}
              onClick={() => {
                setSection('dashboard');
                clearClientState();
                clearQuoteState();
              }}
            >
              Dashboard
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
          uomOptions={quoteUoms}
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

      {!isLoading && section === 'admin' && adminView === 'home' && (
        <AdminHomePage
          onViewUoms={() => setAdminView('uoms')}
          onViewDescriptions={() => setAdminView('descriptions')}
          onViewUsers={() => setAdminView('users')}
        />
      )}

      {!isLoading && section === 'admin' && adminView === 'uoms' && (
        <QuoteUomManagementPage uoms={quoteUoms} onBack={() => setAdminView('home')} onRefresh={loadAll} />
      )}

      {!isLoading && section === 'admin' && adminView === 'descriptions' && (
        <QuoteDescriptionManagementPage descriptions={quoteDescriptions} onBack={() => setAdminView('home')} onRefresh={loadAll} />
      )}

      {!isLoading && section === 'admin' && adminView === 'users' && (
        <UserManagementPage users={users} onBack={() => setAdminView('home')} onRefresh={loadAll} />
      )}
    </div>
  );
}
export default App;
