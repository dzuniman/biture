import type { Statement } from '../types';

interface Props {
  statements: Statement[];
}

export default function StatementList({ statements }: Props) {
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
          </tr>
        </thead>
        <tbody>
          {statements.map((statement) => (
            <tr key={statement.id}>
              <td>{statement.period}</td>
              <td>{statement.client?.name ?? '—'}</td>
              <td>{statement.balance.toFixed(2)}</td>
              <td>{(statement.invoiceTotal ?? 0).toFixed(2)}</td>
              <td>{(statement.unpaidAmount ?? 0).toFixed(2)}</td>
              <td>{statement.status}</td>
              <td>{statement.createdAt ? new Date(statement.createdAt).toLocaleDateString() : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
