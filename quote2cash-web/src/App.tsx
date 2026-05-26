import { useEffect, useState } from 'react';
import { formatAmount } from '../formatters';
import {
  createClient,
  createQuote,
  deleteClient,
  deleteQuote,
  getClients,
  getQuote,
  getQuotes,
  updateClient,
  updateQuote
} from './api';
import type {
  Client,
  ClientCreateRequest,
  Quote,
  QuoteCreateRequest
} from './types';
import ClientsListPage from './components/ClientsListPage';
import ClientManagementPage from './components/ClientManagementPage';
import ClientViewPage from './components/ClientViewPage';
import QuotesListPage from './components/QuotesListPage';
import QuoteManagementPage from './components/QuoteManagementPage';
import QuoteViewPage from './components/QuoteViewPage';
import logo from '../resource/Logo.png';


type Section = 'dashboard' | 'clients' | 'quotes';
type ClientView = 'list' | 'manage' | 'view';
type QuoteView = 'list' | 'manage' | 'view';

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
  const [isDuplicatingClient, setIsDuplicatingClient] = useState(false);
  const [isDuplicatingQuote, setIsDuplicatingQuote] = useState(false);
  const [quoteClientId, setQuoteClientId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAll = async () => {
    try {
      setError(null);
      setIsLoading(true);
      const [clientsData, quotesData] = await Promise.all([getClients(), getQuotes()]);
      setClients(clientsData);
      setQuotes(quotesData);
    } catch {
      setError('Unable to load data. Confirm the API is running.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
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

  return (
    <div className="app-shell">
          <header className="hero no-print">
            <div>
              <h1>EPEC Solutions</h1>
              <p>EXPLORE THE POSIBILITY</p>
            </div>
            <div>
              <img src={logo} alt="Epec Solutions" className="hero-logo" />
            </div>
          </header>

      <div className="tabs no-print">
        <button
          className={`tab-button ${section === 'dashboard' ? 'active' : ''}`}
          onClick={() => {
            setSection('dashboard');
            clearClientState();
            clearQuoteState();
          }}
        >
          Dashboard
        </button>
        <button
          className={`tab-button ${section === 'clients' ? 'active' : ''}`}
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
          className={`tab-button ${section === 'quotes' ? 'active' : ''}`}
          onClick={() => {
            setSection('quotes');
            setQuoteView('list');
            clearClientState();
            clearQuoteState();
          }}
        >
          Quotes
        </button>
      </div>

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
              <p>Business metrics and recent activity</p>
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
              <span className="stat-label">Quote Value</span>
              <span className="stat-value">{formatAmount(totalQuoteValue)}</span>
            </div>
          </div>

          <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
            <div className="card">
              <h3>Quick Actions</h3>
              <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
                <button
                  className="btn-primary"
                  onClick={() => {
                    setSection('clients');
                    setClientView('list');
                    clearClientState();
                  }}
                >
                  Browse Clients
                </button>
                <button
                  className="btn-primary"
                  onClick={() => {
                    setSection('quotes');
                    setQuoteView('list');
                    clearQuoteState();
                  }}
                >
                  Browse Quotes
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setSection('clients');
                    clearClientState();
                    setClientView('manage');
                  }}
                >
                  Create Client
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setSection('quotes');
                    clearQuoteState();
                    setQuoteView('manage');
                  }}
                >
                  Create Quote
                </button>
              </div>
            </div>

            {quotes.length > 0 && (
              <div className="card">
                <h3>Recent Quotes</h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {quotes.slice(0, 5).map((quote) => (
                    <li
                      key={quote.id}
                      style={{
                        padding: '12px',
                        background: '#f9fafb',
                        borderRadius: '6px',
                        fontSize: '0.9rem',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleViewQuote(quote)}
                    >
                      <strong>#{quote.quoteNumber}</strong> {quote.reference} • {quote.client?.name ?? 'No client'} •{' '}
                      <strong>{formatAmount(quote.total)}</strong>
                    </li>
                  ))}
                </ul>
              </div>
            )}
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
    </div>
  );
}
export default App;
