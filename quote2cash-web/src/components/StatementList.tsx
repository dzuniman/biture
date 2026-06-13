import type { Statement, StatementItem } from '../types';
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
            <th>Statement #</th>
            <th>Client</th>
            <th>Total Payments</th>
            <th>Item Count</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {statements.map((statement) => (
            <tr key={statement.id}>
              <td>{statement.statementNumber}</td>
              <td>{statement.client?.name ?? '—'}</td>
              <td>{formatAmount(statement.items?.reduce((sum: number, item: StatementItem) => sum + item.paymentAmount, 0) ?? 0)}</td>
              <td>{statement.items?.length ?? 0}</td>
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
