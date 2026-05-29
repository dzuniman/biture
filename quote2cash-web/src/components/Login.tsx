import React, { useState } from 'react';
import { login as apiLogin } from '../api';
import { useAuth } from '../AuthContext';
import logo from '../assets/logo.png';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await apiLogin({ username, password });
      login(response.token, response.user);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container" style={{ color: '#000' }}>
      <form onSubmit={handleSubmit} className="login-form">
        <img src={logo} alt="Logo" style={{ display: 'block', margin: '0 auto 20px', height: '60px', width: 'auto' }} />
        <h2>Login to EPEC Solution</h2>
        {error && <p className="login-error">{error}</p>}
        <div className="login-field">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="login-field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button 
          type="submit" 
          disabled={loading}
          className="login-button"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
};