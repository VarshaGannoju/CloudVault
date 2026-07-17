import React, { useState } from 'react';
import { Dropdown, OverlayTrigger, Tooltip } from 'react-bootstrap';
import {
  FiMoreVertical,
  FiDownload,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiImage,
  FiFileText,
  FiFile,
  FiShare2,
  FiStar,
  FiCopy,
  FiRotateCcw,
  FiAlertOctagon,
  FiClock,
  FiLayers,
} from 'react-icons/fi';

export default function FileCard({
  file,
  onDownload,
  onRename,
  onDelete,
  onPreview,
  onShare,
  onCopy,
  onStar,
  onUnstar,
  isStarred,
  onRestore,
  onPermanentDelete,
  onShowVersions,
  isTrash = false,
}) {
  const [imageError, setImageError] = useState(false);

  const formatSize = (bytes) => {
    if (bytes == null || isNaN(bytes)) return '--';
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    if (!dateString) return '--';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '--';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getFileIcon = (mimeType) => {
    if (!mimeType) return <FiFile className="text-secondary" size={32} />;
    if (mimeType.startsWith('image/')) return <FiImage className="text-primary" size={32} />;
    if (mimeType === 'application/pdf' || mimeType.includes('document')) return <FiFileText className="text-danger" size={32} />;
    if (mimeType.startsWith('video/')) return <FiFileText className="text-warning" size={32} />;
    return <FiFile className="text-secondary" size={32} />;
  };

  const perm = file?.permission || 'owner';
  const isOwner = perm === 'owner';
  const isEditor = perm === 'edit' || isOwner;

  const canPreview =
    file?.mime_type?.startsWith('image/') ||
    file?.mime_type === 'application/pdf' ||
    file?.mime_type?.startsWith('video/');

  const thumbnailUrl = file?.mime_type?.startsWith('image/') && !imageError ? file.cloudinary_url : null;

  return (
    <div className="cloud-card interactive d-flex flex-column h-100 position-relative">
      <div className="d-flex justify-content-between align-items-start mb-2">
        {isStarred ? (
          <FiStar className="text-warning" size={18} />
        ) : (
          <span /> // spacer
        )}

        <Dropdown align="end" onClick={(e) => e.stopPropagation()}>
          <Dropdown.Toggle variant="light" size="sm" className="border-0 bg-transparent shadow-none p-1">
            <FiMoreVertical size={18} />
          </Dropdown.Toggle>

          <Dropdown.Menu className="shadow-sm border-0" popperConfig={{ strategy: 'fixed' }}>
            {canPreview && onPreview && (
              <Dropdown.Item onClick={() => onPreview(file)} className="d-flex align-items-center gap-2">
                <FiEye /> Preview
              </Dropdown.Item>
            )}
            {onDownload && (
              <Dropdown.Item onClick={() => onDownload(file)} className="d-flex align-items-center gap-2">
                <FiDownload /> Download
              </Dropdown.Item>
            )}
            {onCopy && (
              <Dropdown.Item onClick={() => onCopy(file)} className="d-flex align-items-center gap-2">
                <FiCopy /> Make a Copy
              </Dropdown.Item>
            )}
            {onShowVersions && isOwner && (
              <Dropdown.Item onClick={() => onShowVersions(file)} className="d-flex align-items-center gap-2">
                <FiLayers /> Versions
              </Dropdown.Item>
            )}
            {onRename && isEditor && !isTrash && (
              <Dropdown.Item onClick={() => onRename(file)} className="d-flex align-items-center gap-2">
                <FiEdit2 /> Rename
              </Dropdown.Item>
            )}
            {onShare && isOwner && !isTrash && (
              <Dropdown.Item onClick={() => onShare(file)} className="d-flex align-items-center gap-2">
                <FiShare2 /> Share
              </Dropdown.Item>
            )}
            {onStar && !isStarred && !isTrash && (
              <Dropdown.Item onClick={() => onStar(file)} className="d-flex align-items-center gap-2">
                <FiStar /> Star
              </Dropdown.Item>
            )}
            {onUnstar && isStarred && !isTrash && (
              <Dropdown.Item onClick={() => onUnstar(file)} className="d-flex align-items-center gap-2">
                <FiStar className="text-warning" /> Unstar
              </Dropdown.Item>
            )}

            {isTrash ? (
              <>
                <Dropdown.Divider />
                {onRestore && (
                  <Dropdown.Item onClick={() => onRestore(file)} className="d-flex align-items-center gap-2 text-success">
                    <FiRotateCcw /> Restore
                  </Dropdown.Item>
                )}
                {onPermanentDelete && (
                  <Dropdown.Item onClick={() => onPermanentDelete(file)} className="d-flex align-items-center gap-2 text-danger">
                    <FiAlertOctagon /> Delete Forever
                  </Dropdown.Item>
                )}
              </>
            ) : (
              onDelete && (
                <>
                  <Dropdown.Divider />
                  <Dropdown.Item onClick={() => onDelete(file)} className="d-flex align-items-center gap-2 text-danger">
                    <FiTrash2 /> Move to Trash
                  </Dropdown.Item>
                </>
              )
            )}
          </Dropdown.Menu>
        </Dropdown>
      </div>

      <div className="text-center mb-3" style={{ minHeight: '80px' }}>
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={file?.original_name}
            className="rounded"
            style={{ maxHeight: '80px', maxWidth: '100%', objectFit: 'cover' }}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="p-2 bg-light rounded d-inline-flex">{getFileIcon(file?.mime_type)}</div>
        )}
      </div>

      <div className="mt-auto">
        <h6 className="fw-semibold text-truncate mb-1" title={file?.original_name}>
          {file?.original_name}
        </h6>
        {file?.shared_by_name && (
          <small className="text-muted d-block mb-1">Shared by: {file.shared_by_name}</small>
        )}
        <div className="d-flex justify-content-between align-items-center text-muted-custom" style={{ fontSize: '0.75rem' }}>
          <span>{formatSize(file?.size_bytes)}</span>
          <span>{isTrash ? formatDate(file?.deleted_at) : formatDate(file?.created_at)}</span>
        </div>

        {/* Quick hover actions */}
        <div className="d-flex justify-content-end align-items-center gap-2 mt-2 pt-2 border-top">
          {onDownload && !isTrash && (
            <OverlayTrigger overlay={<Tooltip>Download</Tooltip>}>
              <button className="btn btn-sm btn-light p-1" onClick={() => onDownload(file)}>
                <FiDownload size={14} />
              </button>
            </OverlayTrigger>
          )}
          {onShare && isOwner && !isTrash && (
            <OverlayTrigger overlay={<Tooltip>Share</Tooltip>}>
              <button className="btn btn-sm btn-light p-1" onClick={() => onShare(file)}>
                <FiShare2 size={14} />
              </button>
            </OverlayTrigger>
          )}
          {isStarred && onUnstar && !isTrash && (
            <OverlayTrigger overlay={<Tooltip>Unstar</Tooltip>}>
              <button className="btn btn-sm btn-light p-1 text-warning" onClick={() => onUnstar(file)}>
                <FiStar size={14} />
              </button>
            </OverlayTrigger>
          )}
          {!isStarred && onStar && !isTrash && (
            <OverlayTrigger overlay={<Tooltip>Star</Tooltip>}>
              <button className="btn btn-sm btn-light p-1" onClick={() => onStar(file)}>
                <FiStar size={14} />
              </button>
            </OverlayTrigger>
          )}
          {onDelete && !isTrash && (
            <OverlayTrigger overlay={<Tooltip>Move to Trash</Tooltip>}>
              <button className="btn btn-sm btn-light p-1 text-danger" onClick={() => onDelete(file)}>
                <FiTrash2 size={14} />
              </button>
            </OverlayTrigger>
          )}
          {isTrash && onRestore && (
            <OverlayTrigger overlay={<Tooltip>Restore</Tooltip>}>
              <button className="btn btn-sm btn-light p-1 text-success" onClick={() => onRestore(file)}>
                <FiRotateCcw size={14} />
              </button>
            </OverlayTrigger>
          )}
        </div>

        {perm !== 'owner' && !isTrash && (
          <div className="position-absolute" style={{ top: '10px', left: '50%', transform: 'translateX(-50%)' }}>
            {perm === 'read' ? (
              <span className="badge bg-secondary opacity-75 rounded-pill"><FiEye className="me-1" />Viewer</span>
            ) : (
              <span className="badge bg-primary opacity-75 rounded-pill"><FiEdit2 className="me-1" />Editor</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
