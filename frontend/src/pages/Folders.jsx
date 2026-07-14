import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { FiFolderPlus, FiUpload, FiCornerUpLeft } from 'react-icons/fi';
import FolderCard from '../components/FolderCard';
import FileCard from '../components/FileCard';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import UploadModal from '../components/UploadModal';
import { Modal, Button, Form } from 'react-bootstrap';

export default function Folders() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const parentId = searchParams.get('id') || null;

  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);

  const fetchContents = async () => {
    try {
      setLoading(true);
      setError('');
      
      const folderRes = await api.get(`/folders${parentId ? `?parentId=${parentId}` : ''}`);
      setFolders(folderRes.data.data || []);

      const fileRes = await api.get(`/files${parentId ? `?folderId=${parentId}` : ''}`);
      setFiles(fileRes.data.files || []);

      if (parentId) {
        const detailRes = await api.get(`/folders/${parentId}`);
        setCurrentFolder(detailRes.data.data);
      } else {
        setCurrentFolder(null);
      }
    } catch (_err) {
      setError('Failed to fetch folder contents.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parentId]);

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    try {
      await api.post('/folders', { name: newFolderName.trim(), parentId });
      setNewFolderName('');
      setShowCreateModal(false);
      fetchContents();
    } catch (_err) {
      alert('Failed to create folder');
    }
  };

  const handleNavigate = (id) => {
    setSearchParams({ id });
  };

  const handleBack = () => {
    if (currentFolder?.parent_id) {
      setSearchParams({ id: currentFolder.parent_id });
    } else {
      navigate('/folders'); // Go to root
    }
  };

  return (
    <div className="container-fluid p-0 max-w-7xl mx-auto h-100 d-flex flex-column">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div className="d-flex align-items-center gap-3">
          {parentId && (
            <button className="btn btn-light rounded-circle p-2" onClick={handleBack} title="Go Back">
              <FiCornerUpLeft size={20} />
            </button>
          )}
          <div>
            <h3 className="fw-bold mb-1">
              {currentFolder ? currentFolder.name : 'My Folders'}
            </h3>
            <p className="text-muted-custom m-0">Organize your files efficiently</p>
          </div>
        </div>
        
        <div className="d-flex gap-2">
          <button className="btn btn-outline-primary d-flex align-items-center gap-2 bg-white" onClick={() => setShowCreateModal(true)}>
            <FiFolderPlus /> New Folder
          </button>
          {parentId && (
            <button className="btn btn-primary d-flex align-items-center gap-2" onClick={() => setShowUploadModal(true)}>
              <FiUpload /> Upload File Here
            </button>
          )}
        </div>
      </div>

      <div className="flex-grow-1">
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorMessage message={error} onRetry={fetchContents} />
        ) : (
          <>
            {folders.length === 0 && files.length === 0 && (
              <div className="text-center p-5 bg-light rounded-3 border mt-4">
                <h5 className="fw-medium">This folder is empty</h5>
                <p className="text-muted-custom mb-0">Create a subfolder or upload files here.</p>
              </div>
            )}

            {folders.length > 0 && (
              <div className="mb-5">
                <h6 className="text-muted-custom fw-semibold mb-3">Folders</h6>
                <div className="item-grid">
                  {folders.map(folder => (
                    <FolderCard 
                      key={folder.id} 
                      folder={folder} 
                      onNavigate={handleNavigate}
                      onRename={() => {}}
                      onDelete={() => {}}
                    />
                  ))}
                </div>
              </div>
            )}

            {files.length > 0 && (
              <div>
                <h6 className="text-muted-custom fw-semibold mb-3">Files</h6>
                <div className="item-grid">
                  {files.map(file => (
                    <FileCard 
                      key={file.id} 
                      file={file} 
                      onDownload={(f) => window.open(f.cloudinary_url, '_blank')}
                      onRename={() => {}}
                      onDelete={() => {}}
                      onPreview={() => {}}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Folder Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} centered>
        <Form onSubmit={handleCreateFolder}>
          <Modal.Header closeButton className="border-0 pb-0">
            <Modal.Title className="fs-5 fw-bold">Create Folder</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group>
              <Form.Label className="fw-medium">Folder Name</Form.Label>
              <Form.Control 
                type="text" 
                value={newFolderName} 
                onChange={(e) => setNewFolderName(e.target.value)} 
                placeholder="e.g. Work Documents"
                required 
                autoFocus 
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-0 pt-0">
            <Button variant="light" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Create</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <UploadModal 
        show={showUploadModal} 
        onHide={() => setShowUploadModal(false)} 
        currentFolderId={parentId}
        onSuccess={fetchContents} 
      />

    </div>
  );
}
