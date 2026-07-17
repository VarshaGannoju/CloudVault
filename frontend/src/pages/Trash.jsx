import React, { useState, useEffect } from 'react';
import api, { API_BASE_URL } from '../services/api';
import { FiTrash2, FiRefreshCw } from 'react-icons/fi';
import FileCard from '../components/FileCard';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import PreviewModal from '../components/PreviewModal';
import { Modal, Button } from 'react-bootstrap';
import toast from 'react-hot-toast';

export default function Trash() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [previewFile, setPreviewFile] = useState(null);
  const [fileToDelete, setFileToDelete] = useState(null);

  const fetchTrash = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await api.get('/files/trash');
      setFiles(data.files || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load trash.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrash();
  }, []);

  const handleRestore = async (file) => {
    try {
      await api.post(`/files/${file.id}/restore`);
      toast.success('File restored');
      fetchTrash();
    } catch (err) {
      console.error(err);
      toast.error('Failed to restore file');
    }
  };

  const handlePermanentDelete = async () => {
    if (!fileToDelete) return;
    try {
      await api.delete(`/files/${fileToDelete.id}/permanent-delete`);
      toast.success('File permanently deleted');
      setFileToDelete(null);
      fetchTrash();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete file');
    }
  };

  const handlePreview = async (file) => {
    setPreviewFile(file);
  };

  return (
    <div className="container-fluid p-0 max-w-7xl mx-auto h-100 d-flex flex-column">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h3 className="fw-bold mb-1"><FiTrash2 className="text-danger me-2" />Trash</h3>
          <p className="text-muted-custom m-0">Files moved to trash will stay here until restored or permanently deleted</p>
        </div>
        <button className="btn btn-light d-flex align-items-center gap-2" onClick={fetchTrash} disabled={loading}>
          <FiRefreshCw className={loading ? 'spin' : ''} /> Refresh
        </button>
      </div>

      <div className="flex-grow-1">
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorMessage message={error} onRetry={fetchTrash} />
        ) : files.length === 0 ? (
          <div className="text-center p-5 bg-light rounded-3 border mt-4">
            <FiTrash2 size={48} className="text-muted mb-3" />
            <h5 className="fw-medium">Trash is empty</h5>
            <p className="text-muted-custom mb-0">Deleted files will appear here.</p>
          </div>
        ) : (
          <div className="item-grid pb-4">
            {files.map((file) => (
              <FileCard
                key={file.id}
                file={file}
                isTrash={true}
                onPreview={handlePreview}
                onRestore={handleRestore}
                onPermanentDelete={(f) => setFileToDelete(f)}
              />
            ))}
          </div>
        )}
      </div>

      <PreviewModal
        show={!!previewFile}
        file={previewFile}
        onClose={() => setPreviewFile(null)}
        previewUrl={previewFile ? `${API_BASE_URL}/files/${previewFile.id}/stream` : null}
      />

      <Modal show={!!fileToDelete} onHide={() => setFileToDelete(null)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fs-5 fw-bold text-danger">Delete Forever</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to permanently delete <span className="fw-bold">{fileToDelete?.original_name}</span>? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="light" onClick={() => setFileToDelete(null)}>Cancel</Button>
          <Button variant="danger" onClick={handlePermanentDelete}>Delete Forever</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
