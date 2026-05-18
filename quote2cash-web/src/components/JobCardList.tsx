import type { JobCard } from '../types';

interface Props {
  jobCards: JobCard[];
}

export default function JobCardList({ jobCards }: Props) {
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
            <th>Start</th>
            <th>End</th>
          </tr>
        </thead>
        <tbody>
          {jobCards.map((job) => (
            <tr key={job.id}>
              <td>{job.jobNumber}</td>
              <td>{job.client?.name ?? '—'}</td>
              <td>{job.description}</td>
              <td>{job.status}</td>
              <td>{job.totalCost.toFixed(2)}</td>
              <td>{job.startDate ? new Date(job.startDate).toLocaleDateString() : '—'}</td>
              <td>{job.endDate ? new Date(job.endDate).toLocaleDateString() : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
