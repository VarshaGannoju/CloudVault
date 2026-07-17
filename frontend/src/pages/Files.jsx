import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api, { API_BASE_URL } from '../services/api';
import { FiUpload, FiRefreshCw } from 'react-icons/fi';
import FileCard from '../components/FileCard';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import UploadModal from '../components/UploadModal';
import ShareModal from '../components/ShareModal';
import PreviewModal from '../components/PreviewModal';
import VersionsModal from '../components/VersionsModal';
import { Modal, Button, Form } from 'react-bootstrap';
import toast from 'react-hot-toast';
import { downloadFileProxy } from '../utils/downloadHelper';

export default function Files() {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';

  const [files, setFiles] = useState([]);
  const [starredIds, setStarredIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Rename File State
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [fileToRename, setFileToRename] = useState(null);
  const [newName, setNewName] = useState('');

  // Delete File State (move to trash)
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);

  // Preview / Versions / Share
  const [previewFile, setPreviewFile] = useState(null);
  const [versionsFile, setVersionsFile] = useState(null);
  const [shareFile, setShareFile] = useState(null);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      setError('');

      const endpoint = searchQuery
        ? `/files/search?query=${encodeURIComponent(searchQuery)}`
        : `/files`;

      const [{ data }, starredRes] = await Promise.all([
        api.get(endpoint),
        api.get('/files/starred'),
      ]);

      setFiles(data.files || []);
      setStarredIds(new Set((starredRes.data.files || []).map((f) => f.id)));
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
    await downloadFileProxy(`/files/${file.id}/download`, file.original_name);
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
      toast.error(err.response?.data?.message || 'Failed to rename file');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!fileToDelete) return;
    try {
      await api.delete(`/files/${fileToDelete.id}`);
      setShowDeleteModal(false);
      toast.success('File moved to trash');
      fetchFiles();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to delete file');
    }
  };

  const handleCopy = async (file) => {
    try {
      await api.post(`/files/${file.id}/copy`);
      toast.success('File copied successfully');
      fetchFiles();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to copy file');
    }
  };

  const handleStar = async (file) => {
    try {
      await api.post(`/files/${file.id}/star`);
      toast.success('File starred');
      fetchFiles();
    } catch (err) {
      console.error(err);
      toast.error('Failed to star file');
    }
  };

  const handleUnstar = async (file) => {
    try {
      await api.delete(`/files/${file.id}/star`);
      toast.success('File unstarred');
      fetchFiles();
    } catch (err) {
      console.error(err);
      toast.error('Failed to unstar file');
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
            {files.map((file) => (
              <FileCard
                key={file.id}
                file={file}
                isStarred={starredIds.has(file.id)}
                onDownload={handleDownload}
                onRename={(f) => { setFileToRename(f); setNewName(f.original_name); setShowRenameModal(true); }}
                onDelete={(f) => { setFileToDelete(f); setShowDeleteModal(true); }}
                onPreview={(f) => setPreviewFile(f)}
                onShare={(f) => setShareFile(f)}
                onCopy={handleCopy}
                onStar={handleStar}
                onUnstar={handleUnstar}
                onShowVersions={(f) => setVersionsFile(f)}
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
          <Modal.Title className="fs-5 fw-bold text-danger">Move to Trash</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to move <span className="fw-bold">{fileToDelete?.original_name}</span> to trash?
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="light" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleDeleteConfirm}>Move to Trash</Button>
        </Modal.Footer>
      </Modal>

      <PreviewModal
        show={!!previewFile}
        file={previewFile}
        onClose={() => setPreviewFile(null)}
        previewUrl={previewFile ? `${API_BASE_URL}/files/${previewFile.id}/stream` : null}
      />

      <VersionsModal show={!!versionsFile} file={versionsFile} onHide={() => setVersionsFile(null)} />

      {shareFile && (
        <ShareModal
          show={!!shareFile}
          onHide={() => setShareFile(null)}
          item={shareFile}
          itemType="files"
        />
      )}
    </div>
  );
}
