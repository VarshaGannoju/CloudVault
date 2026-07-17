import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Form, Spinner, Dropdown, ListGroup } from 'react-bootstrap';
import { FiUsers, FiUser, FiTrash2, FiLink, FiLock, FiGlobe, FiCopy } from 'react-icons/fi';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { buildPublicShareUrl, copyPublicShareLink } from '../utils/share';

export default function ShareModal({ show, onHide, item, itemType }) {
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [fetchingAccess, setFetchingAccess] = useState(false);
  const [accessList, setAccessList] = useState([]);
  const [publicShare, setPublicShare] = useState(null);

  const [emailQuery, setEmailQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [permission, setPermission] = useState('read');
  const [publicLoading, setPublicLoading] = useState(false);

  const searchTimeoutRef = useRef(null);

  const normalizedItemType = itemType === 'files' ? 'file' : 'folder';
  const isPublicEnabled = !!publicShare?.public_token;
  const publicLink = isPublicEnabled ? buildPublicShareUrl(publicShare.public_token) : '';

  useEffect(() => {
    if (show && item) {
      fetchAccessList();
    } else {
      setEmailQuery('');
      setSuggestions([]);
      setSelectedUser(null);
      setAccessList([]);
      setPublicShare(null);
    }
  }, [show, item]);

  const fetchAccessList = async () => {
    try {
      setFetchingAccess(true);
      const res = await api.get(`/share/item/${normalizedItemType}/${item.id}/access`);
      const allShares = res.data.data;

      const privates = [];
      let pShare = null;

      for (const s of allShares) {
        if (s.public_token) {
          pShare = s;
        } else {
          privates.push(s);
        }
      }

      setAccessList(privates);
      setPublicShare(pShare);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load access list');
    } finally {
      setFetchingAccess(false);
    }
  };

  const handleEmailChange = (e) => {
    const val = e.target.value;
    setEmailQuery(val);
    setSelectedUser(null);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (val.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await api.get(`/users/search?q=${encodeURIComponent(val)}`);
        setSuggestions(res.data.data);
        setShowSuggestions(true);
      } catch (err) {
        console.error(err);
      }
    }, 300);
  };

  const handleSelectUser = (u) => {
    setSelectedUser(u);
    setEmailQuery(u.email);
    setShowSuggestions(false);
  };

  const handleShare = async () => {
    if (!emailQuery) return;

    try {
      setLoading(true);
      await api.post('/share', {
        itemId: item.id,
        itemType: normalizedItemType,
        accessType: 'private',
        sharedWith: emailQuery,
        permission,
      });

      toast.success('Shared successfully');
      setEmailQuery('');
      setSelectedUser(null);
      fetchAccessList();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Unable to share file. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePermission = async (shareId, newPermission) => {
    try {
      await api.put(`/share/access/${shareId}`, {
        itemType: normalizedItemType,
        permission: newPermission,
      });
      toast.success('Permission updated');
      fetchAccessList();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update permission');
    }
  };

  const handleRemoveAccess = async (shareId) => {
    try {
      await api.delete(`/share/${normalizedItemType}/${shareId}`);
      toast.success('Access removed');
      fetchAccessList();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove access');
    }
  };

  const handleEnablePublic = async () => {
    if (isPublicEnabled) return;

    try {
      setPublicLoading(true);
      await api.post('/share', {
        itemId: item.id,
        itemType: normalizedItemType,
        accessType: 'public',
        permission: 'read',
      });
      toast.success('Public link enabled');
      await fetchAccessList();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to enable public link');
    } finally {
      setPublicLoading(false);
    }
  };

  const handleDisablePublic = async () => {
    if (!publicShare) return;

    try {
      setPublicLoading(true);
      await api.delete(`/share/${normalizedItemType}/${publicShare.id}`);
      toast.success('Public access disabled');
      await fetchAccessList();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to disable public link');
    } finally {
      setPublicLoading(false);
    }
  };

  const handlePublicToggle = async (enabled) => {
    if (publicLoading || fetchingAccess) return;
    if (enabled) {
      await handleEnablePublic();
    } else {
      await handleDisablePublic();
    }
  };

  const handleCopyLink = async () => {
    if (!publicShare?.public_token) return;

    try {
      await copyPublicShareLink(publicShare.public_token);
      toast.success('Link copied to clipboard');
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  const isOwner = item?.owner_id === user?.id;

  return (
    <Modal show={show} onHide={onHide} centered size="md">
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="fs-5 fw-bold d-flex align-items-center gap-2">
          <FiUsers /> Share &quot;{item?.original_name || item?.name}&quot;
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <div className="mb-4 position-relative">
          <Form.Group>
            <div className="d-flex gap-2">
              <div className="flex-grow-1 position-relative">
                <Form.Control
                  type="email"
                  placeholder="Add people via email"
                  value={emailQuery}
                  onChange={handleEmailChange}
                  onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                />

                {showSuggestions && suggestions.length > 0 && (
                  <ListGroup className="position-absolute w-100 mt-1 shadow-sm" style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
                    {suggestions.map((s) => (
                      <ListGroup.Item
                        key={s.id}
                        action
                        onClick={() => handleSelectUser(s)}
                        className="d-flex flex-column py-1"
                      >
                        <span className="fw-medium">{s.name}</span>
                        <small className="text-muted">{s.email}</small>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                )}
              </div>

              <Form.Select
                style={{ width: '120px' }}
                value={permission}
                onChange={(e) => setPermission(e.target.value)}
              >
                <option value="read">Viewer</option>
                <option value="edit">Editor</option>
              </Form.Select>
            </div>
          </Form.Group>

          <div className="mt-3 text-end">
            <Button
              variant="primary"
              onClick={handleShare}
              disabled={loading || !emailQuery}
              className="px-4 rounded-pill"
            >
              {loading ? <Spinner size="sm" /> : 'Share'}
            </Button>
          </div>
        </div>

        <div>
          <h6 className="fw-bold mb-3">People with access</h6>

          <div className="d-flex align-items-center justify-content-between mb-3">
            <div className="d-flex align-items-center gap-3">
              <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px' }}>
                <FiUser />
              </div>
              <div>
                <div className="fw-medium">{isOwner ? `${user?.name} (You)` : 'Owner'}</div>
                <div className="text-muted" style={{ fontSize: '0.8rem' }}>{isOwner ? user?.email : 'owner@domain.com'}</div>
              </div>
            </div>
            <div className="text-muted" style={{ fontSize: '0.9rem' }}>Owner</div>
          </div>

          {fetchingAccess ? (
            <div className="text-center py-3"><Spinner size="sm" className="text-muted" /></div>
          ) : accessList.length === 0 ? (
            <div className="text-center py-3 text-muted" style={{ fontSize: '0.9rem' }}>
              Not shared privately with anyone yet.
            </div>
          ) : (
            accessList.map((share) => (
              <div key={share.id} className="d-flex align-items-center justify-content-between mb-3">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-light text-secondary rounded-circle d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px' }}>
                    {share.shared_with_name ? share.shared_with_name.charAt(0).toUpperCase() : <FiUser />}
                  </div>
                  <div>
                    <div className="fw-medium">{share.shared_with_name || 'Unknown User'}</div>
                    <div className="text-muted" style={{ fontSize: '0.8rem' }}>{share.shared_with_email}</div>
                  </div>
                </div>

                {isOwner ? (
                  <Dropdown>
                    <Dropdown.Toggle variant="light" size="sm" className="border-0 bg-transparent text-dark d-flex align-items-center gap-1">
                      {share.permission === 'edit' ? 'Editor' : 'Viewer'}
                    </Dropdown.Toggle>
                    <Dropdown.Menu align="end">
                      <Dropdown.Item onClick={() => handleChangePermission(share.id, 'read')}>
                        Viewer
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => handleChangePermission(share.id, 'edit')}>
                        Editor
                      </Dropdown.Item>
                      <Dropdown.Divider />
                      <Dropdown.Item className="text-danger" onClick={() => handleRemoveAccess(share.id)}>
                        <FiTrash2 className="me-2" /> Remove access
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                ) : (
                  <div className="text-muted" style={{ fontSize: '0.9rem' }}>
                    {share.permission === 'edit' ? 'Editor' : 'Viewer'}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <hr className="my-4" />

        <div>
          <h6 className="fw-bold mb-3">General access</h6>

          {fetchingAccess ? (
            <div className="text-center py-3"><Spinner size="sm" className="text-muted" /></div>
          ) : (
            <div className={`border rounded-3 p-3 ${isPublicEnabled ? 'bg-light' : ''}`}>
              {isOwner ? (
                <Form.Check
                  type="checkbox"
                  id="public-access-toggle"
                  className="mb-0"
                  checked={isPublicEnabled}
                  disabled={publicLoading}
                  onChange={(e) => handlePublicToggle(e.target.checked)}
                  label={
                    <span className="fw-semibold">
                      Anyone with the link
                      {publicLoading && <Spinner size="sm" className="ms-2" />}
                    </span>
                  }
                />
              ) : (
                <div className="fw-semibold d-flex align-items-center gap-2">
                  {isPublicEnabled ? <FiGlobe className="text-primary" /> : <FiLock className="text-secondary" />}
                  {isPublicEnabled ? 'Anyone with the link' : 'Restricted'}
                </div>
              )}

              <div className={`small fw-medium mt-1 ${isPublicEnabled ? 'text-success' : 'text-muted'}`}>
                Public Access: {isPublicEnabled ? 'ON' : 'OFF'}
              </div>

              {isPublicEnabled ? (
                <>
                  <div className="text-muted mt-2 mb-3" style={{ fontSize: '0.8rem' }}>
                    Anyone on the internet with the link can view
                  </div>

                  <Form.Group className="mb-2">
                    <Form.Label className="small text-muted mb-1">Link</Form.Label>
                    <Form.Control
                      type="text"
                      readOnly
                      value={publicLink}
                      className="bg-white font-monospace"
                      style={{ fontSize: '0.85rem' }}
                    />
                  </Form.Group>

                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="d-flex align-items-center gap-2"
                    onClick={handleCopyLink}
                  >
                    <FiCopy /> Copy Link
                  </Button>
                </>
              ) : (
                <>
                  <div className="d-flex align-items-center gap-3 mt-3">
                    <div className="bg-light text-secondary rounded-circle d-flex align-items-center justify-content-center border" style={{ width: '40px', height: '40px' }}>
                      <FiLock />
                    </div>
                    <div className="flex-grow-1">
                      <div className="fw-semibold">Restricted</div>
                      <div className="text-muted mt-1" style={{ fontSize: '0.8rem' }}>
                        Only people with access can open with the link
                      </div>
                    </div>
                  </div>

                  {isOwner && (
                    <div className="mt-3">
                      <Button
                        variant="primary"
                        size="sm"
                        className="d-flex align-items-center gap-2"
                        onClick={handleEnablePublic}
                        disabled={publicLoading}
                      >
                        {publicLoading ? <Spinner size="sm" /> : <><FiLink /> Enable Public Link</>}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </Modal.Body>

      <Modal.Footer className="border-0 pt-0 bg-light rounded-bottom d-flex justify-content-end">
        <Button variant="primary" onClick={onHide} className="rounded-pill px-4">
          Done
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
