import type { DeliveryNote } from '../types';

interface Props {
  deliveryNotes: DeliveryNote[];
  onEdit: (deliveryNote: DeliveryNote) => void;
  onDelete: (id: string) => Promise<void>;
}

export default function DeliveryNoteList({ deliveryNotes, onEdit, onDelete }: Props) {
  return (
    <div className="card">
      <h2>Delivery Notes</h2>
      <table>
        <thead>
          <tr>
            <th>Delivery Note #</th>
            <th>Quote #</th>
            <th>Reference</th>
            <th>Description</th>
            <th>Client</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {deliveryNotes.map((dn) => (
            <tr key={dn.id}>
              <td>{dn.deliveryNoteNumber}</td>
              <td>{dn.quoteNumber}</td>
              <td>{dn.reference || '—'}</td>
              <td>{dn.description || '—'}</td>
              <td>{dn.client?.name ?? '—'}</td>
              <td className="actions-row">
                <button type="button" onClick={() => onEdit(dn)}>
                  Edit
                </button>
                <button type="button" className="danger" onClick={() => onDelete(dn.id)}>
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
