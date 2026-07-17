import React, { useState, useEffect } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { FiDownload, FiExternalLink, FiFileText } from 'react-icons/fi';
import api from '../services/api';
import { downloadFileProxy } from '../utils/downloadHelper';

const getCloudinaryPdfPreviewUrl = (cloudinaryUrl) => {
  if (!cloudinaryUrl) return null;
  try {
    const url = new URL(cloudinaryUrl);
    // Cloudinary PDF preview: render first page as an image.
    // Replace /raw/upload/ or /image/upload/ with /image/upload/f_jpg,pg_1/
    const transformedPath = url.pathname
      .replace(/\/(raw|image)\/upload\//, '/image/upload/f_jpg,pg_1/');
    if (transformedPath === url.pathname) return null;
    return `${url.origin}${transformedPath}${url.search}`;
  } catch {
    return null;
  }
};

export default function PreviewModal({ show, file, onClose, previewUrl }) {

  const [pdfPreviewError, setPdfPreviewError] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfErrorMessage, setPdfErrorMessage] = useState(null);
  const [downloading, setDownloading] = useState(false);
 

  const mime_type = file?.mime_type;
const original_name = file?.original_name;
const cloudinary_url = file?.cloudinary_url;
const shareId = file?.shareId;
const id = file?.id;
  const isImage = mime_type?.startsWith('image/');
  const isPdf = mime_type === 'application/pdf';
  const isVideo = mime_type?.startsWith('video/');
  // Cloudinary JPG fallback for image-like first-page preview.
  const pdfPreviewImageUrl = getCloudinaryPdfPreviewUrl(cloudinary_url);

  useEffect(() => {
    if (!show || !isPdf || !previewUrl) {
      setPdfBlobUrl(null);
      setPdfErrorMessage(null);
      return undefined;
    }

    let objectUrl = null;
    let cancelled = false;
    setPdfLoading(true);
    setPdfErrorMessage(null);

    api
      .get(previewUrl, { responseType: 'blob' })
      .then((res) => {
        if (cancelled) return;
        if (res.data?.type && res.data.type !== 'application/pdf') {
          console.warn('PDF preview response MIME type:', res.data.type);
        }
        objectUrl = URL.createObjectURL(res.data);
        setPdfBlobUrl(objectUrl);
      })
      .catch((err) => {
        console.error('Failed to load PDF preview:', err);
        const status = err.response?.status;
        const message = err.response?.data?.message || err.message;
        setPdfErrorMessage(
          status
            ? `Preview failed (${status}): ${message}`
            : `Preview failed: ${message}`
        );
      })
      .finally(() => {
        if (!cancelled) setPdfLoading(false);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [show, isPdf, previewUrl]);
  if (!file) return null;

  const handleDownloadClick = async () => {
    // Prefer the shareId-based backend proxy route (forces correct filename + same-origin download).
    // Falls back to the plain file id route if shareId isn't present.
    const downloadId = shareId ?? id;
    if (!downloadId) {
      console.error('No shareId/id available on file for download:', file);
      return;
    }
    try {
      setDownloading(true);
      await downloadFileProxy(`/share/files/${downloadId}/download`, original_name);
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloading(false);
    }
  };

  const handleOpenClick = () => {
    // cloudinary_url is a "raw" resource and is blocked for unauthenticated direct access,
    // so open the already-fetched same-origin blob instead (same one used in the iframe).
    if (pdfBlobUrl) {
      window.open(pdfBlobUrl, '_blank', 'noopener,noreferrer');
    } else if (pdfErrorMessage) {
      alert(pdfErrorMessage);
    } else {
      alert('PDF is still loading — please wait a moment and try again.');
    }
  };

  return (
    <Modal show={show} onHide={onClose} size="xl" centered className="preview-modal">
      <Modal.Header closeButton className="border-0">
        <Modal.Title className="fs-5 fw-bold">{original_name}</Modal.Title>
      </Modal.Header>
      <Modal.Body className="text-center p-0 bg-dark d-flex flex-column" style={{ minHeight: '75vh' }}>
        {isImage && (
          <img
            src={cloudinary_url}
            alt={original_name}
            className="img-fluid w-100"
            style={{ maxHeight: '80vh', objectFit: 'contain' }}
          />
        )}

        {isPdf && (
          <>
            {pdfLoading ? (
              <div className="flex-grow-1 d-flex flex-column justify-content-center align-items-center text-white p-4">
                <div className="spinner-border text-light mb-3" role="status">
                  <span className="visually-hidden">Loading PDF...</span>
                </div>
                <p>Loading PDF preview...</p>
              </div>
            ) : pdfBlobUrl ? (
              <div className="flex-grow-1 bg-white">
                <iframe
                  src={pdfBlobUrl}
                  title={original_name}
                  width="100%"
                  height="100%"
                  className="d-block"
                  style={{ minHeight: '70vh', border: 'none' }}
                />
              </div>
            ) : pdfErrorMessage ? (
              <div className="flex-grow-1 d-flex flex-column justify-content-center align-items-center text-white p-4">
                <FiFileText size={64} className="mb-3 opacity-50" />
                <p className="text-danger fw-medium">{pdfErrorMessage}</p>
                <p className="text-muted-custom small">URL: {previewUrl}</p>
              </div>
            ) : pdfPreviewImageUrl && !pdfPreviewError ? (
              <div className="flex-grow-1 overflow-auto bg-white d-flex justify-content-center align-items-start p-3">
                <img
                  src={pdfPreviewImageUrl}
                  alt={`Preview of ${original_name}`}
                  className="img-fluid"
                  style={{ maxWidth: '100%', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                  onError={() => setPdfPreviewError(true)}
                />
              </div>
            ) : (
              <div className="flex-grow-1 d-flex flex-column justify-content-center align-items-center text-white p-4">
                <FiFileText size={64} className="mb-3 opacity-50" />
                <p>PDF preview is not available for this file.</p>
              </div>
            )}
            <div className="p-3 bg-white border-top d-flex justify-content-center gap-2 flex-wrap">
              <Button
                variant="outline-primary"
                size="sm"
                onClick={handleOpenClick}
                className="d-flex align-items-center gap-2"
              >
                <FiExternalLink /> Open PDF
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleDownloadClick}
                disabled={downloading}
                className="d-flex align-items-center gap-2"
              >
                <FiDownload /> {downloading ? 'Downloading...' : 'Download PDF'}
              </Button>
            </div>
          </>
        )}

        {isVideo && (
          <video
            src={cloudinary_url}
            controls
            className="w-100"
            style={{ maxHeight: '80vh' }}
          >
            Your browser does not support the video tag.
          </video>
        )}

        {!isImage && !isPdf && !isVideo && (
          <div className="p-5 text-white d-flex flex-column justify-content-center align-items-center flex-grow-1">
            <p>Preview is not available for this file type.</p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleDownloadClick}
              disabled={downloading}
            >
              {downloading ? 'Downloading...' : 'Download File'}
            </button>
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
}