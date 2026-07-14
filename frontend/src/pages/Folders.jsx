import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { FiFolderPlus, FiUpload, FiCornerUpLeft } from 'react-icons/fi';
import FolderCard from '../components/FolderCard';
import FileCard from '../components/FileCard';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import UploadModal from '../components/UploadModal';
import ShareModal from '../components/ShareModal';
import { Modal, Button, Form } from 'react-bootstrap';
import toast from 'react-hot-toast';

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

  // Folder actions
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [folderToRename, setFolderToRename] = useState(null);
  const [folderNewName, setFolderNewName] = useState('');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState(null);

  // Share Modal
  const [showShareModal, setShowShareModal] = useState(false);
  const [itemToShare, setItemToShare] = useState(null);
  const [itemTypeToShare, setItemTypeToShare] = useState('folders');

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
    } catch (err) {
      console.error(err);
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
      toast.success('Folder created successfully');
      fetchContents();
    } catch (err) {
      console.error(err);
      toast.error('Failed to create folder');
    }
  };

  const handleRenameFolder = async (e) => {
    e.preventDefault();
    if (!folderNewName.trim() || !folderToRename) return;
    try {
      await api.put(`/folders/${folderToRename.id}`, { name: folderNewName.trim() });
      setShowRenameModal(false);
      toast.success('Folder renamed successfully');
      fetchContents();
    } catch (err) {
      console.error(err);
      toast.error('Failed to rename folder');
    }
  };

  const handleDeleteFolder = async () => {
    if (!folderToDelete) return;
    try {
      await api.delete(`/folders/${folderToDelete.id}`);
      setShowDeleteModal(false);
      toast.success('Folder deleted successfully');
      fetchContents();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete folder');
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
                      onRename={(f) => { setFolderToRename(f); setFolderNewName(f.name); setShowRenameModal(true); }}
                      onDelete={(f) => { setFolderToDelete(f); setShowDeleteModal(true); }}
                      onShare={(f) => { setItemToShare(f); setItemTypeToShare('folders'); setShowShareModal(true); }}
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
                      onRename={() => {}} // Usually file operations handled in Files page or here if needed
                      onDelete={() => {}}
                      onPreview={() => {}}
                      onShare={(f) => { setItemToShare(f); setItemTypeToShare('files'); setShowShareModal(true); }}
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

      {/* Rename Modal */}
      <Modal show={showRenameModal} onHide={() => setShowRenameModal(false)} centered>
        <Form onSubmit={handleRenameFolder}>
          <Modal.Header closeButton className="border-0 pb-0">
            <Modal.Title className="fs-5 fw-bold">Rename Folder</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group>
              <Form.Label className="fw-medium">New Name</Form.Label>
              <Form.Control 
                type="text" 
                value={folderNewName} 
                onChange={(e) => setFolderNewName(e.target.value)} 
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
          <Modal.Title className="fs-5 fw-bold text-danger">Delete Folder</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete <span className="fw-bold">{folderToDelete?.name}</span>? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="light" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleDeleteFolder}>Delete</Button>
        </Modal.Footer>
      </Modal>

      {/* Share Modal */}
      {itemToShare && (
        <ShareModal 
          show={showShareModal} 
          onHide={() => setShowShareModal(false)} 
          item={itemToShare} 
          itemType={itemTypeToShare} 
        />
      )}

    </div>
  );
}
