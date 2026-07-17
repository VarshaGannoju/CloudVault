import React, { useState, useEffect } from 'react';
import { Container, Table, Badge, Dropdown, Spinner } from 'react-bootstrap';
import { FiMoreVertical, FiLink, FiGlobe, FiLock, FiTrash2, FiEdit2 } from 'react-icons/fi';
import api from '../services/api';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { copyPublicShareLink } from '../utils/share';

export default function SharedByMe() {
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyShares();
  }, []);

  const fetchMyShares = async () => {
    try {
      setLoading(true);
      const res = await api.get('/share/my-shares');
      setShares(res.data.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load your shares');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async (token) => {
    try {
      await copyPublicShareLink(token);
      toast.success('Link copied successfully');
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  const handleRevoke = async (shareId, type) => {
    try {
      const routeType = type === 'file' ? 'files' : 'folders';
      await api.delete(`/share/${routeType}/${shareId}`);
      toast.success('Access revoked');
      fetchMyShares();
    } catch (err) {
      toast.error('Failed to revoke access');
    }
  };

  const handleChangePermission = async (shareId, type, newPermission) => {
    try {
      await api.put(`/share/access/${shareId}`, {
        itemType: type,
        permission: newPermission
      });
      toast.success('Permission updated');
      fetchMyShares();
    } catch (err) {
      toast.error('Failed to update permission');
    }
  };

  return (
    <Container fluid className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Shared By Me</h2>
          <p className="text-muted mb-0">Manage files and folders you have shared with others.</p>
        </div>
      </div>

      <div className="bg-white rounded-3 shadow-sm border p-0 overflow-hidden">
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <div className="mt-2 text-muted">Loading your shares...</div>
          </div>
        ) : shares.length === 0 ? (
          <div className="text-center py-5">
            <div className="text-muted mb-3" style={{ fontSize: '3rem' }}>
              <FiGlobe className="opacity-25" />
            </div>
            <h5>You haven't shared anything yet</h5>
            <p className="text-muted mb-4">Files and folders you share will appear here.</p>
            <Link to="/files" className="btn btn-primary px-4 rounded-pill">
              Browse Files to Share
            </Link>
          </div>
        ) : (
          <div className="table-responsive">
            <Table hover className="mb-0 align-middle">
              <thead className="bg-light text-muted" style={{ fontSize: '0.85rem' }}>
                <tr>
                  <th className="border-0 fw-medium px-4 py-3">Name</th>
                  <th className="border-0 fw-medium py-3">Type</th>
                  <th className="border-0 fw-medium py-3">Access</th>
                  <th className="border-0 fw-medium py-3">Permission</th>
                  <th className="border-0 fw-medium py-3">Shared With</th>
                  <th className="border-0 fw-medium py-3 text-end px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {shares.map(share => {
                  const isPublic = !!share.public_token;
                  return (
                    <tr key={share.id}>
                      <td className="px-4 py-3">
                        <div className="fw-medium text-dark">{share.target_name}</div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                          Shared {share.created_at ? formatDistanceToNow(new Date(share.created_at)) : ''} ago
                        </div>
                      </td>
                      <td className="py-3">
                        <Badge bg="light" text="dark" className="border fw-normal">
                          {share.type === 'file' ? 'File' : 'Folder'}
                        </Badge>
                      </td>
                      <td className="py-3">
                        {isPublic ? (
                          <Badge bg="success" className="d-inline-flex align-items-center gap-1">
                            <FiGlobe size={12} /> Public
                          </Badge>
                        ) : (
                          <Badge bg="secondary" className="d-inline-flex align-items-center gap-1">
                            <FiLock size={12} /> Private
                          </Badge>
                        )}
                      </td>
                      <td className="py-3">
                        <span className="text-capitalize text-muted fw-medium" style={{ fontSize: '0.9rem' }}>
                          {share.permission}
                        </span>
                      </td>
                      <td className="py-3">
                        {isPublic ? (
                          <span className="text-muted" style={{ fontSize: '0.9rem' }}>Anyone with link</span>
                        ) : (
                          <div className="d-flex align-items-center gap-2">
                            <div className="bg-light rounded-circle d-flex align-items-center justify-content-center text-secondary fw-bold" style={{ width: '28px', height: '28px', fontSize: '0.8rem' }}>
                              {share.shared_with_name ? share.shared_with_name.charAt(0).toUpperCase() : '?'}
                            </div>
                            <div>
                              <div className="fw-medium text-dark" style={{ fontSize: '0.9rem' }}>{share.shared_with_name || 'Unknown'}</div>
                              <div className="text-muted" style={{ fontSize: '0.75rem' }}>{share.shared_with_email}</div>
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="py-3 text-end px-4">
                        <Dropdown align="end">
                          <Dropdown.Toggle variant="light" size="sm" className="btn-icon border-0 rounded-circle bg-transparent text-secondary">
                            <FiMoreVertical />
                          </Dropdown.Toggle>
                          <Dropdown.Menu className="shadow-sm border-0">
                            {isPublic && (
                              <Dropdown.Item onClick={() => handleCopyLink(share.public_token)} className="d-flex align-items-center gap-2 py-2">
                                <FiLink className="text-primary" /> Copy Link
                              </Dropdown.Item>
                            )}

                            {!isPublic && (
                              <Dropdown.Item onClick={() => handleChangePermission(share.id, share.type, share.permission === 'read' ? 'edit' : 'read')} className="d-flex align-items-center gap-2 py-2">
                                <FiEdit2 className="text-secondary" /> Change to {share.permission === 'read' ? 'Editor' : 'Viewer'}
                              </Dropdown.Item>
                            )}

                            <Dropdown.Divider />
                            
                            <Dropdown.Item onClick={() => handleRevoke(share.id, share.type)} className="text-danger d-flex align-items-center gap-2 py-2">
                              <FiTrash2 /> Revoke Access
                            </Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        )}
      </div>
    </Container>
  );
}
