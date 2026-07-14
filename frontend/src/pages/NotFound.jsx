import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="container py-5 text-center">
      <h1 className="display-4 fw-bold">404</h1>
      <p className="text-secondary mb-4">This page doesn&apos;t exist.</p>
      <Link to="/" className="btn btn-primary rounded-pill px-4">
        Back home
      </Link>
    </div>
  );
}
