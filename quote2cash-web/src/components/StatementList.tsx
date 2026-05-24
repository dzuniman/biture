import type { Statement } from '../types';
import { formatAmount } from '../../formatters';

interface Props {
  statements: Statement[];
  onEdit: (statement: Statement) => void;
  onDelete: (id: string) => Promise<void>;
}

export default function StatementList({ statements, onEdit, onDelete }: Props) {
  return (
    <div className="card">
      <h2>Statements</h2>
      <table>
        <thead>
          <tr>
            <th>Period</th>
            <th>Client</th>
            <th>Balance</th>
            <th>Invoice total</th>
            <th>Open unpaid</th>
            <th>Status</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {statements.map((statement) => (
            <tr key={statement.id}>
              <td>{statement.period}</td>
              <td>{statement.client?.name ?? '—'}</td>
              <td>{formatAmount(statement.balance)}</td>
              <td>{formatAmount(statement.invoiceTotal ?? 0)}</td>
              <td>{formatAmount(statement.unpaidAmount ?? 0)}</td>
              <td>{statement.status}</td>
              <td>{statement.createdAt ? new Date(statement.createdAt).toLocaleDateString() : '—'}</td>
              <td className="actions-row">
                <button type="button" onClick={() => onEdit(statement)}>
                  Edit
                </button>
                <button type="button" className="danger" onClick={() => onDelete(statement.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
