import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import Loading from '../components/Loading';
import { downloadFileProxy } from '../utils/downloadHelper';

export default function PublicShare() {
  const { type, token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [passwordRequired, setPasswordRequired] = useState(false);

  const fetchShare = async (pw = null) => {
    try {
      setLoading(true);
      setError('');
      const payload = pw ? { password: pw } : {};

      const endpoint = type
        ? `/share/public/${type}/${token}`
        : `/share/public/${token}`;

      const res = await api.post(endpoint, payload);
      setData(res.data.data);
      setPasswordRequired(false);
    } catch (err) {
      if (err.response?.status === 401 && err.response?.data?.message?.includes('Password required')) {
        setPasswordRequired(true);
      } else {
        setError(err.response?.data?.message || 'Access denied. This link may be invalid or no longer available.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShare();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, token]);

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    fetchShare(password);
  };

  const handleDownload = async (fileData) => {
    if (data.type === 'folder') {
      await downloadFileProxy(`/share/public/folders/${token}/files/${fileData.id}/download`, fileData.name);
    } else {
      await downloadFileProxy(`/share/public/files/${token}/download`, fileData.name);
    }
  };

  if (loading) return <Loading />;

  if (error) {
    return (
      <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="card shadow-sm border-0 p-5 text-center">
          <h4 className="text-danger mb-3">Access Denied</h4>
          <p className="text-muted">{error}</p>
        </div>
      </div>
    );
  }

  if (passwordRequired) {
    return (
      <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="card shadow-sm border-0 p-5" style={{ maxWidth: '400px', width: '100%' }}>
          <h4 className="fw-bold mb-3 text-center">Password Protected</h4>
          <p className="text-muted text-center mb-4">This shared item requires a password.</p>
          <form onSubmit={handlePasswordSubmit}>
            <input
              type="password"
              className="form-control mb-3"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-primary w-100">Unlock</button>
          </form>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const isFile = data.type === 'file';

  return (
    <div className="container-fluid min-vh-100 bg-light p-4">
      <div className="max-w-7xl mx-auto">
        <div className="card shadow-sm border-0 p-4 mb-4">
          <h3 className="fw-bold">Shared {isFile ? 'File' : 'Folder'}</h3>

          {isFile ? (
            <div className="mt-4">
              <h5>{data.name}</h5>
              <p className="text-muted">Size: {data.sizeBytes} bytes</p>
              {data.allowDownload && (
                <button onClick={() => handleDownload(data)} className="btn btn-primary mt-2">
                  Download File
                </button>
              )}
            </div>
          ) : (
            <div className="mt-4">
              <h5>{data.name}</h5>
              <div className="row g-3 mt-3">
                {data.contents?.files?.map((f, index) => (
                  <div key={`${f.name}-${index}`} className="col-12 col-md-4">
                    <div className="card p-3">
                      <h6>{f.name}</h6>
                      {data.allowDownload && (
                        <button onClick={() => handleDownload(f)} className="btn btn-sm btn-outline-primary mt-2">
                          Download
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
