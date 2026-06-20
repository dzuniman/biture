import type { JobCard } from '../types';

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
            <th>Job Card #</th>
            <th>Quote #</th>
            <th>Reference</th>
            <th>Description</th>
            <th>Client</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {jobCards.map((job) => (
            <tr key={job.id}>
              <td>{job.jobCardNumber}</td>
              <td>{job.quoteNumber}</td>
              <td>{job.reference || '—'}</td>
              <td>{job.description || '—'}</td>
              <td>{job.client?.name ?? '—'}</td>
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
