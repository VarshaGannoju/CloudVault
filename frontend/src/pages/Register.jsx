import React, { useState } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FiUser, FiMail, FiLock } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      return setError('Please fill in all fields.');
    }

    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match.');
    }

    if (formData.password.length < 6) {
      return setError('Password must be at least 6 characters.');
    }

    setLoading(true);
    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password
      });
      setSuccess('Registration successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-container">
        <div className="text-center mb-4">
          <div className="bg-primary text-white d-inline-flex rounded p-3 mb-3">
            <FiUser size={32} />
          </div>
          <h2 className="fw-bold">Create Account</h2>
          <p className="text-muted-custom">Join CloudVault to store your files securely.</p>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label className="fw-medium">Full Name</Form.Label>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0">
                <FiUser className="text-muted" />
              </span>
              <Form.Control
                type="text"
                name="name"
                className="bg-light border-start-0 ps-0"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
                disabled={loading || success}
              />
            </div>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="fw-medium">Email address</Form.Label>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0">
                <FiMail className="text-muted" />
              </span>
              <Form.Control
                type="email"
                name="email"
                className="bg-light border-start-0 ps-0"
                placeholder="name@example.com"
                value={formData.email}
                onChange={handleChange}
                disabled={loading || success}
              />
            </div>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="fw-medium">Password</Form.Label>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0">
                <FiLock className="text-muted" />
              </span>
              <Form.Control
                type="password"
                name="password"
                className="bg-light border-start-0 ps-0"
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
                disabled={loading || success}
              />
            </div>
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label className="fw-medium">Confirm Password</Form.Label>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0">
                <FiLock className="text-muted" />
              </span>
              <Form.Control
                type="password"
                name="confirmPassword"
                className="bg-light border-start-0 ps-0"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={loading || success}
              />
            </div>
          </Form.Group>

          <Button variant="primary" type="submit" className="w-100 py-2 mb-3 fw-medium shadow-sm" disabled={loading || success}>
            {loading ? 'Creating account...' : 'Sign Up'}
          </Button>

          <div className="text-center">
            <span className="text-muted-custom">Already have an account? </span>
            <Link to="/login" className="text-decoration-none fw-medium">Sign in</Link>
          </div>
        </Form>
      </div>
    </div>
  );
}
