import { useEffect, useState } from 'react';
import {
  createClient,
  createQuote,
  createCost,
  createInvoice,
  createJobCard,
  createStatement,
  getClients,
  getCosts,
  getInvoices,
  getJobCards,
  getQuotes,
  getStatements
} from './api';
import type {
  Client,
  ClientCreateRequest,
  Quote,
  QuoteCreateRequest,
  JobCard,
  JobCardCreateRequest,
  Cost,
  CostCreateRequest,
  Invoice,
  InvoiceCreateRequest,
  Statement,
  StatementCreateRequest
} from './types';
import QuoteList from './components/QuoteList';
import QuoteForm from './components/QuoteForm';
import ClientForm from './components/ClientForm';
import ClientList from './components/ClientList';
import JobCardList from './components/JobCardList';
import JobCardForm from './components/JobCardForm';
import CostList from './components/CostList';
import CostForm from './components/CostForm';
import InvoiceList from './components/InvoiceList';
import InvoiceForm from './components/InvoiceForm';
import StatementList from './components/StatementList';
import StatementForm from './components/StatementForm';

const sections = ['clients', 'quotes', 'jobcards', 'costs', 'invoices', 'statements'] as const;

type Section = (typeof sections)[number];

function App() {
  const [selectedSection, setSelectedSection] = useState<Section>('quotes');
  const [clients, setClients] = useState<Client[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [jobCards, setJobCards] = useState<JobCard[]>([]);
  const [costs, setCosts] = useState<Cost[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [statements, setStatements] = useState<Statement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAll = async () => {
    try {
      setError(null);
      const [clientsData, quotesData, jobsData, costsData, invoicesData, statementsData] = await Promise.all([
        getClients(),
        getQuotes(),
        getJobCards(),
        getCosts(),
        getInvoices(),
        getStatements()
      ]);

      setClients(clientsData);
      setQuotes(quotesData);
      setJobCards(jobsData);
      setCosts(costsData);
      setInvoices(invoicesData);
      setStatements(statementsData);
    } catch (err) {
      setError('Unable to load workbook data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const refresh = async () => {
    setIsLoading(true);
    await loadAll();
  };

  const handleCreateClient = async (payload: ClientCreateRequest) => {
    try {
      setError(null);
      const record = await createClient(payload);
      setClients((existing) => [record, ...existing]);
    } catch {
      setError('Unable to save client.');
    }
  };

  const handleCreateQuote = async (payload: QuoteCreateRequest) => {
    try {
      setError(null);
      const record = await createQuote(payload);
      setQuotes((existing) => [record, ...existing]);
    } catch {
      setError('Unable to save quote.');
    }
  };

  const handleCreateJobCard = async (payload: JobCardCreateRequest) => {
    try {
      setError(null);
      const record = await createJobCard(payload);
      setJobCards((existing) => [record, ...existing]);
    } catch {
      setError('Unable to save job card.');
    }
  };

  const handleCreateCost = async (payload: CostCreateRequest) => {
    try {
      setError(null);
      const record = await createCost(payload);
      setCosts((existing) => [record, ...existing]);
    } catch {
      setError('Unable to save cost.');
    }
  };

  const handleCreateInvoice = async (payload: InvoiceCreateRequest) => {
    try {
      setError(null);
      const record = await createInvoice(payload);
      setInvoices((existing) => [record, ...existing]);
    } catch {
      setError('Unable to save invoice.');
    }
  };

  const handleCreateStatement = async (payload: StatementCreateRequest) => {
    try {
      setError(null);
      const record = await createStatement(payload);
      setStatements((existing) => [record, ...existing]);
    } catch {
      setError('Unable to save statement.');
    }
  };

  return (
    <div className="app-shell">
      <header>
        <div>
          <h1>EPEC Solution Quote2Cash</h1>
          <p>ERP for Quotes and Costs</p>
        </div>
      </header>

      <div className="tabs">
        {sections.map((section) => (
          <button
            key={section}
            className={selectedSection === section ? 'tab-button active' : 'tab-button'}
            onClick={() => setSelectedSection(section)}
          >
            {section.toUpperCase()}
          </button>
        ))}
      </div>

      {error && <div className="status error">{error}</div>}
      {isLoading && <div className="status">Loading workbook data…</div>}

      {!isLoading && selectedSection === 'clients' && (
        <>
          <ClientForm onSubmit={handleCreateClient} />
          <ClientList clients={clients} />
        </>
      )}

      {!isLoading && selectedSection === 'quotes' && (
        <>
          <QuoteForm onSubmit={handleCreateQuote} clients={clients} />
          <QuoteList quotes={quotes} />
        </>
      )}

      {!isLoading && selectedSection === 'jobcards' && (
        <>
          <JobCardForm onSubmit={handleCreateJobCard} clients={clients} />
          <JobCardList jobCards={jobCards} />
        </>
      )}

      {!isLoading && selectedSection === 'costs' && (
        <>
          <CostForm onSubmit={handleCreateCost} clients={clients} jobCards={jobCards} />
          <CostList costs={costs} />
        </>
      )}

      {!isLoading && selectedSection === 'invoices' && (
        <>
          <InvoiceForm onSubmit={handleCreateInvoice} clients={clients} />
          <InvoiceList invoices={invoices} />
        </>
      )}

      {!isLoading && selectedSection === 'statements' && (
        <>
          <StatementForm onSubmit={handleCreateStatement} clients={clients} />
          <StatementList statements={statements} />
        </>
      )}
    </div>
  );
}

export default App;
