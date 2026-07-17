import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, ListGroup, Spinner, Badge } from 'react-bootstrap';
import { FiUploadCloud, FiRotateCcw, FiClock, FiHardDrive } from 'react-icons/fi';
import api from '../services/api';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

export default function VersionsModal({ show, onHide, file }) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const fetchVersions = async () => {
    if (!file) return;
    try {
      setLoading(true);
      const { data } = await api.get(`/files/${file.id}/versions`);
      setVersions(data.versions || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load versions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (show && file) {
      fetchVersions();
    } else {
      setVersions([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, file]);

  const handleFileSelect = async (e) => {
    const selected = e.target.files?.[0];
    if (!selected || !file) return;

    const formData = new FormData();
    formData.append('file', selected);

    try {
      setUploading(true);
      await api.post(`/files/${file.id}/versions`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('New version uploaded');
      fetchVersions();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to upload version');
    } finally {
      setUploading(false);
    }
  };

  const handleRestore = async (versionId) => {
    try {
      await api.post(`/files/${file.id}/versions/${versionId}/restore`);
      toast.success('Version restored');
      fetchVersions();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to restore version');
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '--';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <Modal show={show} onHide={onHide} centered size="md">
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="fs-5 fw-bold">Version History</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="mb-3">
          <input
            type="file"
            ref={inputRef}
            onChange={handleFileSelect}
            className="d-none"
          />
          <Button
            variant="outline-primary"
            size="sm"
            className="d-flex align-items-center gap-2"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Spinner size="sm" /> : <FiUploadCloud />}
            Upload New Version
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-3"><Spinner size="sm" /></div>
        ) : versions.length === 0 ? (
          <div className="text-center py-4 text-muted">
            <p className="mb-0">No previous versions found.</p>
          </div>
        ) : (
          <ListGroup variant="flush" className="border rounded-3">
            {versions.map((v) => (
              <ListGroup.Item key={v.id} className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="fw-medium">Version {v.version_number}</div>
                  <small className="text-muted d-flex align-items-center gap-2">
                    <FiClock size={12} />
                    {v.created_at && formatDistanceToNow(new Date(v.created_at), { addSuffix: true })}
                    <FiHardDrive size={12} />
                    {formatSize(v.size_bytes)}
                  </small>
                </div>
                <Button
                  variant="light"
                  size="sm"
                  className="d-flex align-items-center gap-1"
                  onClick={() => handleRestore(v.id)}
                >
                  <FiRotateCcw size={14} /> Restore
                </Button>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </Modal.Body>
      <Modal.Footer className="border-0 pt-0">
        <Button variant="light" onClick={onHide}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
}
