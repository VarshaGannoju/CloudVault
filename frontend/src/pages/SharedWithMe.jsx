import React, { useState, useEffect } from 'react';
import api, { API_BASE_URL } from '../services/api';
import FileCard from '../components/FileCard';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import { FiShare2, FiFolder } from 'react-icons/fi';
import { downloadFileProxy } from '../utils/downloadHelper';
import PreviewModal from '../components/PreviewModal';

export default function SharedWithMe() {
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showRenameModal, setShowRenameModal] = useState(false);
  const [fileToRename, setFileToRename] = useState(null);
  const [newName, setNewName] = useState('');

  const [previewFile, setPreviewFile] = useState(null);

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
      await downloadFileProxy(`/share/files/${share.id}/download`, share.target_name || share.original_name);
    }
  };

  const handleRenameSubmit = async (e) => {
    e.preventDefault();
    if (!newName.trim() || !fileToRename) return;
    try {
      await api.put(`/files/${fileToRename.id}`, { name: newName.trim() });
      setShowRenameModal(false);
      fetchShares();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to rename file');
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
                file={{
                  id: share.target_id,
                  shareId: share.id,
                  original_name: share.target_name,
                  mime_type: share.mime_type || 'unknown',
                  size_bytes: share.size_bytes,
                  created_at: share.created_at,
                  cloudinary_url: share.cloudinary_url,
                  permission: share.permission,
                  shared_by_name: share.shared_by_name
                }}
                onDownload={() => handleDownload(share)}
                onPreview={(f) => setPreviewFile(f)}
                onRename={(f) => { setFileToRename(f); setNewName(f.original_name); setShowRenameModal(true); }}
              />
            ) : (
              <div key={share.id} className="cloud-card text-center d-flex flex-column align-items-center justify-content-center p-4 position-relative">
                <FiFolder size={48} className="text-warning mb-2" />
                <h6 className="text-truncate w-100 m-0">{share.target_name}</h6>
                <small className="text-muted mt-2">Shared by: {share.shared_by_name}</small>
                {share.permission !== 'owner' && (
                  <div className="position-absolute" style={{ top: '10px', left: '50%', transform: 'translateX(-50%)' }}>
                    {share.permission === 'read' ? (
                      <span className="badge bg-secondary opacity-75 rounded-pill">Viewer</span>
                    ) : (
                      <span className="badge bg-primary opacity-75 rounded-pill">Editor</span>
                    )}
                  </div>
                )}
              </div>
            )
          ))}
        </div>
      )}

      {/* Rename Modal */}
      {showRenameModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <form onSubmit={handleRenameSubmit}>
                <div className="modal-header border-0 pb-0">
                  <h5 className="modal-title fw-bold">Rename File</h5>
                  <button type="button" className="btn-close" onClick={() => setShowRenameModal(false)}></button>
                </div>
                <div className="modal-body">
                  <label className="fw-medium mb-1">New Name</label>
                  <input 
                    type="text" 
                    className="form-control"
                    value={newName} 
                    onChange={(e) => setNewName(e.target.value)} 
                    required 
                    autoFocus 
                  />
                </div>
                <div className="modal-footer border-0 pt-0">
                  <button type="button" className="btn btn-light" onClick={() => setShowRenameModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Rename</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <PreviewModal
        show={!!previewFile}
        file={previewFile}
        onClose={() => setPreviewFile(null)}
        previewUrl={previewFile ? `${API_BASE_URL}/share/files/${previewFile.shareId}/stream` : null}
      />
    </div>
  );
}