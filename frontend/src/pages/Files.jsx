import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { FiUpload, FiRefreshCw } from 'react-icons/fi';
import FileCard from '../components/FileCard';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import UploadModal from '../components/UploadModal';
import ShareModal from '../components/ShareModal';
import { Modal, Button, Form } from 'react-bootstrap';
import toast from 'react-hot-toast';

export default function Files() {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Rename File State
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [fileToRename, setFileToRename] = useState(null);
  const [newName, setNewName] = useState('');

  // Delete File State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);

  // Preview Modal
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [fileToPreview, setFileToPreview] = useState(null);

  // Share Modal
  const [showShareModal, setShowShareModal] = useState(false);
  const [fileToShare, setFileToShare] = useState(null);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      setError('');
      
      const endpoint = searchQuery 
        ? `/files/search?query=${encodeURIComponent(searchQuery)}` 
        : `/files`;

      const { data } = await api.get(endpoint);
      setFiles(data.files || []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch files.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const handleDownload = async (file) => {
    try {
      const response = await fetch(file.cloudinary_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.original_name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed via blob', err);
      window.open(file.cloudinary_url, '_blank');
    }
  };

  const handleRenameSubmit = async (e) => {
    e.preventDefault();
    if (!newName.trim() || !fileToRename) return;
    try {
      await api.put(`/files/${fileToRename.id}`, { name: newName.trim() });
      setShowRenameModal(false);
      toast.success('File renamed successfully');
      fetchFiles();
    } catch (err) {
      console.error(err);
      toast.error('Failed to rename file');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!fileToDelete) return;
    try {
      await api.delete(`/files/${fileToDelete.id}`);
      setShowDeleteModal(false);
      toast.success('File deleted successfully');
      fetchFiles();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete file');
    }
  };

  return (
    <div className="container-fluid p-0 max-w-7xl mx-auto h-100 d-flex flex-column">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h3 className="fw-bold mb-1">{searchQuery ? `Search Results for "${searchQuery}"` : 'All Files'}</h3>
          <p className="text-muted-custom m-0">Manage all your files across the drive</p>
        </div>
        
        <div className="d-flex gap-2">
          <button className="btn btn-light d-flex align-items-center gap-2" onClick={fetchFiles} disabled={loading}>
            <FiRefreshCw className={loading ? 'spin' : ''} /> Refresh
          </button>
          <button className="btn btn-primary d-flex align-items-center gap-2" onClick={() => setShowUploadModal(true)}>
            <FiUpload /> Upload Files
          </button>
        </div>
      </div>

      <div className="flex-grow-1">
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorMessage message={error} onRetry={fetchFiles} />
        ) : files.length === 0 ? (
          <div className="text-center p-5 bg-light rounded-3 border mt-4">
            <h5 className="fw-medium">No files found</h5>
            <p className="text-muted-custom mb-0">Upload some files to get started.</p>
          </div>
        ) : (
          <div className="item-grid pb-4">
            {files.map(file => (
              <FileCard 
                key={file.id} 
                file={file} 
                onDownload={handleDownload}
                onRename={(f) => { setFileToRename(f); setNewName(f.original_name); setShowRenameModal(true); }}
                onDelete={(f) => { setFileToDelete(f); setShowDeleteModal(true); }}
                onPreview={(f) => { setFileToPreview(f); setShowPreviewModal(true); }}
                onShare={(f) => { setFileToShare(f); setShowShareModal(true); }}
              />
            ))}
          </div>
        )}
      </div>

      <UploadModal 
        show={showUploadModal} 
        onHide={() => setShowUploadModal(false)} 
        onSuccess={fetchFiles} 
      />

      {/* Rename Modal */}
      <Modal show={showRenameModal} onHide={() => setShowRenameModal(false)} centered>
        <Form onSubmit={handleRenameSubmit}>
          <Modal.Header closeButton className="border-0 pb-0">
            <Modal.Title className="fs-5 fw-bold">Rename File</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group>
              <Form.Label className="fw-medium">New Name</Form.Label>
              <Form.Control 
                type="text" 
                value={newName} 
                onChange={(e) => setNewName(e.target.value)} 
                required 
                autoFocus 
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-0 pt-0">
            <Button variant="light" onClick={() => setShowRenameModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Rename</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fs-5 fw-bold text-danger">Delete File</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete <span className="fw-bold">{fileToDelete?.original_name}</span>? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="light" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleDeleteConfirm}>Delete</Button>
        </Modal.Footer>
      </Modal>

      {/* Preview Modal */}
      <Modal show={showPreviewModal} onHide={() => setShowPreviewModal(false)} size="lg" centered>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fs-5 fw-bold">{fileToPreview?.original_name}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center p-0 bg-dark">
          {fileToPreview && fileToPreview.mime_type.startsWith('image/') && (
            <img 
              src={fileToPreview.cloudinary_url} 
              alt={fileToPreview.original_name} 
              className="img-fluid w-100" 
              style={{ maxHeight: '80vh', objectFit: 'contain' }}
            />
          )}
        </Modal.Body>
      </Modal>

      {/* Share Modal */}
      {fileToShare && (
        <ShareModal 
          show={showShareModal} 
          onHide={() => setShowShareModal(false)} 
          item={fileToShare} 
          itemType="files" 
        />
      )}

    </div>
  );
}
