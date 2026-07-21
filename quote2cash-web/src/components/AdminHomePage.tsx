interface Props {
  onViewDescriptions: () => void;
  onViewUsers: () => void;
  onViewDocuments: () => void;
  onViewTools: () => void;
}

export default function AdminHomePage({ onViewDescriptions, onViewUsers, onViewDocuments, onViewTools }: Props) {
  return (
    <div className="page-section">
      <div className="section-header">
        <div>
          <h2>Admin</h2>
          <p>Manage quote lookup values, user accounts, and tool inventory.</p>
        </div>
      </div>

      <div className="cards-grid">
        <div className="card">
          <h3>Quote Descriptions</h3>
          <p>Manage commonly used line item lookup entries.</p>
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
        <div className="card">
          <h3>Documents</h3>
          <p>Manage business documents and templates.</p>
          <button className="btn-primary" onClick={onViewDocuments}>
            Manage Documents
          </button>
        </div>
        <div className="card">
          <h3>Tools</h3>
          <p>Manage tool inventory, values, and inspection dates.</p>
          <button className="btn-primary" onClick={onViewTools}>
            Manage Tools
          </button>
        </div>
      </div>
    </div>
  );
}

