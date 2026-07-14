import React, { useState, useEffect } from 'react';
import api from '../services/api';
import FileCard from '../components/FileCard';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import { FiShare2, FiFolder } from 'react-icons/fi';

export default function SharedWithMe() {
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchShares = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await api.get('/share/shared-with-me');
      setShares(data.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load shared items.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShares();
  }, []);

  const handleDownload = async (share) => {
    if (share.type === 'file') {
      try {
        const { data } = await api.get(`/share/files/${share.id}/download`);
        const url = data.data.url;
        
        try {
          const response = await fetch(url);
          const blob = await response.blob();
          const objUrl = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = objUrl;
          a.download = share.original_name || 'download';
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(objUrl);
        } catch (fetchErr) {
          console.error('Download failed via blob', fetchErr);
          window.open(url, '_blank');
        }
      } catch (err) {
        alert(err.response?.data?.message || 'Download failed');
      }
    }
  };

  if (loading) return <Loading />;
  if (error) return <ErrorMessage message={error} onRetry={fetchShares} />;

  return (
    <div className="container-fluid p-0 max-w-7xl mx-auto">
      <div className="mb-4">
        <h3 className="fw-bold mb-1">Shared with Me</h3>
        <p className="text-muted-custom">Items shared with you by other users</p>
      </div>

      {shares.length === 0 ? (
        <div className="text-center p-5 bg-light rounded-3 border">
          <FiShare2 size={48} className="text-muted mb-3" />
          <h5 className="fw-medium">Nothing shared with you yet</h5>
          <p className="text-muted-custom mb-0">When users share files or folders with you, they will appear here.</p>
        </div>
      ) : (
        <div className="item-grid">
          {shares.map(share => (
            share.type === 'file' ? (
              <FileCard 
                key={share.id} 
                file={{ id: share.target_id, original_name: share.target_name, mime_type: 'unknown' }} 
                onDownload={() => handleDownload(share)}
              />
            ) : (
              <div key={share.id} className="cloud-card text-center d-flex flex-column align-items-center justify-content-center p-4">
                <FiFolder size={48} className="text-warning mb-2" />
                <h6 className="text-truncate w-100 m-0">{share.target_name}</h6>
                <small className="text-muted mt-2">Shared by: {share.shared_by_name}</small>
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );
}
