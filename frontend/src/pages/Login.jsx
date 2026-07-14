import React, { useState } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiMail, FiLock } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      return setError('Please enter both email and password.');
    }

    setLoading(true);
    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-container">
        <div className="text-center mb-4">
          <div className="bg-primary text-white d-inline-flex rounded p-3 mb-3">
            <FiLock size={32} />
          </div>
          <h2 className="fw-bold">Welcome Back</h2>
          <p className="text-muted-custom">Sign in to your CloudVault account</p>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label className="fw-medium">Email address</Form.Label>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0">
                <FiMail className="text-muted" />
              </span>
              <Form.Control
                type="email"
                className="bg-light border-start-0 ps-0"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label className="fw-medium d-flex justify-content-between">
              Password
              {/* <Link to="/forgot-password" className="text-decoration-none small">Forgot Password?</Link> */}
            </Form.Label>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0">
                <FiLock className="text-muted" />
              </span>
              <Form.Control
                type="password"
                className="bg-light border-start-0 ps-0"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
          </Form.Group>

          <Button variant="primary" type="submit" className="w-100 py-2 mb-3 fw-medium shadow-sm" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>

          <div className="text-center">
            <span className="text-muted-custom">Don&apos;t have an account? </span>
            <Link to="/register" className="text-decoration-none fw-medium">Create one</Link>
          </div>
        </Form>
      </div>
    </div>
  );
}
