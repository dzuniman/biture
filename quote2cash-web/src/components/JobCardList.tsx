import type { JobCard } from '../types';
import { formatAmount } from '../../formatters';

interface Props {
  jobCards: JobCard[];
  onEdit: (jobCard: JobCard) => void;
  onDelete: (id: string) => Promise<void>;
}

export default function JobCardList({ jobCards, onEdit, onDelete }: Props) {
  return (
    <div className="card">
      <h2>Job Cards</h2>
      <table>
        <thead>
          <tr>
            <th>Job number</th>
            <th>Client</th>
            <th>Description</th>
            <th>Status</th>
            <th>Total cost</th>
            <th>Cost items</th>
            <th>Cost total</th>
            <th>Start</th>
            <th>End</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {jobCards.map((job) => (
            <tr key={job.id}>
              <td>{job.jobNumber}</td>
              <td>{job.client?.name ?? '—'}</td>
              <td>{job.description}</td>
              <td>{job.status}</td>
              <td>{formatAmount(job.totalCost)}</td>
              <td>{job.costCount ?? 0}</td>
              <td>{formatAmount(job.costTotal ?? 0)}</td>
              <td>{job.startDate ? new Date(job.startDate).toLocaleDateString() : '—'}</td>
              <td>{job.endDate ? new Date(job.endDate).toLocaleDateString() : '—'}</td>
              <td className="actions-row">
                <button type="button" onClick={() => onEdit(job)}>
                  Edit
                </button>
                <button type="button" className="danger" onClick={() => onDelete(job.id)}>
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
