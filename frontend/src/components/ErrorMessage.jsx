import React from 'react';
import { Alert } from 'react-bootstrap';
import { FiAlertCircle } from 'react-icons/fi';

export default function ErrorMessage({ message, onRetry }) {
  if (!message) return null;

  return (
    <Alert variant="danger" className="d-flex flex-column align-items-center text-center p-4 cloud-card border-danger border-opacity-25" style={{ backgroundColor: '#fef2f2' }}>
      <FiAlertCircle size={48} className="text-danger mb-3" />
      <h5 className="alert-heading fw-bold mb-2">Something went wrong</h5>
      <p className="mb-0 text-danger">{message}</p>
      {onRetry && (
        <button className="btn btn-outline-danger mt-3 px-4" onClick={onRetry}>
          Try Again
        </button>
      )}
    </Alert>
  );
}
