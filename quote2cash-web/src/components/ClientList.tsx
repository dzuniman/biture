import type { Client } from '../types';

interface Props {
  clients: Client[];
}

export default function ClientList({ clients }: Props) {
  return (
    <div className="card">
      <h2>Clients</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Account</th>
            <th>Industry</th>
            <th>Contact</th>
            <th>Email</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((client) => (
            <tr key={client.id}>
              <td>{client.name}</td>
              <td>{client.accountNumber ?? '—'}</td>
              <td>{client.industry ?? '—'}</td>
              <td>{client.contactName ?? '—'}</td>
              <td>{client.email ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
