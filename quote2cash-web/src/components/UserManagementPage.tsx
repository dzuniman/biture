import React, { useMemo, useState, type FormEvent } from 'react';
import { createUser, deleteUser, updateUser } from '../api';
import type { User, UserCreateRequest, UserUpdateRequest } from '../types';
import DataGrid, { ColumnDef } from './DataGrid';
import ActionMenu from './ActionMenu';

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
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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

  const columns: ColumnDef<User>[] = useMemo(
    () => [
      { key: 'username', label: 'Username', type: 'text' },
      { key: 'role', label: 'Role', type: 'select', selectOptions: ['Admin', 'Manager', 'User'] }
    ],
    []
  );

  const renderActions = (user: User) => (
    <ActionMenu
      items={[
        { label: 'Edit', icon: '✏️', onClick: () => startEdit(user) },
        { label: 'Delete', icon: '🗑️', onClick: () => handleDelete(user.id), variant: 'danger' }
      ]}
    />
  );

  return (
    <div className="page-section">
      <div className="section-header">
        <div>
          <h2>User Management</h2>
          <p>Create, edit, or remove application users</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {mode === 'list' && (
            <button onClick={startCreate} className="btn-primary">
              + New User
            </button>
          )}
        </div>
      </div>

      {error && (
        <div
          style={{
            background: '#fee2e2',
            color: '#991b1b',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '16px',
            border: '1px solid #fecaca'
          }}
        >
          {error}
          <button
            onClick={() => setError(null)}
            style={{
              marginLeft: '12px',
              background: 'none',
              border: 'none',
              color: '#991b1b',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            ✕
          </button>
        </div>
      )}

      {mode === 'list' ? (
        <DataGrid
          columns={columns}
          data={users}
          renderActions={renderActions}
          searchPlaceholder="Search users..."
          emptyMessage="No users found. Click '+ New User' to create one."
        />
      ) : (
        <div className="form-card" style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', maxWidth: '500px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div className="form-group">
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              >
                <option value="Admin">Admin</option>
                <option value="Manager">Manager</option>
                <option value="User">User</option>
              </select>
            </div>

            <div className="form-group">
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>
                {current ? 'New Password (leave blank to keep current)' : 'Password'}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={!current}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
              <button type="button" onClick={cancel} className="btn-secondary" disabled={isSaving}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={isSaving}>
                {isSaving ? 'Saving...' : current ? 'Update User' : 'Create User'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
