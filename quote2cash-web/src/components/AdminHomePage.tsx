interface Props {
  onViewUoms: () => void;
  onViewDescriptions: () => void;
  onViewUsers: () => void;
}

export default function AdminHomePage({ onViewUoms, onViewDescriptions, onViewUsers }: Props) {
  return (
    <div className="page-section">
      <div className="section-header">
        <div>
          <h2>Admin</h2>
          <p>Manage quote lookup values and user accounts.</p>
        </div>
      </div>

      <div className="cards-grid">
        <div className="card">
          <h3>Quote UOMs</h3>
          <p>Manage units of measure used in quote line items.</p>
          <button className="btn-primary" onClick={onViewUoms}>
            Manage UOMs
          </button>
        </div>
        <div className="card">
          <h3>Quote Descriptions</h3>
          <p>Manage commonly used line item descriptions.</p>
          <button className="btn-primary" onClick={onViewDescriptions}>
            Manage Descriptions
          </button>
        </div>
        <div className="card">
          <h3>Users</h3>
          <p>Manage API users and roles.</p>
          <button className="btn-primary" onClick={onViewUsers}>
            Manage Users
          </button>
        </div>
      </div>
    </div>
  );
}
