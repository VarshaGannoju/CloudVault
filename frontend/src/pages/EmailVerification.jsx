import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

export default function EmailVerification() {
  const { token } = useParams();
  const [status, setStatus] = useState('verifying');
  const [error, setError] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        await api.get(`/auth/verify-email/${token}`);
        setStatus('success');
      } catch (err) {
        setStatus('error');
        setError(err.response?.data?.message || 'Verification failed. The link may be invalid or expired.');
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="card shadow-sm border-0 text-center p-5" style={{ maxWidth: '400px', width: '100%' }}>
        
        {status === 'verifying' && (
          <div>
            <div className="spinner-border text-primary mb-3" role="status"></div>
            <h4 className="fw-bold">Verifying your email...</h4>
          </div>
        )}

        {status === 'success' && (
          <div>
            <div className="text-success mb-3">
              <svg width="64" height="64" fill="currentColor" viewBox="0 0 16 16">
                <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
              </svg>
            </div>
            <h4 className="fw-bold text-success mb-3">Email Verified!</h4>
            <p className="text-muted">Your email address has been successfully verified.</p>
            <Link to="/login" className="btn btn-primary mt-3 w-100">Proceed to Login</Link>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div className="text-danger mb-3">
              <svg width="64" height="64" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
              </svg>
            </div>
            <h4 className="fw-bold text-danger mb-3">Verification Failed</h4>
            <p className="text-muted">{error}</p>
            <Link to="/login" className="btn btn-outline-primary mt-3 w-100">Back to Login</Link>
          </div>
        )}

      </div>
    </div>
  );
}
