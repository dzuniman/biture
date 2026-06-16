import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { StatementForm } from './StatementForm';
import StatementList from './StatementList';
import { StatementViewPage } from './StatementViewPage';
import type { Statement, Invoice, Client } from '../types';

export const Statements: React.FC<{ invoices: Invoice[], clients: Client[] }> = ({ invoices, clients }) => {
  const [statements, setStatements] = useState<Statement[]>([]);
  const [view, setView] = useState<'list' | 'manage' | 'view'>('list');
  const [editingStatement, setEditingStatement] = useState<Statement | null>(null);
  const [viewingStatement, setViewingStatement] = useState<Statement | null>(null);

  const fetchStatements = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/statements', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStatements(response.data);
    } catch (err) {
      console.error('Failed to fetch statements:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this payment record?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/statements/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchStatements();
    } catch (err) {
      alert('Failed to delete statement.');
    }
  };

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
    setView('manage');
  };

  useEffect(() => {
    fetchStatements();
  }, []);

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
          onDelete={handleDelete} 
        />
      ) : view === 'manage' ? (
        <StatementForm 
          invoices={invoices}
          clients={clients}
          initialData={editingStatement}
          onSuccess={() => { setView('list'); fetchStatements(); }} 
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