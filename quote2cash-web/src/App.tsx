import { useEffect, useState } from 'react';
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
import QuoteList from './components/QuoteList';
import QuoteForm from './components/QuoteForm';
import ClientForm from './components/ClientForm';
import ClientList from './components/ClientList';
import QuoteReport from './components/QuoteReport';

const sections = ['dashboard', 'clients', 'quotes'] as const;

type Section = (typeof sections)[number];

function App() {
  const [selectedSection, setSelectedSection] = useState<Section>('dashboard');
  const [clients, setClients] = useState<Client[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [selectedReportQuote, setSelectedReportQuote] = useState<Quote | null>(null);
  const [quoteClientId, setQuoteClientId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddingClientForQuote, setIsAddingClientForQuote] = useState(false);

  const totals = {
    clients: clients.length,
    quotes: quotes.length,
    quoteValue: quotes.reduce((sum, quote) => sum + quote.total, 0)
  };

  const clearEditing = () => {
    setEditingClient(null);
    setEditingQuote(null);
    setSelectedReportQuote(null);
    setIsAddingClientForQuote(false);
    setQuoteClientId('');
  };

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

  const handleSaveClient = async (payload: ClientCreateRequest) => {
    try {
      setError(null);
      setIsLoading(true);
      const client = await createClient(payload);
      if (isAddingClientForQuote) {
        setQuoteClientId(client.id);
        setIsAddingClientForQuote(false);
        setSelectedSection('quotes');
      }
      clearEditing();
      await loadAll();
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
      clearEditing();
      await loadAll();
    } catch {
      setError('Unable to update client.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveQuote = async (payload: QuoteCreateRequest) => {
    try {
      setError(null);
      setIsLoading(true);
      if (editingQuote) {
        await updateQuote(editingQuote.id, payload);
      } else {
        await createQuote(payload);
      }
      clearEditing();
      await loadAll();
    } catch {
      setError('Unable to save quote.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClient = async (id: string) => {
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
  };

  const handleDeleteQuote = async (id: string) => {
    try {
      setError(null);
      setIsLoading(true);
      await deleteQuote(id);
      if (selectedReportQuote?.id === id) {
        setSelectedReportQuote(null);
      }
      await loadAll();
    } catch {
      setError('Unable to delete quote.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewQuote = async (id: string) => {
    try {
      setError(null);
      setIsLoading(true);
      const quote = await getQuote(id);
      setSelectedReportQuote(quote);
      setSelectedSection('quotes');
    } catch {
      setError('Unable to load quote report.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditQuote = async (id: string) => {
    try {
      setError(null);
      setIsLoading(true);
      const quote = await getQuote(id);
      setEditingQuote(quote);
      setSelectedReportQuote(null);
      setSelectedSection('quotes');
    } catch {
      setError('Unable to load quote for editing.');
    } finally {
      setIsLoading(false);
    }
  };

  const sectionLabel = selectedSection === 'dashboard' ? 'Dashboard' : selectedSection === 'clients' ? 'Clients' : 'Quotes';

  return (
    <div className="app-shell">
      <header className="hero">
        <div>
          <h1>EPEC Solution Quote To Cash</h1>
          <p>Manage CLient Profiles, Quotes and Reporting.</p>
        </div>
      </header>

      <div className="tabs">
        {sections.map((section) => (
          <button
            key={section}
            className={selectedSection === section ? 'tab-button active' : 'tab-button'}
            onClick={() => {
              setSelectedSection(section);
              clearEditing();
            }}
          >
            {section.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="section-header">
        <div>
          <h2>{sectionLabel}</h2>
          <p>Design-driven client and quote workflows with live report generation.</p>
        </div>
        <button className="refresh-button" onClick={loadAll} disabled={isLoading}>
          Refresh data
        </button>
      </div>

      {error && <div className="status error">{error}</div>}
      {isLoading && <div className="status">Loading…</div>}

      {!isLoading && selectedSection === 'dashboard' && (
        <>
          <div className="dashboard-grid">
            <div className="summary-card">
              <span>Clients</span>
              <strong>{totals.clients}</strong>
            </div>
            <div className="summary-card">
              <span>Quotes</span>
              <strong>{totals.quotes}</strong>
            </div>
            <div className="summary-card highlight">
              <span>Total quote value</span>
              <strong>{totals.quoteValue.toFixed(2)}</strong>
            </div>
          </div>

          <div className="home-panels">
            <div className="card">
              <h3>Recent clients</h3>
              <ul className="summary-list">
                {clients.slice(0, 4).map((client) => (
                  <li key={client.id}>{client.name}</li>
                ))}
              </ul>
            </div>
            <div className="card">
              <h3>Recent quotes</h3>
              <ul className="summary-list">
                {quotes.slice(0, 4).map((quote) => (
                  <li key={quote.id}>
                    <strong>{quote.reference}</strong> • {quote.client?.name ?? 'No client'} • {quote.total.toFixed(2)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}

      {!isLoading && selectedSection === 'clients' && (
        <>
          <ClientForm
            initialData={editingClient ?? undefined}
            onSubmit={editingClient ? (payload) => handleUpdateClient(editingClient.id, payload) : handleSaveClient}
            onCancel={clearEditing}
          />
          <ClientList
            clients={clients}
            onEdit={(client) => {
              setEditingClient(client);
              setSelectedSection('clients');
            }}
            onDelete={handleDeleteClient}
          />
        </>
      )}

      {!isLoading && selectedSection === 'quotes' && (
        <>
          <div className="section-actions">
            <button className="secondary" type="button" onClick={() => {
              clearEditing();
              setIsAddingClientForQuote(false);
            }}>
              New quote
            </button>
            <button className="secondary" type="button" onClick={() => {
              clearEditing();
              setIsAddingClientForQuote(true);
            }}>
              New client
            </button>
          </div>

          {isAddingClientForQuote && (
            <ClientForm
              onSubmit={handleSaveClient}
              onCancel={() => setIsAddingClientForQuote(false)}
            />
          )}
          <QuoteForm
            clients={clients}
            initialData={editingQuote ?? undefined}
            selectedClientId={quoteClientId}
            onSelectClientId={(id) => setQuoteClientId(id)}
            onSubmit={handleSaveQuote}
            onCancel={clearEditing}
            onRequestNewClient={() => setIsAddingClientForQuote(true)}
          />
          <QuoteList
            quotes={quotes}
            onEdit={(quote) => handleEditQuote(quote.id)}
            onDelete={handleDeleteQuote}
            onView={handleViewQuote}
          />
          {selectedReportQuote && (
            <QuoteReport
              quote={selectedReportQuote}
              onClose={() => setSelectedReportQuote(null)}
            />
          )}
        </>
      )}
    </div>
  );
}

export default App;
