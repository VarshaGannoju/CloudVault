import React, { useState, useEffect } from 'react';
import api, { API_BASE_URL } from '../services/api';
import { FiClock, FiRefreshCw } from 'react-icons/fi';
import FileCard from '../components/FileCard';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import PreviewModal from '../components/PreviewModal';
import { downloadFileProxy } from '../utils/downloadHelper';

export default function Recent() {
  const [data, setData] = useState({ uploaded: [], modified: [], accessed: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [previewFile, setPreviewFile] = useState(null);

  const fetchRecent = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await api.get('/files/recent');
      setData(data.data || { uploaded: [], modified: [], accessed: [] });
    } catch (err) {
      console.error(err);
      setError('Failed to load recent files.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecent();
  }, []);

  const handleDownload = async (file) => {
    await downloadFileProxy(`/files/${file.id}/download`, file.original_name);
  };

  const renderSection = (title, files) => (
    <div className="mb-5">
      <h5 className="fw-bold mb-3">{title}</h5>
      {files.length === 0 ? (
        <div className="text-center p-4 bg-light rounded-3 border">
          <p className="text-muted-custom mb-0">No files here yet.</p>
        </div>
      ) : (
        <div className="item-grid">
          {files.map((file) => (
            <FileCard
              key={`${title}-${file.id}`}
              file={file}
              onDownload={handleDownload}
              onPreview={(f) => setPreviewFile(f)}
            />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="container-fluid p-0 max-w-7xl mx-auto h-100 d-flex flex-column">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h3 className="fw-bold mb-1"><FiClock className="text-info me-2" />Recent</h3>
          <p className="text-muted-custom m-0">Files you recently uploaded, edited or opened</p>
        </div>
        <button className="btn btn-light d-flex align-items-center gap-2" onClick={fetchRecent} disabled={loading}>
          <FiRefreshCw className={loading ? 'spin' : ''} /> Refresh
        </button>
      </div>

      <div className="flex-grow-1">
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorMessage message={error} onRetry={fetchRecent} />
        ) : (
          <>
            {renderSection('Recently Uploaded', data.uploaded)}
            {renderSection('Recently Modified', data.modified)}
            {renderSection('Recently Accessed', data.accessed)}
          </>
        )}
      </div>

      <PreviewModal
        show={!!previewFile}
        file={previewFile}
        onClose={() => setPreviewFile(null)}
        previewUrl={previewFile ? `${API_BASE_URL}/files/${previewFile.id}/stream` : null}
      />
    </div>
  );
}
