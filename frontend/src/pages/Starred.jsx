import React, { useState, useEffect } from 'react';
import api, { API_BASE_URL } from '../services/api';
import { FiRefreshCw, FiStar } from 'react-icons/fi';
import FileCard from '../components/FileCard';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import PreviewModal from '../components/PreviewModal';
import { downloadFileProxy } from '../utils/downloadHelper';
import toast from 'react-hot-toast';

export default function Starred() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [previewFile, setPreviewFile] = useState(null);

  const fetchStarred = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await api.get('/files/starred');
      setFiles(data.files || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load starred files.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStarred();
  }, []);

  const handleDownload = async (file) => {
    await downloadFileProxy(`/files/${file.id}/download`, file.original_name);
  };

  const handleUnstar = async (file) => {
    try {
      await api.delete(`/files/${file.id}/star`);
      toast.success('File unstarred');
      fetchStarred();
    } catch (err) {
      console.error(err);
      toast.error('Failed to unstar file');
    }
  };

  return (
    <div className="container-fluid p-0 max-w-7xl mx-auto h-100 d-flex flex-column">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h3 className="fw-bold mb-1"><FiStar className="text-warning me-2" />Starred</h3>
          <p className="text-muted-custom m-0">Your favorite files in one place</p>
        </div>
        <button className="btn btn-light d-flex align-items-center gap-2" onClick={fetchStarred} disabled={loading}>
          <FiRefreshCw className={loading ? 'spin' : ''} /> Refresh
        </button>
      </div>

      <div className="flex-grow-1">
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorMessage message={error} onRetry={fetchStarred} />
        ) : files.length === 0 ? (
          <div className="text-center p-5 bg-light rounded-3 border mt-4">
            <FiStar size={48} className="text-muted mb-3" />
            <h5 className="fw-medium">No starred files</h5>
            <p className="text-muted-custom mb-0">Star files to access them quickly.</p>
          </div>
        ) : (
          <div className="item-grid pb-4">
            {files.map((file) => (
              <FileCard
                key={file.id}
                file={file}
                isStarred={true}
                onDownload={handleDownload}
                onPreview={(f) => setPreviewFile(f)}
                onUnstar={handleUnstar}
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
    </div>
  );
}
