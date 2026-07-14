import React from 'react';
import { Spinner } from 'react-bootstrap';

export default function Loading({ message = 'Loading...', fullScreen = false }) {
  if (fullScreen) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center" style={{ minHeight: '100vh', backgroundColor: 'var(--bg-color)' }}>
        <Spinner animation="border" variant="primary" role="status" className="mb-3" />
        <span className="text-muted-custom fw-medium">{message}</span>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column justify-content-center align-items-center p-5">
      <Spinner animation="border" variant="primary" role="status" className="mb-3" />
      <span className="text-muted-custom fw-medium">{message}</span>
    </div>
  );
}
