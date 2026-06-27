import React, { useState } from 'react';
import { StatementForm } from './StatementForm';
import StatementList from './StatementList';
import { StatementViewPage } from './StatementViewPage';
import type { Statement, Invoice, Client, CreditNote } from '../types';
import { getStatement } from '../api';

export const Statements: React.FC<{
  invoices: Invoice[];
  clients: Client[];
  creditNotes: CreditNote[];
  statements: Statement[];
  onRefresh: () => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}> = ({ invoices, clients, creditNotes, statements, onRefresh, onDelete }) => {
  const [view, setView] = useState<'list' | 'manage' | 'view'>('list');
  const [editingStatement, setEditingStatement] = useState<Statement | null>(null);
  const [viewingStatement, setViewingStatement] = useState<Statement | null>(null);

  const handleEdit = (statement: Statement) => {
    setEditingStatement(statement);
    setView('manage');
  };

  const handleView = async (statement: Statement) => {
    try {
      const fullStatement = await getStatement(statement.id);
      setViewingStatement(fullStatement);
    } catch (error) {
      console.error("Failed to fetch full statement:", error);
      setViewingStatement(statement);
    }
    setView('view');
  };

  const handleCreate = () => {
    setEditingStatement(null);
    setView('manage');
  };

  return (
    <div className="page-section">
      <div className="section-header">
        <div>
          <h2>Statements / Payments</h2>
          <p>Track customer payments and account balances.</p>
        </div>
        {view === 'list' ? (
          <button onClick={handleCreate} className="btn-primary-lg">+ New Statement</button>
        ) : (
          <button onClick={() => setView('list')} className="btn-secondary">← Back to List</button>
        )}
      </div>

      {view === 'list' ? (
        <StatementList
          statements={statements}
          invoices={invoices}
          onEdit={handleEdit}
          onView={handleView}
          onDelete={onDelete}
        />
      ) : view === 'manage' ? (
        <StatementForm
          invoices={invoices}
          clients={clients}
          creditNotes={creditNotes}
          initialData={editingStatement}
          onSuccess={() => { setView('list'); onRefresh(); }}
          onCancel={() => setView('list')}
        />
      ) : (
        <StatementViewPage
          statement={viewingStatement!}
          invoices={invoices}
          creditNotes={creditNotes}
          onEdit={() => handleEdit(viewingStatement!)}
          onBack={() => setView('list')}
        />
      )}
    </div>
  );
};