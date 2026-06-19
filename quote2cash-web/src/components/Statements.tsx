import React, { useEffect, useState } from 'react';
import { StatementForm } from './StatementForm';
import StatementList from './StatementList';
import { StatementViewPage } from './StatementViewPage';
import type { Statement, Invoice, Client } from '../types';
import { deleteStatement } from '../api';

export const Statements: React.FC<{ invoices: Invoice[], clients: Client[], statements: Statement[], onRefresh: () => Promise<void>, onDelete: (id: string) => Promise<void> }> = ({ invoices, clients, statements, onRefresh, onDelete }) => {
  const [view, setView] = useState<'list' | 'manage' | 'view'>('list');
  const [editingStatement, setEditingStatement] = useState<Statement | null>(null);
  const [viewingStatement, setViewingStatement] = useState<Statement | null>(null);

  const handleEdit = (statement: Statement) => {
    setEditingStatement(statement);
    setView('manage');
  };

  const handleView = (statement: Statement) => {
    setViewingStatement(statement);
    setView('view');
  };

  const handleCreate = () => {
    setEditingStatement(null);
    setView('manage'); // This should be 'manage' for creating new statements
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
          initialData={editingStatement}
          onSuccess={() => { setView('list'); onRefresh(); }}
          onCancel={() => setView('list')} 
        />
      ) : (
        <StatementViewPage 
          statement={viewingStatement!} 
          invoices={invoices}
          onEdit={() => handleEdit(viewingStatement!)}
          onBack={() => setView('list')} 
        />
      )}
    </div>
  );
};