import React, { useState, useRef } from 'react';
import { Modal, Button, ProgressBar } from 'react-bootstrap';
import { FiUploadCloud, FiX } from 'react-icons/fi';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function UploadModal({ show, onHide, currentFolderId, onSuccess }) {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      setFiles((prev) => [...prev, ...droppedFiles]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const selectedFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...selectedFiles]);
    }
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    setProgress(0);
    setError('');

    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    if (currentFolderId) {
      formData.append('folderId', currentFolderId);
    }

    try {
      await api.post('/files/upload-multiple', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(percentCompleted);
        }
      });
      setFiles([]);
      toast.success('Files uploaded successfully');
      onSuccess();
      onHide();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload files.');
      toast.error('Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="fw-bold fs-5">Upload Files</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div 
          className={`border rounded-3 p-5 text-center transition-all ${dragActive ? 'border-primary bg-primary bg-opacity-10' : 'border-secondary border-opacity-25 bg-light'}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current.click()}
          style={{ cursor: 'pointer', borderStyle: 'dashed !important' }}
        >
          <FiUploadCloud size={48} className={`mb-3 ${dragActive ? 'text-primary' : 'text-muted'}`} />
          <h6 className="fw-semibold">Drag and drop files here</h6>
          <p className="text-muted-custom small mb-0">or click to browse from your computer</p>
          <input 
            type="file" 
            multiple 
            ref={inputRef} 
            onChange={handleChange} 
            className="d-none" 
          />
        </div>

        {error && <div className="alert alert-danger mt-3 mb-0 p-2 text-sm">{error}</div>}

        {files.length > 0 && (
          <div className="mt-4">
            <h6 className="fw-semibold mb-2 fs-6">Selected Files ({files.length})</h6>
            <div className="list-group list-group-flush rounded border" style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {files.map((file, i) => (
                <div key={i} className="list-group-item d-flex justify-content-between align-items-center py-2 px-3">
                  <div className="text-truncate" style={{ maxWidth: '85%' }}>
                    <small className="fw-medium">{file.name}</small>
                  </div>
                  {!uploading && (
                    <button className="btn btn-sm btn-link text-danger p-0" onClick={() => removeFile(i)}>
                      <FiX size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {uploading && (
          <div className="mt-3">
            <ProgressBar animated now={progress} label={`${progress}%`} />
          </div>
        )}
      </Modal.Body>
      <Modal.Footer className="border-0 pt-0">
        <Button variant="light" onClick={onHide} disabled={uploading}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleUpload} disabled={files.length === 0 || uploading}>
          {uploading ? 'Uploading...' : 'Upload'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
