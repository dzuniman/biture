import { useMemo, useState, type FormEvent } from 'react';
import { createUser, deleteUser, updateUser } from '../api';
import type { User, UserCreateRequest, UserUpdateRequest } from '../types';

interface Props {
  users: User[];
  onBack: () => void;
  onRefresh: () => Promise<void>;
}

export default function UserManagementPage({ users, onBack, onRefresh }: Props) {
  const [mode, setMode] = useState<'list' | 'manage'>('list');
  const [current, setCurrent] = useState<User | null>(null);
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('User');
  const [password, setPassword] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;
    return users.filter((item) =>
      (item.username?.toLowerCase() || '').includes(term) ||
      (item.role?.toLowerCase() || '').includes(term)
    );
  }, [users, search]);

  const startCreate = () => {
    setMode('manage');
    setCurrent(null);
    setUsername('');
    setRole('User');
    setPassword('');
    setError(null);
  };

  const startEdit = (user: User) => {
    setMode('manage');
    setCurrent(user);
    setUsername(user.username);
    setRole(user.role);
    setPassword('');
    setError(null);
  };

  const cancel = () => {
    setMode('list');
    setCurrent(null);
    setUsername('');
    setRole('User');
    setPassword('');
    setError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!username.trim() || !role.trim()) {
      setError('Username and role are required.');
      return;
    }

    if (!current && !password.trim()) {
      setError('Password is required when creating a new user.');
      return;
    }

    const payload: UserCreateRequest | UserUpdateRequest = current
      ? { username: username.trim(), role: role.trim(), password: password.trim() || undefined }
      : { username: username.trim(), password: password.trim(), role: role.trim() };

    setIsSaving(true);
    setError(null);

    try {
      if (current) {
        await updateUser(current.id, payload as UserUpdateRequest);
      } else {
        await createUser(payload as UserCreateRequest);
      }
      await onRefresh();
      cancel();
    } catch (err: any) {
      const data = err?.response?.data;
      const detail = data?.message || (data?.errors ? Object.values(data.errors).flat().join(' ') : null);
      setError(detail ?? 'Unable to save user.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this user? This cannot be undone.')) return;
    try {
      await deleteUser(id);
      await onRefresh();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Unable to delete user.');
    }
  };

  return (
    <div className="page-section">
      <div className="section-header">
        <div>
          <h2>User Management</h2>
          <p>Create, edit, or remove application users.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={onBack} className="btn-secondary">
            ← Back
          </button>
          {mode === 'list' && (
            <button onClick={startCreate} className="btn-primary">
              + New User
            </button>
          )}
        </div>
      </div>

      {mode === 'list' ? (
        <>
          <div className="table-toolbar">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search users..."
              className="search-input"
            />
          </div>
          <div className="table-card">
            <table>
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Role</th>
                  <th className="actions-column">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr style={{ backgroundColor: 'hsl(240, 21%, 18%)', color: '#FFFFFF' }}>
                    <td colSpan={3} className="empty-row">
                      No users found. Click "+ New User" to get started.
                    </td>
                  </tr>
                ) : (
                  filtered.map((user) => (
                    <tr key={user.id} style={{ backgroundColor: 'hsl(240, 21%, 18%)', color: '#FFFFFF' }} className="table-row-dark-hover">
                      <td>{user.username}</td>
                      <td>{user.role}</td>
                      <td className="actions-column">
                        <button className="btn-secondary small" onClick={() => startEdit(user)}>
                          Edit
                        </button>
                        <button className="btn-danger small" onClick={() => handleDelete(user.id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="management-container">
          <form onSubmit={handleSubmit} className="simple-form">
            <label>
              Username
              <input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Enter username"
                autoFocus
              />
            </label>
            <label>
              Role
              <select value={role} onChange={(event) => setRole(event.target.value)}>
                <option value="Admin">Admin</option>
                <option value="User">User</option>
              </select>
            </label>
            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={current ? 'Leave blank to keep current password' : 'Enter password'}
              />
            </label>
            {error && <div className="form-error">{error}</div>}
            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={isSaving}>
                {isSaving ? 'Saving…' : current ? 'Update User' : 'Create User'}
              </button>
              <button type="button" className="btn-secondary" onClick={cancel} disabled={isSaving}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
