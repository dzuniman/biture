import type { Cost } from '../types';

interface Props {
  costs: Cost[];
  onEdit: (cost: Cost) => void;
  onDelete: (id: string) => Promise<void>;
}

export default function CostList({ costs, onEdit, onDelete }: Props) {
  return (
    <div className="card">
      <h2>Costs</h2>
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th>Client</th>
            <th>Job card</th>
            <th>Category</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Incurred at</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {costs.map((cost) => (
            <tr key={cost.id}>
              <td>{cost.description}</td>
              <td>{cost.client?.name ?? '—'}</td>
              <td>{cost.jobCard?.jobNumber ?? '—'}</td>
              <td>{cost.category}</td>
              <td>{cost.amount.toFixed(2)}</td>
              <td>{cost.status}</td>
              <td>{cost.incurredAt ? new Date(cost.incurredAt).toLocaleDateString() : '—'}</td>
              <td className="actions-row">
                <button type="button" onClick={() => onEdit(cost)}>
                  Edit
                </button>
                <button type="button" className="danger" onClick={() => onDelete(cost.id)}>
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
