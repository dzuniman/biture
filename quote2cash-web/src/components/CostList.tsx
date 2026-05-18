import type { Cost } from '../types';

interface Props {
  costs: Cost[];
}

export default function CostList({ costs }: Props) {
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
