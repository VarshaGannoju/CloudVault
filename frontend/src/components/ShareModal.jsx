import React, { useState } from 'react';
import { Modal, Button, Form, InputGroup } from 'react-bootstrap';
import { FiCopy, FiCheck } from 'react-icons/fi';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function ShareModal({ show, onHide, item, itemType }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form State
  const [accessType, setAccessType] = useState('public');
  const [permission, setPermission] = useState('view');
  const [expiresIn, setExpiresIn] = useState('0'); // 0 means never
  const [password, setPassword] = useState('');
  const [allowDownload, setAllowDownload] = useState(true);
  const [sharedWithEmails, setSharedWithEmails] = useState('');
  
  // Result
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      
      const payload = {
        access_type: accessType,
        permission: permission,
        expires_in_hours: parseInt(expiresIn, 10) || null,
        allow_download: allowDownload,
      };

      if (accessType === 'password_protected' && password) {
        payload.password = password;
      }
      
      if (accessType === 'private' && sharedWithEmails) {
        payload.shared_with_emails = sharedWithEmails.split(',').map(e => e.trim()).filter(e => e);
      }

      const res = await api.post(`/share/${itemType}/${item.id}`, payload);
      
      if (res.data.data.link) {
        setShareLink(res.data.data.link);
      } else {
        toast.success('Item shared successfully');
        onHide();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to share item');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    toast.success('Link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal show={show} onHide={() => { setShareLink(''); onHide(); }} centered>
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="fs-5 fw-bold">Share {itemType === 'files' ? 'File' : 'Folder'}: {item.original_name || item.name}</Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        {error && <div className="alert alert-danger">{error}</div>}
        
        {shareLink ? (
          <div className="text-center py-3">
            <div className="mb-3">
              <div className="d-inline-flex p-3 bg-success bg-opacity-10 text-success rounded-circle mb-3">
                <FiCheck size={32} />
              </div>
              <h5 className="fw-bold">Share Link Generated!</h5>
              <p className="text-muted">Anyone with this link can access the {itemType === 'files' ? 'file' : 'folder'}.</p>
            </div>
            
            <InputGroup className="mb-3">
              <Form.Control value={shareLink} readOnly className="bg-light" />
              <Button variant="primary" onClick={copyToClipboard} className="d-flex align-items-center gap-2">
                {copied ? <><FiCheck /> Copied</> : <><FiCopy /> Copy</>}
              </Button>
            </InputGroup>
          </div>
        ) : (
          <Form onSubmit={handleSubmit} id="shareForm">
            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">Access Type</Form.Label>
              <Form.Select value={accessType} onChange={(e) => setAccessType(e.target.value)}>
                <option value="public">Public Link</option>
                <option value="private">Specific Users (Private)</option>
                <option value="password_protected">Password Protected</option>
              </Form.Select>
            </Form.Group>

            {accessType === 'password_protected' && (
              <Form.Group className="mb-3">
                <Form.Label className="fw-medium">Password</Form.Label>
                <Form.Control 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                />
              </Form.Group>
            )}

            {accessType === 'private' && (
              <Form.Group className="mb-3">
                <Form.Label className="fw-medium">User Emails (comma separated)</Form.Label>
                <Form.Control 
                  type="text" 
                  value={sharedWithEmails} 
                  onChange={(e) => setSharedWithEmails(e.target.value)} 
                  placeholder="user1@example.com, user2@example.com"
                  required 
                />
              </Form.Group>
            )}

            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">Permissions</Form.Label>
              <Form.Select value={permission} onChange={(e) => setPermission(e.target.value)}>
                <option value="view">View Only</option>
                <option value="edit">Can Edit</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">Expiration</Form.Label>
              <Form.Select value={expiresIn} onChange={(e) => setExpiresIn(e.target.value)}>
                <option value="0">Never expire</option>
                <option value="24">24 Hours</option>
                <option value="168">7 Days</option>
                <option value="720">30 Days</option>
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Check 
                type="checkbox"
                label="Allow Download"
                checked={allowDownload}
                onChange={(e) => setAllowDownload(e.target.checked)}
              />
            </Form.Group>
          </Form>
        )}
      </Modal.Body>
      
      <Modal.Footer className="border-0 pt-0">
        {!shareLink && (
          <>
            <Button variant="light" onClick={onHide}>Cancel</Button>
            <Button variant="primary" type="submit" form="shareForm" disabled={loading}>
              {loading ? 'Creating...' : 'Create Share Link'}
            </Button>
          </>
        )}
        {shareLink && (
          <Button variant="light" onClick={onHide}>Close</Button>
        )}
      </Modal.Footer>
    </Modal>
  );
}
