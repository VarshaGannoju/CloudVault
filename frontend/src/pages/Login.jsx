import React, { useState } from 'react';
import { Form, Button, Spinner } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      return 'Email is required';
    }
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    return '';
  };

  const validatePassword = (password) => {
    if (!password) {
      return 'Password is required';
    }
    if (password.length < 1) {
      return 'Password is required';
    }
    return '';
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    setEmailError(validateEmail(value));
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    setPasswordError(validatePassword(value));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields
    const emailValidationError = validateEmail(email);
    const passwordValidationError = validatePassword(password);
    
    setEmailError(emailValidationError);
    setPasswordError(passwordValidationError);
    
    if (emailValidationError || passwordValidationError) {
      toast.error('Please fix the validation errors');
      return;
    }

    setLoading(true);
    try {
      await login({ email, password });
      toast.success('Login successful!');
      navigate(from, { replace: true });
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to login. Please check your credentials.';
      
      // Show appropriate toast based on error type
      if (errorMessage.toLowerCase().includes('invalid') || errorMessage.toLowerCase().includes('credential')) {
        toast.error('❌ Incorrect password. Please try again.');
      } else if (errorMessage.toLowerCase().includes('not found') || errorMessage.toLowerCase().includes('no account')) {
        toast.error('❌ No account found with this email.');
      } else if (errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('connect')) {
        toast.error('⚠ Unable to connect to the server.');
      } else {
        toast.error('⚠ Something went wrong. Please try again.');
      }
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

        <Form onSubmit={handleSubmit} noValidate>
          <Form.Group className="mb-3">
            <Form.Label htmlFor="email" className="fw-medium">Email address</Form.Label>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0">
                <FiMail className="text-muted" />
              </span>
              <Form.Control
                id="email"
                type="email"
                className="bg-light border-start-0 ps-0"
                placeholder="name@example.com"
                value={email}
                onChange={handleEmailChange}
                disabled={loading}
                isInvalid={!!emailError}
                aria-invalid={!!emailError}
                aria-describedby="email-error"
              />
            </div>
            {emailError && (
              <Form.Text id="email-error" className="text-danger mt-1" style={{ fontSize: '12px' }}>
                {emailError}
              </Form.Text>
            )}
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label htmlFor="password" className="fw-medium">Password</Form.Label>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0">
                <FiLock className="text-muted" />
              </span>
              <Form.Control
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="bg-light border-start-0 ps-0"
                placeholder="Enter your password"
                value={password}
                onChange={handlePasswordChange}
                disabled={loading}
                isInvalid={!!passwordError}
                aria-invalid={!!passwordError}
                aria-describedby="password-error"
              />
              <button
                type="button"
                className="btn btn-outline-secondary border-start-0"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            {passwordError && (
              <Form.Text id="password-error" className="text-danger mt-1" style={{ fontSize: '12px' }}>
                {passwordError}
              </Form.Text>
            )}
          </Form.Group>

          <Button 
            variant="primary" 
            type="submit" 
            className="w-100 py-2 mb-3 fw-medium shadow-sm" 
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
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
