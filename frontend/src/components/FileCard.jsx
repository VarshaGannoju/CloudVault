import React from 'react';
import { Dropdown } from 'react-bootstrap';
import { FiMoreVertical, FiDownload, FiEdit2, FiTrash2, FiEye, FiImage, FiFileText, FiFile, FiShare2 } from 'react-icons/fi';

export default function FileCard({ file, onDownload, onRename, onDelete, onPreview, onShare }) {
  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType) => {
    if (mimeType.startsWith('image/')) return <FiImage className="text-primary" size={32} />;
    if (mimeType === 'application/pdf' || mimeType.includes('document')) return <FiFileText className="text-danger" size={32} />;
    return <FiFile className="text-secondary" size={32} />;
  };

  return (
    <div className="cloud-card interactive d-flex flex-column h-100 position-relative">
      <div className="d-flex justify-content-between align-items-start mb-3">
        <div className="p-2 bg-light rounded d-inline-flex">
          {getFileIcon(file.mime_type)}
        </div>
        
        <Dropdown align="end" onClick={(e) => e.stopPropagation()}>
          <Dropdown.Toggle variant="light" size="sm" className="border-0 bg-transparent shadow-none p-1">
            <FiMoreVertical size={18} />
          </Dropdown.Toggle>

          <Dropdown.Menu className="shadow-sm border-0">
            {file.mime_type.startsWith('image/') && (
              <Dropdown.Item onClick={() => onPreview(file)} className="d-flex align-items-center gap-2">
                <FiEye /> Preview
              </Dropdown.Item>
            )}
            <Dropdown.Item onClick={() => onDownload(file)} className="d-flex align-items-center gap-2">
              <FiDownload /> Download
            </Dropdown.Item>
            <Dropdown.Item onClick={() => onRename(file)} className="d-flex align-items-center gap-2">
              <FiEdit2 /> Rename
            </Dropdown.Item>
            {onShare && (
              <Dropdown.Item onClick={() => onShare(file)} className="d-flex align-items-center gap-2">
                <FiShare2 /> Share
              </Dropdown.Item>
            )}
            <Dropdown.Divider />
            <Dropdown.Item onClick={() => onDelete(file)} className="d-flex align-items-center gap-2 text-danger">
              <FiTrash2 /> Delete
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>
      
      <div className="mt-auto">
        <h6 className="fw-semibold text-truncate mb-1" title={file.original_name}>
          {file.original_name}
        </h6>
        <div className="d-flex justify-content-between align-items-center text-muted-custom" style={{ fontSize: '0.75rem' }}>
          <span>{formatSize(file.size_bytes)}</span>
          <span>{new Date(file.created_at).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}
